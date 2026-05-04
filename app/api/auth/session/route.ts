import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserAccount } from "@/lib/domain/user";
import {
  getSessionCookieWriteOptions,
  JJAK_SESSION_COOKIE,
  signSessionToken,
} from "@/lib/auth/sessionToken";
import { verifyUserCredentials } from "@/lib/auth/verifyUserCredentials";

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      users?: Record<string, UserAccount>;
    };
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const users = body.users;
    if (!email || !users || typeof users !== "object") {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const acc = await verifyUserCredentials(users, email, password);
    if (!acc) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const token = signSessionToken(acc.email, acc.purchasedReports);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(
      JJAK_SESSION_COOKIE,
      token,
      getSessionCookieWriteOptions(SESSION_MAX_AGE),
    );
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(JJAK_SESSION_COOKIE, "", {
    ...getSessionCookieWriteOptions(0),
    maxAge: 0,
  });
  return res;
}
