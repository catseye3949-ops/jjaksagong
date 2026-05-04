import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserAccount } from "@/lib/domain/user";
import {
  getSessionCookieWriteOptions,
  JJAK_SESSION_COOKIE,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/sessionToken";

const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(JJAK_SESSION_COOKIE)?.value;
    const verified = raw ? verifySessionToken(raw) : null;
    if (!verified) {
      return NextResponse.json({ ok: false, error: "session_required" }, { status: 401 });
    }

    const body = (await request.json()) as {
      users?: Record<string, UserAccount>;
    };
    const users = body.users;
    if (!users || typeof users !== "object") {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const acc = users[verified.sub];
    if (!acc || acc.email.trim().toLowerCase() !== verified.sub) {
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
