import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JJAK_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/sessionToken";
import { PREMIUM_REPORT_PRICE_WON } from "@/lib/billing";
import { calculateIlju } from "@/lib/calculateIlju";
import type { Gender } from "@/lib/domain/user";
import {
  getServiceOrigin,
  NICEPAY_GOODS_NAME,
  NICEPAY_METHOD,
  nicepayClientKey,
  signMallReserved,
  type NicepayReservedPayload,
} from "@/lib/server/nicepay";
import { hasPurchasedReportForBirthAndPillar } from "@/lib/server/supabasePurchases";

type NicepayOrderRequest = {
  buyerName?: string;
  targetName?: string;
  birthdate?: string;
  birthtime?: string;
  gender?: string;
};

function normalizeGender(raw: string | undefined): Gender {
  return raw === "female" ? "female" : "male";
}

export async function POST(request: Request) {
  try {
    const clientKey = nicepayClientKey();
    if (!clientKey || !process.env.NICE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { ok: false, error: "nicepay_env_missing" },
        { status: 500 },
      );
    }

    const cookieStore = await cookies();
    const rawSession = cookieStore.get(JJAK_SESSION_COOKIE)?.value;
    const session = rawSession ? verifySessionToken(rawSession) : null;
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "session_required" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as NicepayOrderRequest;
    const targetName = String(body.targetName ?? "").trim() || "이 사람";
    const targetBirthDate = String(body.birthdate ?? "").trim();
    const targetBirthtime = String(body.birthtime ?? "").trim();
    const targetGender = normalizeGender(body.gender);
    const dayPillar = calculateIlju(targetBirthDate, targetBirthtime);

    if (!targetBirthDate || !dayPillar) {
      return NextResponse.json(
        { ok: false, error: "invalid_report_target" },
        { status: 400 },
      );
    }

    const buyerEmail = session.sub.trim().toLowerCase();
    const alreadyPurchased = await hasPurchasedReportForBirthAndPillar(
      buyerEmail,
      targetBirthDate,
      dayPillar,
    );
    if (alreadyPurchased) {
      return NextResponse.json(
        { ok: false, error: "already_purchased" },
        { status: 409 },
      );
    }

    const orderId = `premium-${randomUUID()}`;
    const payload: NicepayReservedPayload = {
      v: 1,
      orderId,
      buyerEmail,
      buyerName: String(body.buyerName ?? "").trim() || "사용자",
      targetName,
      targetBirthDate,
      targetBirthtime,
      targetGender,
      dayPillar,
      issuedAt: new Date().toISOString(),
    };

    const origin = getServiceOrigin(request);
    return NextResponse.json({
      ok: true,
      clientId: clientKey,
      method: NICEPAY_METHOD,
      orderId,
      amount: PREMIUM_REPORT_PRICE_WON,
      goodsName: NICEPAY_GOODS_NAME,
      returnUrl: `${origin}/api/nicepay/return`,
      mallReserved: signMallReserved(payload),
      buyerName: payload.buyerName,
      buyerEmail,
      mallUserId: buyerEmail.slice(0, 20),
      language: "KO",
    });
  } catch (error) {
    console.error("[nicepay:order] failed", error);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
