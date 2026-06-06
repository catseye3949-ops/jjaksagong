import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JJAK_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/sessionToken";
import { PREMIUM_REPORT_PRICE_WON } from "@/lib/billing";
import { calculateIlju } from "@/lib/calculateIlju";
import type { Gender } from "@/lib/domain/user";
import {
  normalizeDayPillarForPurchase,
  normalizeTargetBirthDateForPurchase,
} from "@/lib/purchaseBirthNormalize";
import {
  hasSupabaseServiceRoleKey,
  supabaseServer,
} from "@/lib/server/supabaseAdmin";

const POINT_REPORT_PRICE = PREMIUM_REPORT_PRICE_WON;

type PointsPurchaseRequest = {
  targetName?: string;
  birthdate?: string;
  birthtime?: string;
  gender?: string;
};

function normalizeGender(raw: string | undefined): Gender {
  return raw === "female" ? "female" : "male";
}

async function hasPurchasedReportForBirthAndPillarWithClient(
  client: NonNullable<ReturnType<typeof supabaseServer>>,
  email: string,
  targetBirthDate: string,
  dayPillar: string,
) {
  const wantBirth = normalizeTargetBirthDateForPurchase(targetBirthDate);
  const wantPillar = normalizeDayPillarForPurchase(dayPillar);
  if (!wantBirth || !wantPillar) return false;

  const { data, error } = await client
    .from("purchases")
    .select("target_birth_date, day_pillar")
    .eq("email", email);

  if (error) {
    throw error;
  }

  return (data ?? []).some((row) => {
    const rowBirth = normalizeTargetBirthDateForPurchase(
      String(
        (row as { target_birth_date?: string | null }).target_birth_date ?? "",
      ),
    );
    const rowPillar = normalizeDayPillarForPurchase(
      (row as { day_pillar?: string | null }).day_pillar,
    );
    return rowBirth === wantBirth && rowPillar === wantPillar;
  });
}

async function getSessionEmail() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(JJAK_SESSION_COOKIE)?.value;
  const session = rawSession ? verifySessionToken(rawSession) : null;
  return session?.sub.trim().toLowerCase() || null;
}

export async function GET() {
  const buyerEmail = await getSessionEmail();
  if (!buyerEmail) {
    return NextResponse.json(
      { ok: false, error: "session_required" },
      { status: 401 },
    );
  }

  if (!hasSupabaseServiceRoleKey()) {
    return NextResponse.json(
      { ok: false, error: "service_role_required" },
      { status: 500 },
    );
  }

  const client = supabaseServer();
  if (!client) {
    return NextResponse.json(
      { ok: false, error: "supabase_unavailable" },
      { status: 500 },
    );
  }

  const { data, error } = await client
    .from("users")
    .select("referral_reward_balance")
    .eq("email", buyerEmail)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "balance_fetch_failed" },
      { status: 502 },
    );
  }

  const row = data as { referral_reward_balance?: number | null } | null;
  return NextResponse.json({
    ok: true,
    referralRewardBalance:
      typeof row?.referral_reward_balance === "number"
        ? row.referral_reward_balance
        : 0,
    pointPrice: POINT_REPORT_PRICE,
  });
}

