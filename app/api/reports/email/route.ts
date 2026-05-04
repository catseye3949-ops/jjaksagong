import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JJAK_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/sessionToken";
import { buildPurchasedReportResultHref } from "@/lib/buildPurchasedReportResultHref";
import { sendReportEmail } from "@/lib/email/sendReportEmail";
import { buildPurchasedReportEmailText } from "@/lib/server/buildPurchasedReportEmailBody";

const EMAIL_SUBJECT = "[짝사공] 저장한 연애 공략 리포트가 도착했어요";

function simpleEmailValid(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function originFromRequest(request: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      reportId?: string;
      email?: string;
    };
    const reportId = String(body.reportId ?? "").trim();
    const toEmail = String(body.email ?? "").trim();
    if (!reportId || !toEmail) {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }
    if (!simpleEmailValid(toEmail)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const raw = cookieStore.get(JJAK_SESSION_COOKIE)?.value;
    const session = raw ? verifySessionToken(raw) : null;
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "session_required" },
        { status: 401 },
      );
    }

    const report = session.reports.find((r) => r.id === reportId);
    if (!report) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const origin = originFromRequest(request);
    const path = buildPurchasedReportResultHref(report);
    const resultAbsoluteUrl = `${origin}${path}`;

    const { textPlain } = buildPurchasedReportEmailText({
      report,
      isPremium: true,
      resultAbsoluteUrl,
    });

    const send = await sendReportEmail({
      to: toEmail,
      subject: EMAIL_SUBJECT,
      text: textPlain,
    });

    if (!send.ok) {
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
