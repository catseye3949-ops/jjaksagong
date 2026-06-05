import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Gender } from "@/lib/domain/user";
import { PREMIUM_REPORT_PRICE_WON } from "@/lib/billing";
import { resolvePaymentMode } from "@/lib/paymentMode";

export const NICEPAY_GOODS_NAME = "프리미엄 리포트";
export const NICEPAY_METHOD = "card";
export const NICEPAY_LIVE_APPROVAL_ENDPOINT =
  "https://api.nicepay.co.kr/v1/payments";
export const NICEPAY_TEST_APPROVAL_ENDPOINT =
  "https://sandbox-api.nicepay.co.kr/v1/payments";

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

export type NicepayApprovalFailure = {
  ok: false;
  error: string;
  status: number;
  resultCode?: string;
  resultMsg?: string;
  responseStatus?: number;
  responseBody?: string;
  tid?: string;
  amount?: number | string;
  orderId?: string;
  approvalUrl?: string;
  paymentMode?: string;
  reachedApprovalFetch?: boolean;
  errorMessage?: string;
  errorStack?: string;
};

function nicepaySecretKey() {
  return process.env.NICEPAY_SECRET_KEY?.trim() ?? "";
}

export function nicepayClientKey() {
  return process.env.NEXT_PUBLIC_NICEPAY_CLIENT_KEY?.trim() ?? "";
}

