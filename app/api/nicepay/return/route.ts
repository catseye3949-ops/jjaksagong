import { NextResponse } from "next/server";
import { PREMIUM_REPORT_PRICE_WON } from "@/lib/billing";
import {
  approveNicepayPayment,
  getServiceOrigin,
  nicepayClientKey,
  parseNicepayAmount,
  verifyAuthSignature,
  verifyMallReserved,
  type NicepayReturnForm,
} from "@/lib/server/nicepay";
import {
  hasPurchasedReportForBirthAndPillar,
  storePremiumReportPurchase,
} from "@/lib/server/supabasePurchases";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlMessage(message: string, status = 400) {
  return new NextResponse(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>결제 오류</title></head><body><main style="font-family:system-ui,sans-serif;max-width:560px;margin:64px auto;padding:0 20px;line-height:1.6"><h1>결제를 완료하지 못했습니다</h1><p>${escapeHtml(message)}</p><p><a href="/main">처음으로 돌아가기</a></p></main></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

function redirectSeeOther(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location },
  });
}

function resultLocation(origin: string, payload: ReturnType<typeof verifyMallReserved>) {
  if (!payload) return `${origin}/main`;
  const q = new URLSearchParams();
  q.set("name", payload.targetName);
  q.set("birthdate", payload.targetBirthDate);
  if (payload.targetBirthtime) q.set("birthtime", payload.targetBirthtime);
  q.set("gender", payload.targetGender);
  q.set("reportId", payload.orderId);
  return `${origin}/result?${q.toString()}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const form: NicepayReturnForm = {
      authResultCode: String(formData.get("authResultCode") ?? ""),
      authResultMsg: String(formData.get("authResultMsg") ?? ""),
      tid: String(formData.get("tid") ?? ""),
      clientId: String(formData.get("clientId") ?? ""),
      orderId: String(formData.get("orderId") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      mallReserved: String(formData.get("mallReserved") ?? ""),
      authToken: String(formData.get("authToken") ?? ""),
      signature: String(formData.get("signature") ?? ""),
    };

    if (form.authResultCode !== "0000") {
      return htmlMessage(
        form.authResultMsg || "나이스페이 결제 인증이 실패했습니다.",
      );
    }
    if (!form.tid || !form.orderId || !form.mallReserved) {
      return htmlMessage("나이스페이 인증 응답에 필수 값이 없습니다.");
    }

    const amount = parseNicepayAmount(form.amount);
    if (amount !== PREMIUM_REPORT_PRICE_WON) {
      return htmlMessage("결제 금액이 올바르지 않습니다.");
    }
    if (form.clientId !== nicepayClientKey()) {
      return htmlMessage("나이스페이 상점 식별자가 일치하지 않습니다.");
    }
    if (!verifyAuthSignature(form)) {
      return htmlMessage("나이스페이 인증 응답 서명이 올바르지 않습니다.");
    }

    const reserved = verifyMallReserved(form.mallReserved);
    if (!reserved || reserved.orderId !== form.orderId) {
      return htmlMessage("주문 정보 검증에 실패했습니다.");
    }

    const origin = getServiceOrigin(request);
    const alreadyPurchased = await hasPurchasedReportForBirthAndPillar(
      reserved.buyerEmail,
      reserved.targetBirthDate,
      reserved.dayPillar,
    );
    if (alreadyPurchased) {
      return redirectSeeOther(resultLocation(origin, reserved));
    }

    const approval = await approveNicepayPayment(form.tid);
    if (!approval.ok) {
      return htmlMessage(approval.error, approval.status);
    }
    if (approval.data.orderId !== reserved.orderId) {
      return htmlMessage("승인된 주문번호가 요청 주문번호와 일치하지 않습니다.");
    }

    const stored = await storePremiumReportPurchase({
      email: reserved.buyerEmail,
      targetName: reserved.targetName,
      targetGender: reserved.targetGender,
      targetBirthDate: reserved.targetBirthDate,
      dayPillar: reserved.dayPillar,
    });
    if (!stored.ok) {
      return htmlMessage(stored.error, stored.status);
    }

    return redirectSeeOther(resultLocation(origin, reserved));
  } catch (error) {
    console.error("[nicepay:return] failed", error);
    return htmlMessage("결제 처리 중 서버 오류가 발생했습니다.", 500);
  }
}
