import { createHmac, timingSafeEqual } from "node:crypto";
import type { PurchasedReport } from "../domain/user";

const TOKEN_VERSION = 1 as const;

export type VerifiedSession = {
  sub: string;
  reports: PurchasedReport[];
};

function sessionSecret() {
  return (
    process.env.JJAK_SESSION_SECRET ||
    "jjak-dev-session-secret-change-in-production"
  );
}

function base64UrlEncode(data: Buffer | string): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
  return buf.toString("base64url");
}

function base64UrlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function slimPurchasedReportsForSession(
  reports: PurchasedReport[],
): Omit<PurchasedReport, "photoDataUrl">[] {
  return reports.map(({ photoDataUrl: _p, ...rest }) => rest);
}

export function signSessionToken(sub: string, reports: PurchasedReport[]) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14;
  const slim = slimPurchasedReportsForSession(reports);
  const payload = JSON.stringify({
    v: TOKEN_VERSION,
    sub,
    exp,
    reports: slim,
  });
  const payloadB64 = base64UrlEncode(payload);
  const sig = createHmac("sha256", sessionSecret())
    .update(payloadB64)
    .digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export function verifySessionToken(token: string): VerifiedSession | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  let sig: Buffer;
  try {
    sig = base64UrlDecode(sigB64);
  } catch {
    return null;
  }
  const expectedSig = createHmac("sha256", sessionSecret())
    .update(payloadB64)
    .digest();
  if (sig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(sig, expectedSig)) return null;

  try {
    const payload = JSON.parse(
      base64UrlDecode(payloadB64).toString("utf8"),
    ) as {
      v: number;
      sub: string;
      exp: number;
      reports: PurchasedReport[];
    };
    if (payload.v !== TOKEN_VERSION || typeof payload.sub !== "string") {
      return null;
    }
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    if (!Array.isArray(payload.reports)) return null;
    return { sub: payload.sub, reports: payload.reports };
  } catch {
    return null;
  }
}

export const JJAK_SESSION_COOKIE = "jjak_session";

export function getSessionCookieWriteOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
