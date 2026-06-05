import "server-only";

import { REFERRAL_REWARD_POINTS_ON_REFEREE_FIRST_PURCHASE } from "@/lib/domain/user";
import {
  hasSupabaseServiceRoleKey,
  supabaseServer,
  supabaseServerAuthMode,
} from "@/lib/server/supabaseAdmin";

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
  | { ok: false; error: string; details?: string; hint?: string };

type SupabaseErrorLike = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function normalizeReferralCode(raw: string | null | undefined) {
  const t = (raw ?? "").trim().toUpperCase();
  return t.length ? t : null;
}

function logGrantFailed(context: string, error: SupabaseErrorLike) {
  console.error(`[referral:grant] failed ${context}`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    authMode: supabaseServerAuthMode(),
    hasServiceRoleKey: hasSupabaseServiceRoleKey(),
  });
}

export async function grantReferralRewardOnPurchase(
  input: GrantReferralRewardInput,
): Promise<GrantReferralRewardResult> {
  console.log("[referral:grant] START");

  const buyerEmail = normalizeEmail(input.buyerEmail);
  const purchaseId = input.purchaseId.trim();
  const orderId = purchaseId;

  console.log("[referral:grant] start", {
    buyerEmail,
    purchaseId,
    orderId,
    authMode: supabaseServerAuthMode(),
    hasServiceRoleKey: hasSupabaseServiceRoleKey(),
  });

  try {
    if (!hasSupabaseServiceRoleKey()) {
      console.error("[referral:grant] service_role_missing", {
        buyerEmail,
        purchaseId,
        orderId,
        authMode: supabaseServerAuthMode(),
        hasServiceRoleKey: false,
      });
      return {
        ok: false,
        error: "service_role_missing",
        details: "SUPABASE_SERVICE_ROLE_KEY is not configured.",
      };
    }

    const client = supabaseServer();
    if (!client) {
      console.error("[referral:grant] failed supabase_unavailable", {
        message: "Supabase client is null",
        hasServiceRoleKey: hasSupabaseServiceRoleKey(),
      });
      return { ok: false, error: "supabase_unavailable" };
    }
    if (!buyerEmail || !purchaseId) {
      console.error("[referral:grant] failed invalid_input", {
        buyerEmail,
        purchaseId,
      });
      return { ok: false, error: "invalid_input" };
    }

    const { data: existingByPurchase, error: existingByPurchaseError } =
      await client
        .from("referral_rewards")
        .select("id, buyer_email, referrer_email")
        .eq("purchase_id", purchaseId)
        .maybeSingle();

    if (existingByPurchaseError) {
      logGrantFailed("existing_purchase_lookup", existingByPurchaseError);
      return {
        ok: false,
        error: "referral_rewards_lookup_failed",
        details: existingByPurchaseError.message,
        hint: existingByPurchaseError.hint ?? undefined,
      };
    }
    if (existingByPurchase) {
      console.log("[referral:grant] already_rewarded", {
        reason: "already_rewarded_for_purchase",
        purchaseId,
        orderId,
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
      logGrantFailed("existing_buyer_lookup", existingByBuyerError);
      return {
        ok: false,
        error: "referral_rewards_lookup_failed",
        details: existingByBuyerError.message,
        hint: existingByBuyerError.hint ?? undefined,
      };
    }
    if (existingByBuyer) {
      console.log("[referral:grant] already_rewarded", {
        reason: "already_rewarded_for_buyer",
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
      logGrantFailed("purchase_count", purchaseCountError);
      return {
        ok: false,
        error: "purchase_count_failed",
        details: purchaseCountError.message,
        hint: purchaseCountError.hint ?? undefined,
      };
    }

    console.log("[referral:grant] purchase_count", {
      buyerEmail,
      purchaseCount,
    });

    if ((purchaseCount ?? 0) > 1) {
      console.log("[referral:grant] not_first_purchase", {
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
      logGrantFailed("buyer_lookup", buyerError);
      return {
        ok: false,
        error: "buyer_lookup_failed",
        details: buyerError.message,
        hint: buyerError.hint ?? undefined,
      };
    }

    const referredByRaw = (buyerRow as { referred_by?: string | null } | null)
      ?.referred_by;
    const referredByCode = normalizeReferralCode(referredByRaw);

    console.log("[referral:grant] buyer referred_by lookup", {
      buyerEmail,
      buyerFound: Boolean(buyerRow),
      referredByRaw,
      referredByCode,
    });

    if (!referredByCode) {
      console.log("[referral:grant] no_referrer", {
        buyerEmail,
        referredByRaw,
        referredByCode,
      });
      return { ok: true, granted: false, reason: "no_referrer" };
    }

    const { data: referrerRows, error: referrerError } = await client
      .from("users")
      .select("email, referral_code, referral_reward_balance, referral_success_count")
      .eq("referral_code", referredByCode);

    if (referrerError) {
      logGrantFailed("referrer_lookup", referrerError);
      return {
        ok: false,
        error: "referrer_lookup_failed",
        details: referrerError.message,
        hint: referrerError.hint ?? undefined,
      };
    }

    console.log("[referral:grant] referrer lookup by code", {
      referredByCode,
      rowCount: (referrerRows ?? []).length,
      referrerRows: (referrerRows ?? []).map((row) => ({
        email: (row as { email?: string }).email,
        referral_code: (row as { referral_code?: string | null }).referral_code,
        referral_reward_balance: (row as { referral_reward_balance?: number | null })
          .referral_reward_balance,
      })),
    });

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
      console.warn("[referral:grant] referrer_not_found", {
        buyerEmail,
        referredByCode,
        referrerRows,
      });
      return { ok: true, granted: false, reason: "referrer_not_found" };
    }

    const referrerEmail = normalizeEmail(referrer.email);
    if (referrerEmail === buyerEmail) {
      console.log("[referral:grant] self_referral", {
        buyerEmail,
        referrerEmail,
      });
      return { ok: true, granted: false, reason: "self_referral" };
    }

    const rewardPoints = REFERRAL_REWARD_POINTS_ON_REFEREE_FIRST_PURCHASE;
    const insertPayload = {
      purchase_id: purchaseId,
      buyer_email: buyerEmail,
      referrer_email: referrerEmail,
      reward_points: rewardPoints,
      created_at: new Date().toISOString(),
    };

    console.log("[referral:grant] referral_rewards insert start", {
      insertPayload,
    });

    const { data: insertedRow, error: insertError } = await client
      .from("referral_rewards")
      .insert(insertPayload)
      .select("id, purchase_id, buyer_email, referrer_email, reward_points")
      .maybeSingle();

    if (insertError) {
      const duplicate =
        insertError.code === "23505" ||
        insertError.message.toLowerCase().includes("duplicate");
      if (duplicate) {
        console.warn("[referral:grant] duplicate insert ignored", {
          purchaseId,
          buyerEmail,
          message: insertError.message,
          hint: insertError.hint,
        });
        console.log("[referral:grant] already_rewarded", {
          reason: insertError.message.includes("purchase_id")
            ? "already_rewarded_for_purchase"
            : "already_rewarded_for_buyer",
          buyerEmail,
          purchaseId,
          orderId,
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
      logGrantFailed("referral_rewards_insert", insertError);
      console.error("[referral:grant] insert_failed", {
        buyerEmail,
        purchaseId,
        orderId,
        referrerEmail,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      return {
        ok: false,
        error: "referral_reward_insert_failed",
        details: insertError.message,
        hint: insertError.hint ?? undefined,
      };
    }

    console.log("[referral:grant] referral_rewards insert success", {
      insertedRow,
    });

    const previousPointBalance =
      typeof referrer.referral_reward_balance === "number"
        ? referrer.referral_reward_balance
        : 0;
    const previousSuccessCount =
      typeof referrer.referral_success_count === "number"
        ? referrer.referral_success_count
        : 0;
    const nextPointBalance = previousPointBalance + rewardPoints;
    const nextSuccessCount = previousSuccessCount + 1;

    console.log("[referral:grant] users.referral_reward_balance update start", {
      referrerEmail,
      previousPointBalance,
      rewardPoints,
      nextPointBalance,
      previousSuccessCount,
      nextSuccessCount,
    });

    const { data: updatedUser, error: updateError } = await client
      .from("users")
      .update({
        referral_reward_balance: nextPointBalance,
        referral_success_count: nextSuccessCount,
      })
      .eq("email", referrerEmail)
      .select("email, referral_reward_balance, referral_success_count")
      .maybeSingle();

    if (updateError) {
      logGrantFailed("users_referral_reward_balance_update", updateError);
      console.error("[referral:grant] update_failed", {
        buyerEmail,
        purchaseId,
        orderId,
        referrerEmail,
        nextPointBalance,
        nextSuccessCount,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      });
      return {
        ok: false,
        error: "referrer_balance_update_failed",
        details: updateError.message,
        hint: updateError.hint ?? undefined,
      };
    }

    console.log("[referral:grant] users.referral_reward_balance update success", {
      referrerEmail,
      updatedUser,
      nextPointBalance,
      nextSuccessCount,
    });

    console.log("[referral:grant] success", {
      buyerEmail,
      purchaseId,
      orderId,
      referrerEmail,
      referredByCode,
      rewardPoints,
      nextPointBalance,
      nextSuccessCount,
      authMode: supabaseServerAuthMode(),
      hasServiceRoleKey: hasSupabaseServiceRoleKey(),
    });

    return {
      ok: true,
      granted: true,
      reason: "granted",
      referrerEmail,
      rewardPoints,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[referral:grant] CRASH", error);
    console.error("[referral:grant] failed unexpected", {
      message: err.message,
      stack: err.stack,
      buyerEmail,
      purchaseId,
      orderId,
      authMode: supabaseServerAuthMode(),
      hasServiceRoleKey: hasSupabaseServiceRoleKey(),
    });
    return {
      ok: false,
      error: "unexpected_error",
      details: err.message,
    };
  }
}