export async function POST(request: Request) {
  console.log("[points:purchase] start");

  try {
    const buyerEmail = await getSessionEmail();
    if (!buyerEmail) {
      return NextResponse.json(
        { ok: false, error: "session_required" },
        { status: 401 },
      );
    }

    if (!hasSupabaseServiceRoleKey()) {
      return NextResponse.json(
        { ok: false, error: "service_role_required" },
        { status: 500 },
      );
    }

    const client = supabaseServer();
    if (!client) {
      return NextResponse.json(
        { ok: false, error: "supabase_unavailable" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as PointsPurchaseRequest;
    const targetName = String(body.targetName ?? "").trim() || "이 사람";
    const targetBirthDate = String(body.birthdate ?? "").trim();
    const targetBirthtime = String(body.birthtime ?? "").trim();
    const targetGender = normalizeGender(body.gender);
    const dayPillar = calculateIlju(targetBirthDate, targetBirthtime);
    const birthNorm = normalizeTargetBirthDateForPurchase(targetBirthDate);
    const pillarNorm = normalizeDayPillarForPurchase(dayPillar);

    if (!birthNorm || !pillarNorm) {
      return NextResponse.json(
        { ok: false, error: "invalid_report_target" },
        { status: 400 },
      );
    }

    const { data: userRow, error: userError } = await client
      .from("users")
      .select("referral_reward_balance")
      .eq("email", buyerEmail)
      .maybeSingle();

    if (userError || !userRow) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: userError ? 502 : 404 },
      );
    }

    const currentBalance =
      typeof (userRow as { referral_reward_balance?: number | null })
        .referral_reward_balance === "number"
        ? (userRow as { referral_reward_balance: number }).referral_reward_balance
        : 0;

    if (currentBalance < POINT_REPORT_PRICE) {
      console.log("[points:purchase] insufficient_points", {
        buyerEmail,
        currentBalance,
        requiredPoints: POINT_REPORT_PRICE,
      });
      return NextResponse.json(
        { ok: false, error: "insufficient_points" },
        { status: 402 },
      );
    }

    const alreadyPurchased = await hasPurchasedReportForBirthAndPillarWithClient(
      client,
      buyerEmail,
      birthNorm,
      pillarNorm,
    );
    if (alreadyPurchased) {
      console.log("[points:purchase] already_purchased", {
        buyerEmail,
        targetBirthDate: birthNorm,
        dayPillar: pillarNorm,
      });
      return NextResponse.json(
        { ok: false, error: "already_purchased" },
        { status: 409 },
      );
    }

    const nextBalance = currentBalance - POINT_REPORT_PRICE;
    const { data: updatedUser, error: updateError } = await client
      .from("users")
      .update({ referral_reward_balance: nextBalance })
      .eq("email", buyerEmail)
      .eq("referral_reward_balance", currentBalance)
      .select("referral_reward_balance")
      .maybeSingle();

    if (updateError || !updatedUser) {
      console.log("[points:purchase] insufficient_points", {
        buyerEmail,
        currentBalance,
        requiredPoints: POINT_REPORT_PRICE,
        reason: updateError?.message ?? "balance_changed",
      });
      return NextResponse.json(
        { ok: false, error: "insufficient_points" },
        { status: 409 },
      );
    }

    const insertPayload = {
      email: buyerEmail,
      target_name: targetName,
      target_gender: targetGender,
      target_birth_date: birthNorm,
      day_pillar: pillarNorm,
      created_at: new Date().toISOString(),
    };

    const { data: purchaseRow, error: insertError } = await client
      .from("purchases")
      .insert(insertPayload)
      .select("*")
      .maybeSingle();

    if (insertError) {
      const { error: refundError } = await client
        .from("users")
        .update({ referral_reward_balance: currentBalance })
        .eq("email", buyerEmail)
        .eq("referral_reward_balance", nextBalance);

      console.error("[points:purchase] purchase_insert_failed", {
        buyerEmail,
        message: insertError.message,
        code: insertError.code,
        refundError,
      });
      return NextResponse.json(
        { ok: false, error: "purchase_record_failed" },
        { status: 502 },
      );
    }

    console.log("[points:purchase] success", {
      buyerEmail,
      targetBirthDate: birthNorm,
      dayPillar: pillarNorm,
      spentPoints: POINT_REPORT_PRICE,
      remainingPoints: nextBalance,
    });

    return NextResponse.json({
      ok: true,
      remainingPoints: nextBalance,
      purchase: purchaseRow,
    });
  } catch (error) {
    console.error("[points:purchase] failed", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