export function nicepayApprovalEndpoint() {
  const paymentMode = resolvePaymentMode();
  return paymentMode.mode === "nicepay-test"
    ? NICEPAY_TEST_APPROVAL_ENDPOINT
    : NICEPAY_LIVE_APPROVAL_ENDPOINT;
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

export type AuthSignatureVerification = {
  ok: boolean;
  received?: string;
  expected?: string;
  reason?: string;
};

/** Server 승인 2-transaction returnUrl signature: hex(sha256(authToken + clientId + amount + SecretKey)) */
export function verifyAuthSignatureDetailed(
  form: NicepayReturnForm,
): AuthSignatureVerification {
  const secretKey = nicepaySecretKey();
  if (!secretKey) {
    return { ok: false, reason: "missing_secret_key" };
  }
  if (!form.authToken || !form.clientId || !form.amount || !form.signature) {
    return {
      ok: false,
      reason: "missing_fields",
      received: form.signature?.trim(),
    };
  }

  const expected = createHash("sha256")
    .update(`${form.authToken}${form.clientId}${form.amount}${secretKey}`)
    .digest("hex");
  const received = form.signature.trim();
  const ok = safeEqualHex(received, expected);
  return {
    ok,
    received,
    expected,
    reason: ok ? undefined : "mismatch",
  };
}

export function verifyAuthSignature(form: NicepayReturnForm) {
  return verifyAuthSignatureDetailed(form).ok;
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

export async function approveNicepayPayment(
  tid: string,
  context: { amount?: number | string; orderId?: string } = {},
) {
  const clientKey = nicepayClientKey();
  const secretKey = nicepaySecretKey();
  const paymentMode = resolvePaymentMode();
  const approvalEndpoint = nicepayApprovalEndpoint();
  const approvalUrl = `${approvalEndpoint}/${encodeURIComponent(tid)}`;
  const requestAmount = context.amount ?? PREMIUM_REPORT_PRICE_WON;
  if (!clientKey || !secretKey) {
    console.error("[nicepay:approval] missing env", {
      paymentMode: paymentMode.mode,
      approvalUrl,
      tid,
      amount: requestAmount,
      orderId: context.orderId ?? null,
      authorizationScheme: "Basic",
      clientKeyPrefix: clientKey.slice(0, 6),
      "NICEPAY_SECRET_KEY.exists": Boolean(secretKey),
      "NICEPAY_SECRET_KEY.prefix": secretKey.slice(0, 6),
      nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    });
    return {
      ok: false as const,
      error: "나이스페이 환경변수가 설정되지 않았습니다.",
      status: 500,
      tid,
      amount: requestAmount,
      orderId: context.orderId,
      approvalUrl,
      paymentMode: paymentMode.mode,
      reachedApprovalFetch: false,
    } satisfies NicepayApprovalFailure;
  }

  const credentials = Buffer.from(`${clientKey}:${secretKey}`, "utf8").toString(
    "base64",
  );
  const authorizationHeader = `Basic ${credentials}`;
  const authorizationPrefix = authorizationHeader.slice(0, 10);

  console.log("[nicepay] before approval fetch", {
    approvalUrl,
    approvalUrlType: typeof approvalUrl,
    approvalEndpoint,
    paymentMode: paymentMode.mode,
    tid,
    amount: requestAmount,
    orderId: context.orderId ?? null,
    authorizationScheme: "Basic",
    authorizationPrefix,
    clientKeyPrefix: clientKey.slice(0, 6),
    "NICEPAY_SECRET_KEY.exists": Boolean(secretKey),
    "NICEPAY_SECRET_KEY.prefix": secretKey.slice(0, 6),
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });

  let response: Response;
  try {
    response = await fetch(approvalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: authorizationHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: PREMIUM_REPORT_PRICE_WON }),
    });
    console.log("[nicepay] approval response received");
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[nicepay] approval fetch error", {
      message: err.message,
      stack: err.stack,
    });
    return {
      ok: false as const,
      error: "나이스페이 승인 API 호출 중 네트워크 오류가 발생했습니다.",
      status: 502,
      resultMsg: err.message,
      tid,
      amount: requestAmount,
      orderId: context.orderId,
      approvalUrl,
      paymentMode: paymentMode.mode,
      reachedApprovalFetch: true,
      errorMessage: err.message,
      errorStack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    } satisfies NicepayApprovalFailure;
  }

  const responseBody = await response.text();
  let data: NicepayApprovalResponse | null = null;
  try {
    data = JSON.parse(responseBody) as NicepayApprovalResponse;
  } catch {
    data = null;
  }

  console.log("[nicepay:approval] response", {
    paymentMode: paymentMode.mode,
    approvalUrl,
    "response.status": response.status,
    "response.body": responseBody,
    resultCode: data?.resultCode ?? null,
    resultMsg: data?.resultMsg ?? null,
    tid: data?.tid ?? tid,
    amount: data?.amount ?? requestAmount,
    orderId: data?.orderId ?? context.orderId ?? null,
    authorizationScheme: "Basic",
    authorizationPrefix,
    clientKeyPrefix: clientKey.slice(0, 6),
    "NICEPAY_SECRET_KEY.exists": Boolean(secretKey),
    "NICEPAY_SECRET_KEY.prefix": secretKey.slice(0, 6),
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });

  if (!response.ok || !data) {
    return {
      ok: false as const,
      error: "나이스페이 승인 API 호출에 실패했습니다.",
      status: 502,
      resultCode: data?.resultCode,
      resultMsg: data?.resultMsg ?? (!data ? responseBody : undefined),
      responseStatus: response.status,
      responseBody,
      tid: data?.tid ?? tid,
      amount: data?.amount ?? requestAmount,
      orderId: data?.orderId ?? context.orderId,
      approvalUrl,
      paymentMode: paymentMode.mode,
      reachedApprovalFetch: true,
    } satisfies NicepayApprovalFailure;
  }
  if (data.resultCode !== "0000" || data.status !== "paid") {
    return {
      ok: false as const,
      error: data.resultMsg || "나이스페이 결제 승인이 실패했습니다.",
      status: 400,
      resultCode: data.resultCode,
      resultMsg: data.resultMsg,
      responseStatus: response.status,
      responseBody,
      tid: data.tid ?? tid,
      amount: data.amount ?? requestAmount,
      orderId: data.orderId ?? context.orderId,
      approvalUrl,
      paymentMode: paymentMode.mode,
      reachedApprovalFetch: true,
    } satisfies NicepayApprovalFailure;
  }
  if (data.amount !== PREMIUM_REPORT_PRICE_WON) {
    return {
      ok: false as const,
      error: "승인 금액이 요청 금액과 일치하지 않습니다.",
      status: 400,
      resultCode: data.resultCode,
      resultMsg: data.resultMsg,
      responseStatus: response.status,
      responseBody,
      tid: data.tid ?? tid,
      amount: data.amount ?? requestAmount,
      orderId: data.orderId ?? context.orderId,
      approvalUrl,
      paymentMode: paymentMode.mode,
      reachedApprovalFetch: true,
    } satisfies NicepayApprovalFailure;
  }
  if (!verifyApprovalSignature(data)) {
    return {
      ok: false as const,
      error: "나이스페이 승인 응답 서명이 올바르지 않습니다.",
      status: 400,
      resultCode: data.resultCode,
      resultMsg: data.resultMsg,
      responseStatus: response.status,
      responseBody,
      tid: data.tid ?? tid,
      amount: data.amount ?? requestAmount,
      orderId: data.orderId ?? context.orderId,
      approvalUrl,
      paymentMode: paymentMode.mode,
      reachedApprovalFetch: true,
    } satisfies NicepayApprovalFailure;
  }

  return { ok: true as const, data };
}
