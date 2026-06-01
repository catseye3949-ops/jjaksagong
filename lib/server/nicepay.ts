import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Gender } from "@/lib/domain/user";
import { PREMIUM_REPORT_PRICE_WON } from "@/lib/billing";

export const NICEPAY_GOODS_NAME = "프리미엄 리포트";
export const NICEPAY_METHOD = "card";
export const NICEPAY_APPROVAL_ENDPOINT = "https://api.nicepay.co.kr/v1/payments";

export type NicepayReservedPayload = {
  v: 1;
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  targetName: string;
  targetBirthDate: string;
  targetBirthtime: string;
  targetGender: Gender;
  dayPillar: string;
  issuedAt: string;
};

export type NicepayReturnForm = {
  authResultCode?: string;
  authResultMsg?: string;
  tid?: string;
  clientId?: string;
  orderId?: string;
  amount?: string;
  mallReserved?: string;
  authToken?: string;
  signature?: string;
};

export type NicepayApprovalResponse = {
  resultCode?: string;
  resultMsg?: string;
  tid?: string;
  orderId?: string;
  ediDate?: string;
  signature?: string;
  status?: string;
  paidAt?: string;
  failedAt?: string;
  payMethod?: string;
  amount?: number;
  goodsName?: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  receiptUrl?: string;
};

function nicepaySecretKey() {
  return process.env.NICE_SECRET_KEY?.trim() ?? "";
}

export function nicepayClientKey() {
  return process.env.NEXT_PUBLIC_NICE_CLIENT_KEY?.trim() ?? "";
}

function mallReservedSecret() {
  return (
    process.env.JJAK_SESSION_SECRET ||
    nicepaySecretKey() ||
    "jjak-dev-session-secret-change-in-production"
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signMallReserved(payload: NicepayReservedPayload) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", mallReservedSecret())
    .update(encoded)
    .digest("hex");
  return `${encoded}.${signature}`;
}

export function verifyMallReserved(raw: string): NicepayReservedPayload | null {
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  const expected = createHmac("sha256", mallReservedSecret())
    .update(encoded)
    .digest("hex");
  if (!safeEqualHex(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as NicepayReservedPayload;
    if (
      payload.v !== 1 ||
      !payload.orderId ||
      !payload.buyerEmail ||
      !payload.targetBirthDate ||
      !payload.dayPillar ||
      (payload.targetGender !== "male" && payload.targetGender !== "female")
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getServiceOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
    /\/$/,
    "",
  );
  if (vercelProduction) return `https://${vercelProduction}`;

  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export function parseNicepayAmount(raw: string | undefined) {
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

export function verifyAuthSignature(form: NicepayReturnForm) {
  const secretKey = nicepaySecretKey();
  if (!secretKey) return false;
  if (!form.authToken || !form.clientId || !form.amount || !form.signature) {
    return false;
  }
  const expected = createHash("sha256")
    .update(`${form.authToken}${form.clientId}${form.amount}${secretKey}`)
    .digest("hex");
  return safeEqualHex(form.signature, expected);
}

export function verifyApprovalSignature(response: NicepayApprovalResponse) {
  const secretKey = nicepaySecretKey();
  if (
    !secretKey ||
    !response.tid ||
    typeof response.amount !== "number" ||
    !response.ediDate ||
    !response.signature
  ) {
    return false;
  }
  const expected = createHash("sha256")
    .update(`${response.tid}${response.amount}${response.ediDate}${secretKey}`)
    .digest("hex");
  return safeEqualHex(response.signature, expected);
}

export async function approveNicepayPayment(tid: string) {
  const clientKey = nicepayClientKey();
  const secretKey = nicepaySecretKey();
  if (!clientKey || !secretKey) {
    return {
      ok: false as const,
      error: "나이스페이 환경변수가 설정되지 않았습니다.",
      status: 500,
    };
  }

  const credentials = Buffer.from(`${clientKey}:${secretKey}`, "utf8").toString(
    "base64",
  );
  const response = await fetch(
    `${NICEPAY_APPROVAL_ENDPOINT}/${encodeURIComponent(tid)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: PREMIUM_REPORT_PRICE_WON }),
    },
  );

  const data = (await response.json().catch(() => null)) as
    | NicepayApprovalResponse
    | null;
  if (!response.ok || !data) {
    return {
      ok: false as const,
      error: "나이스페이 승인 API 호출에 실패했습니다.",
      status: 502,
    };
  }
  if (data.resultCode !== "0000" || data.status !== "paid") {
    return {
      ok: false as const,
      error: data.resultMsg || "나이스페이 결제 승인이 실패했습니다.",
      status: 400,
    };
  }
  if (data.amount !== PREMIUM_REPORT_PRICE_WON) {
    return {
      ok: false as const,
      error: "승인 금액이 요청 금액과 일치하지 않습니다.",
      status: 400,
    };
  }
  if (!verifyApprovalSignature(data)) {
    return {
      ok: false as const,
      error: "나이스페이 승인 응답 서명이 올바르지 않습니다.",
      status: 400,
    };
  }

  return { ok: true as const, data };
}
