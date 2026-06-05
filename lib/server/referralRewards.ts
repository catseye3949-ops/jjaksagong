import "server-only";

import { REFERRAL_REWARD_POINTS_ON_REFEREE_FIRST_PURCHASE } from "@/lib/domain/user";
import { supabaseServer, supabaseServerAuthMode } from "@/lib/server/supabaseAdmin";

export type GrantReferralRewardInput = {
  buyerEmail: string;
  /** Nicepay orderId (`premium-...`) — dedup key */
  purchaseId: string;
};

export type GrantReferralRewardResult =
  | {
      ok: true;
      granted: boolean;
      reason:
        | "granted"
        | "no_referrer"
        | "self_referral"
        | "referrer_not_found"
        | "already_rewarded_for_buyer"
        | "already_rewarded_for_purchase"
        | "not_first_purchase";
      referrerEmail?: string;
      rewardPoints?: number;
    }
  | { ok: false; error: string; details?: string };

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function normalizeReferralCode(raw: string | null | undefined) {
  const t = (raw ?? "").trim().toUpperCase();
  return t.length ? t : null;
}

export async function grantReferralRewardOnPurchase(
  input: GrantReferralRewardInput,
): Promise<GrantReferralRewardResult> {
  const client = supabaseServer();
  const buyerEmail = normalizeEmail(input.buyerEmail);
  const purchaseId = input.purchaseId.trim();

  console.log("[referral:grant] start", {
    buyerEmail,
    purchaseId,
    authMode: supabaseServerAuthMode(),
  });

  if (!client) {
    return { ok: false, error: "supabase_unavailable" };
  }
  if (!buyerEmail || !purchaseId) {
    return { ok: false, error: "invalid_input" };
  }

  const { data: existingByPurchase, error: existingByPurchaseError } = await client
    .from("referral_rewards")
    .select("id, buyer_email, referrer_email")
    .eq("purchase_id", purchaseId)
    .maybeSingle();

  if (existingByPurchaseError) {
    console.error("[referral:grant] existing purchase lookup failed", {
      message: existingByPurchaseError.message,
      code: existingByPurchaseError.code,
      details: existingByPurchaseError.details,
    });
    return {
      ok: false,
      error: "referral_rewards_lookup_failed",
      details: existingByPurchaseError.message,
    };
  }
  if (existingByPurchase) {
    console.log("[referral:grant] skip already_rewarded_for_purchase", {
      purchaseId,
      existing: existingByPurchase,
    });
    return { ok: true, granted: false, reason: "already_rewarded_for_purchase" };
  }

  const { data: existingByBuyer, error: existingByBuyerError } = await client
    .from("referral_rewards")
    .select("id, purchase_id")
    .eq("buyer_email", buyerEmail)
    .maybeSingle();

  if (existingByBuyerError) {
    console.error("[referral:grant] existing buyer lookup failed", {
      message: existingByBuyerError.message,
      code: existingByBuyerError.code,
    });
    return {
      ok: false,
      error: "referral_rewards_lookup_failed",
      details: existingByBuyerError.message,
    };
  }
  if (existingByBuyer) {
    console.log("[referral:grant] skip already_rewarded_for_buyer", {
      buyerEmail,
      existing: existingByBuyer,
    });
    return { ok: true, granted: false, reason: "already_rewarded_for_buyer" };
  }

  const { count: purchaseCount, error: purchaseCountError } = await client
    .from("purchases")
    .select("*", { count: "exact", head: true })
    .eq("email", buyerEmail);

  if (purchaseCountError) {
    console.error("[referral:grant] purchase count failed", purchaseCountError);
    return {
      ok: false,
      error: "purchase_count_failed",
      details: purchaseCountError.message,
    };
  }
  if ((purchaseCount ?? 0) > 1) {
    console.log("[referral:grant] skip not_first_purchase", {
      buyerEmail,
      purchaseCount,
    });
    return { ok: true, granted: false, reason: "not_first_purchase" };
  }

  const { data: buyerRow, error: buyerError } = await client
    .from("users")
    .select("email, referred_by")
    .eq("email", buyerEmail)
    .maybeSingle();

  if (buyerError) {
    console.error("[referral:grant] buyer lookup failed", buyerError);
    return { ok: false, error: "buyer_lookup_failed", details: buyerError.message };
  }

  const referredByCode = normalizeReferralCode(
    (buyerRow as { referred_by?: string | null } | null)?.referred_by,
  );
  if (!referredByCode) {
    console.log("[referral:grant] skip no_referrer", { buyerEmail });
    return { ok: true, granted: false, reason: "no_referrer" };
  }

  const { data: referrerRows, error: referrerError } = await client
    .from("users")
    .select("email, referral_code, referral_reward_balance, referral_success_count")
    .eq("referral_code", referredByCode);

  if (referrerError) {
    console.error("[referral:grant] referrer lookup failed", referrerError);
    return {
      ok: false,
      error: "referrer_lookup_failed",
      details: referrerError.message,
    };
  }

  const referrer = (referrerRows ?? []).find(
    (row) =>
      normalizeReferralCode(
        String((row as { referral_code?: string | null }).referral_code ?? ""),
      ) === referredByCode,
  ) as
    | {
        email?: string;
        referral_code?: string | null;
        referral_reward_balance?: number | null;
        referral_success_count?: number | null;
      }
    | undefined;

  if (!referrer?.email) {
    console.warn("[referral:grant] skip referrer_not_found", {
      buyerEmail,
      referredByCode,
      referrerRows,
    });
    return { ok: true, granted: false, reason: "referrer_not_found" };
  }

  const referrerEmail = normalizeEmail(referrer.email);
  if (referrerEmail === buyerEmail) {
    console.log("[referral:grant] skip self_referral", { buyerEmail, referrerEmail });
    return { ok: true, granted: false, reason: "self_referral" };
  }

  const rewardPoints = REFERRAL_REWARD_POINTS_ON_REFEREE_FIRST_PURCHASE;
  const { error: insertError } = await client.from("referral_rewards").insert({
    purchase_id: purchaseId,
    buyer_email: buyerEmail,
    referrer_email: referrerEmail,
    reward_points: rewardPoints,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    const duplicate =
      insertError.code === "23505" ||
      insertError.message.toLowerCase().includes("duplicate");
    if (duplicate) {
      console.warn("[referral:grant] duplicate insert ignored", {
        purchaseId,
        buyerEmail,
        message: insertError.message,
      });
      return {
        ok: true,
        granted: false,
        reason: insertError.message.includes("purchase_id")
          ? "already_rewarded_for_purchase"
          : "already_rewarded_for_buyer",
      };
    }
    console.error("[referral:grant] insert failed", insertError);
    return {
      ok: false,
      error: "referral_reward_insert_failed",
      details: insertError.message,
    };
  }

  const nextPointBalance =
    (typeof referrer.referral_reward_balance === "number"
      ? referrer.referral_reward_balance
      : 0) + rewardPoints;
  const nextSuccessCount =
    (typeof referrer.referral_success_count === "number"
      ? referrer.referral_success_count
      : 0) + 1;

  const { error: updateError } = await client
    .from("users")
    .update({
      referral_reward_balance: nextPointBalance,
      referral_success_count: nextSuccessCount,
    })
    .eq("email", referrerEmail);

  if (updateError) {
    console.error("[referral:grant] referrer balance update failed", {
      referrerEmail,
      nextPointBalance,
      nextSuccessCount,
      message: updateError.message,
      code: updateError.code,
      authMode: supabaseServerAuthMode(),
    });
    return {
      ok: false,
      error: "referrer_balance_update_failed",
      details: updateError.message,
    };
  }

  console.log("[referral:grant] success", {
    buyerEmail,
    purchaseId,
    referrerEmail,
    rewardPoints,
    nextPointBalance,
    nextSuccessCount,
    authMode: supabaseServerAuthMode(),
  });

  return {
    ok: true,
    granted: true,
    reason: "granted",
    referrerEmail,
    rewardPoints,
  };
}
