import { type NextRequest, NextResponse } from "next/server";
import { PREMIUM_REPORT_PRICE_WON } from "@/lib/billing";
import { resolvePaymentMode } from "@/lib/paymentMode";
import {
  approveNicepayPayment,
  getServiceOrigin,
  nicepayApprovalEndpoint,
  nicepayClientKey,
  parseNicepayAmount,
  verifyAuthSignatureDetailed,
  verifyMallReserved,
  type NicepayReturnForm,
} from "@/lib/server/nicepay";
import { grantReferralRewardOnPurchase } from "@/lib/server/referralRewards";
import {
  hasPurchasedReportForBirthAndPillar,
  storePremiumReportPurchase,
  type StorePremiumReportPurchaseInput,
} from "@/lib/server/supabasePurchases";

const processingOrderIds = new Map<string, number>();
const PROCESSING_ORDER_TTL_MS = 10 * 60 * 1000;

type ReservedOrderLike = {
  orderId: string;
  buyerEmail: string;
  targetName: string;
  targetGender: StorePremiumReportPurchaseInput["targetGender"];
  targetBirthDate: string;
  dayPillar: string;
};

async function grantReferralRewardSafely(
  reserved: ReservedOrderLike,
  context: string,
  paymentMode: string,
) {
  console.log("[referral:grant] CALLING", {
    buyerEmail: reserved.buyerEmail,
    orderId: reserved.orderId,
    paymentMode,
  });

  console.log(`[nicepay:return] grantReferralRewardOnPurchase call (${context})`, {
    buyerEmail: reserved.buyerEmail,
    orderId: reserved.orderId,
    purchaseId: reserved.orderId,
    paymentMode,
  });

  try {
    const referral = await grantReferralRewardOnPurchase({
      buyerEmail: reserved.buyerEmail,
      purchaseId: reserved.orderId,
    });
    if (!referral.ok) {
      console.error(`[nicepay:return] referral grant failed (${context})`, {
        ...referral,
        buyerEmail: reserved.buyerEmail,
        orderId: reserved.orderId,
        paymentMode,
      });
    } else {
      console.log(`[nicepay:return] referral grant result (${context})`, {
        ...referral,
        buyerEmail: reserved.buyerEmail,
        orderId: reserved.orderId,
        paymentMode,
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[nicepay:return] referral grant failed (${context})`, {
      message: err.message,
      stack: err.stack,
      buyerEmail: reserved.buyerEmail,
      orderId: reserved.orderId,
      paymentMode,
    });
  }
}

async function storePurchaseAndGrantReferral(
  reserved: ReservedOrderLike,
  context: string,
  paymentMode: string,
) {
  const stored = await storePremiumReportPurchase({
    email: reserved.buyerEmail,
    targetName: reserved.targetName,
    targetGender: reserved.targetGender,
    targetBirthDate: reserved.targetBirthDate,
    dayPillar: reserved.dayPillar,
  });
  if (!stored.ok) {
    return stored;
  }

  await grantReferralRewardSafely(reserved, context, paymentMode);
  return stored;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlMessage(
  message: string,
  status = 400,
  details?: {
    resultCode?: string;
    resultMsg?: string;
    responseStatus?: number;
    responseBody?: string;
    tid?: string;
    amount?: number | string;
    orderId?: string;
    approvalUrl?: string;
    paymentMode?: string;
    authResultCode?: string;
    authResultMsg?: string;
    reachedApprovalFetch?: boolean;
    receivedSignature?: string;
    expectedSignature?: string;
    errorMessage?: string;
    errorStack?: string;
  },
) {
  const detailRows = [
    ["resultCode", details?.resultCode],
    ["resultMsg", details?.resultMsg],
    ["response.status", details?.responseStatus],
    ["response.body", details?.responseBody],
    ["tid", details?.tid],
    ["amount", details?.amount],
    ["orderId", details?.orderId],
    ["approvalUrl", details?.approvalUrl],
    ["paymentMode", details?.paymentMode],
    ["authResultCode", details?.authResultCode],
    ["authResultMsg", details?.authResultMsg],
    ["reachedApprovalFetch", details?.reachedApprovalFetch],
    ["receivedSignature", details?.receivedSignature],
    ["expectedSignature", details?.expectedSignature],
    ["error.message", details?.errorMessage],
    ["error.stack", details?.errorStack],
  ];
  const detailHtml =
    details
      ? `<dl style="margin-top:20px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa">${detailRows
          .map(([label, value]) => {
            const displayValue =
              value === undefined || value === null || String(value) === ""
                ? "-"
                : String(value);
            return `<dt style="font-weight:700">${escapeHtml(String(label))}</dt><dd style="margin:4px 0 12px;white-space:pre-wrap;word-break:break-all">${escapeHtml(displayValue)}</dd>`;
          })
          .join("")}</dl>`
      : "";
  return new NextResponse(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>결제 오류</title></head><body><main style="font-family:system-ui,sans-serif;max-width:560px;margin:64px auto;padding:0 20px;line-height:1.6"><h1>결제를 완료하지 못했습니다</h1><p>${escapeHtml(message)}</p>${detailHtml}<p><a href="/main">처음으로 돌아가기</a></p></main></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

function buildApprovalDebugDetails(
  paymentMode: string,
  form?: Partial<NicepayReturnForm>,
  extra?: {
    resultCode?: string;
    resultMsg?: string;
    responseStatus?: number;
    responseBody?: string;
    authResultCode?: string;
    authResultMsg?: string;
    reachedApprovalFetch?: boolean;
    receivedSignature?: string;
    expectedSignature?: string;
    errorMessage?: string;
    errorStack?: string;
  },
) {
  const tid = form?.tid || "";
  return {
    resultCode: extra?.resultCode,
    resultMsg: extra?.resultMsg,
    responseStatus: extra?.responseStatus,
    responseBody: extra?.responseBody,
    tid,
    amount: form?.amount,
    orderId: form?.orderId,
    approvalUrl: tid
      ? `${nicepayApprovalEndpoint()}/${encodeURIComponent(tid)}`
      : nicepayApprovalEndpoint(),
    paymentMode,
    authResultCode: extra?.authResultCode ?? form?.authResultCode,
    authResultMsg: extra?.authResultMsg ?? form?.authResultMsg,
    reachedApprovalFetch: extra?.reachedApprovalFetch ?? false,
    receivedSignature: extra?.receivedSignature,
    expectedSignature: extra?.expectedSignature,
    errorMessage: extra?.errorMessage,
    errorStack:
      process.env.NODE_ENV === "development" ? extra?.errorStack : undefined,
  };
}

function logReturnFailure(
  reason: string,
  paymentMode: string,
  form?: Partial<NicepayReturnForm>,
  extra?: {
    resultCode?: string;
    resultMsg?: string;
    responseStatus?: number;
    responseBody?: string;
    authResultCode?: string;
    authResultMsg?: string;
    reachedApprovalFetch?: boolean;
    receivedSignature?: string;
    expectedSignature?: string;
    errorMessage?: string;
    errorStack?: string;
  },
) {
  const details = buildApprovalDebugDetails(paymentMode, form, extra);
  console.error("[nicepay:return] failure details", {
    reason,
    ...details,
    clientKeyPrefix: nicepayClientKey().slice(0, 6),
    "NICEPAY_SECRET_KEY.exists": Boolean(process.env.NICEPAY_SECRET_KEY?.trim()),
    "NICEPAY_SECRET_KEY.prefix": (process.env.NICEPAY_SECRET_KEY ?? "")
      .trim()
      .slice(0, 6),
    authorizationScheme: "Basic",
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  });
  return details;
}

function pickFormValue(
  entries: Record<string, FormDataEntryValue>,
  candidates: string[],
) {
  for (const key of candidates) {
    const value = entries[key];
    if (typeof value === "string" && value.trim()) {
      return { fieldName: key, value: value.trim() };
    }
  }
  return { fieldName: null, value: "" };
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
  q.set("from", "nicepay");
  return `${origin}/result?${q.toString()}`;
}

function cleanupProcessingOrderIds(now: number) {
  for (const [orderId, startedAt] of processingOrderIds) {
    if (now - startedAt > PROCESSING_ORDER_TTL_MS) {
      processingOrderIds.delete(orderId);
    }
  }
}

export async function POST(request: NextRequest) {
  let formForDebug: NicepayReturnForm | undefined;
  let paymentModeForDebug = "unknown";
  try {
    const paymentMode = resolvePaymentMode();
    paymentModeForDebug = paymentMode.mode;
    console.log("[nicepay:return] payment mode", {
      mode: paymentMode.mode,
      rawMode: paymentMode.rawMode,
      isValid: paymentMode.isValid,
      nodeEnv: process.env.NODE_ENV,
    });
    if (!paymentMode.isValid) {
      return htmlMessage("결제 모드 설정이 올바르지 않습니다.", 500, {
        paymentMode: paymentMode.mode,
        approvalUrl: nicepayApprovalEndpoint(),
        reachedApprovalFetch: false,
      });
    }
    if (paymentMode.isLiveBlockedOutsideProduction) {
      return htmlMessage(
        "개발 환경에서는 실결제를 진행할 수 없습니다. PG 테스트결제 모드로 변경해 주세요.",
        403,
        {
          paymentMode: paymentMode.mode,
          approvalUrl: nicepayApprovalEndpoint(),
          reachedApprovalFetch: false,
        },
      );
    }

    const formData = await request.formData();
    const rawFormEntries = Object.fromEntries(formData.entries());
    const rawSearchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

    console.log("[nicepay:return] raw post body", rawFormEntries);
    console.log("[nicepay:return] raw search params", rawSearchParams);

    const authResultCodeValue = pickFormValue(rawFormEntries, [
      "authResultCode",
      "AuthResultCode",
      "AUTHRESULTCODE",
      "resultCode",
      "ResultCode",
      "RESULTCODE",
      "auth_result_code",
      "resultCd",
      "ResultCd",
    ]);
    const authResultMsgValue = pickFormValue(rawFormEntries, [
      "authResultMsg",
      "AuthResultMsg",
      "AUTHRESULTMSG",
      "resultMsg",
      "ResultMsg",
      "RESULTMSG",
      "resultMessage",
      "message",
      "auth_result_msg",
    ]);
    const tidValue = pickFormValue(rawFormEntries, ["tid", "TID", "txTid", "TxTid"]);
    const clientIdValue = pickFormValue(rawFormEntries, [
      "clientId",
      "clientID",
      "ClientId",
      "CLIENTID",
    ]);
    const orderIdValue = pickFormValue(rawFormEntries, [
      "orderId",
      "OrderId",
      "ORDERID",
      "moid",
      "Moid",
    ]);
    const amountValue = pickFormValue(rawFormEntries, ["amount", "Amount", "Amt"]);
    const mallReservedValue = pickFormValue(rawFormEntries, [
      "mallReserved",
      "MallReserved",
      "mallReservedInfo",
      "reserved",
    ]);
    const authTokenValue = pickFormValue(rawFormEntries, [
      "authToken",
      "AuthToken",
      "AUTHTOKEN",
    ]);
    const signatureValue = pickFormValue(rawFormEntries, [
      "signature",
      "Signature",
      "SIGNATURE",
      "signData",
      "SignData",
    ]);

    console.log("[nicepay:return] resolved field names", {
      authResultCode: authResultCodeValue.fieldName,
      authResultMsg: authResultMsgValue.fieldName,
      tid: tidValue.fieldName,
      clientId: clientIdValue.fieldName,
      orderId: orderIdValue.fieldName,
      amount: amountValue.fieldName,
      mallReserved: mallReservedValue.fieldName,
      authToken: authTokenValue.fieldName,
      signature: signatureValue.fieldName,
    });

    const form: NicepayReturnForm = {
      authResultCode: authResultCodeValue.value,
      authResultMsg: authResultMsgValue.value,
      tid: tidValue.value,
      clientId: clientIdValue.value,
      orderId: orderIdValue.value,
      amount: amountValue.value,
      mallReserved: mallReservedValue.value,
      authToken: authTokenValue.value,
      signature: signatureValue.value,
    };
    formForDebug = form;

    console.log("[nicepay:return] start", {
      orderId: form.orderId,
      tid: form.tid,
      now: Date.now(),
    });

    console.log("[nicepay:return] received form", {
      authResultCode: form.authResultCode,
      authResultMsg: form.authResultMsg,
      tid: form.tid,
      amount: form.amount,
      orderId: form.orderId,
      clientId: form.clientId,
      signature: form.signature,
      paymentMode: paymentMode.mode,
      approvalUrl: form.tid
        ? `${nicepayApprovalEndpoint()}/${encodeURIComponent(form.tid)}`
        : nicepayApprovalEndpoint(),
      reachedApprovalFetch: false,
    });

    if (form.authResultCode && form.authResultCode !== "0000") {
      const details = logReturnFailure("auth_result_failed", paymentMode.mode, form, {
        resultCode: form.authResultCode,
        resultMsg: form.authResultMsg,
        authResultCode: form.authResultCode,
        authResultMsg: form.authResultMsg,
        reachedApprovalFetch: false,
      });
      return htmlMessage(
        form.authResultMsg || "나이스페이 결제 인증이 실패했습니다.",
        400,
        details,
      );
    }
    if (!form.authResultCode && form.tid) {
      console.warn("[nicepay:return] authResultCode missing; continuing to approval", {
        authResultCode: form.authResultCode,
        authResultMsg: form.authResultMsg,
        tid: form.tid,
        amount: form.amount,
        orderId: form.orderId,
        paymentMode: paymentMode.mode,
      });
    }
    if (!form.tid || !form.orderId || !form.mallReserved) {
      const details = logReturnFailure("missing_required_form_fields", paymentMode.mode, form);
      return htmlMessage("나이스페이 인증 응답에 필수 값이 없습니다.", 400, details);
    }

    const amount = parseNicepayAmount(form.amount);
    if (amount !== PREMIUM_REPORT_PRICE_WON) {
      const details = logReturnFailure("invalid_amount", paymentMode.mode, form, {
        resultMsg: `expected ${PREMIUM_REPORT_PRICE_WON}, received ${form.amount}`,
        reachedApprovalFetch: false,
      });
      return htmlMessage("결제 금액이 올바르지 않습니다.", 400, details);
    }
    if (form.clientId !== nicepayClientKey()) {
      const details = logReturnFailure("client_id_mismatch", paymentMode.mode, form);
      return htmlMessage("나이스페이 상점 식별자가 일치하지 않습니다.", 400, details);
    }

    const signatureCheck = verifyAuthSignatureDetailed(form);
    const receivedSignaturePrefix = signatureCheck.received?.slice(0, 8) ?? "-";
    const expectedSignaturePrefix = signatureCheck.expected?.slice(0, 8) ?? "-";
    const canContinueDespiteSignatureFailure =
      form.authResultCode === "0000" &&
      Boolean(form.tid && form.orderId && form.amount);

    console.log("[nicepay:return] signature verification", {
      ok: signatureCheck.ok,
      reason: signatureCheck.reason,
      authResultCode: form.authResultCode,
      authTokenPrefix: form.authToken?.slice(0, 8) ?? null,
      clientId: form.clientId,
      amount: form.amount,
      receivedSignaturePrefix,
      expectedSignaturePrefix,
      canContinueDespiteSignatureFailure,
      paymentMode: paymentMode.mode,
    });

    if (!signatureCheck.ok) {
      if (canContinueDespiteSignatureFailure) {
        console.warn(
          "[nicepay:return] auth signature mismatch; continuing to approval because authResultCode=0000",
          {
            receivedSignaturePrefix,
            expectedSignaturePrefix,
            tid: form.tid,
            orderId: form.orderId,
            amount: form.amount,
          },
        );
      } else {
        const details = logReturnFailure("auth_signature_invalid", paymentMode.mode, form, {
          resultMsg: signatureCheck.reason ?? "signature_mismatch",
          receivedSignature: receivedSignaturePrefix,
          expectedSignature: expectedSignaturePrefix,
          reachedApprovalFetch: false,
        });
        return htmlMessage(
          "나이스페이 인증 응답 서명이 올바르지 않습니다.",
          400,
          details,
        );
      }
    }

    const reserved = verifyMallReserved(form.mallReserved);
    if (!reserved || reserved.orderId !== form.orderId) {
      const details = logReturnFailure("mall_reserved_invalid", paymentMode.mode, form);
      return htmlMessage("주문 정보 검증에 실패했습니다.", 400, details);
    }

    const origin = getServiceOrigin(request);
    const now = Date.now();
    cleanupProcessingOrderIds(now);
    if (processingOrderIds.has(reserved.orderId)) {
      console.warn("[nicepay:return] duplicate orderId while processing", {
        orderId: reserved.orderId,
        tid: form.tid,
        now,
        startedAt: processingOrderIds.get(reserved.orderId),
      });
      return redirectSeeOther(resultLocation(origin, reserved));
    }

    processingOrderIds.set(reserved.orderId, now);
    try {
      const alreadyPurchased = await hasPurchasedReportForBirthAndPillar(
        reserved.buyerEmail,
        reserved.targetBirthDate,
        reserved.dayPillar,
      );
      if (alreadyPurchased) {
        console.log(
          "[nicepay:return] already purchased; skipping approval but granting referral",
          {
            orderId: reserved.orderId,
            buyerEmail: reserved.buyerEmail,
            tid: form.tid,
          },
        );
        await grantReferralRewardSafely(
          reserved,
          "already_purchased",
          paymentMode.mode,
        );
        return redirectSeeOther(resultLocation(origin, reserved));
      }

      console.log("[nicepay:return] before approveNicepayPayment", {
        authResultCode: form.authResultCode,
        authResultMsg: form.authResultMsg,
        tid: form.tid,
        amount: form.amount,
        orderId: form.orderId,
        clientId: form.clientId,
        signature: form.signature,
        paymentMode: paymentMode.mode,
        approvalUrl: `${nicepayApprovalEndpoint()}/${encodeURIComponent(form.tid)}`,
        reachedApprovalFetch: false,
      });

      const approval = await approveNicepayPayment(form.tid, {
        amount: form.amount,
        orderId: form.orderId,
      });
      if (!approval.ok) {
        console.error("[nicepay:return] approval failed", {
          paymentMode: approval.paymentMode,
          approvalUrl: approval.approvalUrl,
          "response.status": approval.responseStatus,
          "response.body": approval.responseBody,
          resultCode: approval.resultCode,
          resultMsg: approval.resultMsg,
          tid: approval.tid,
          amount: approval.amount,
          orderId: approval.orderId,
          errorMessage: approval.errorMessage,
          errorStack: approval.errorStack,
          authResultCode: form.authResultCode,
          authResultMsg: form.authResultMsg,
          reachedApprovalFetch: approval.reachedApprovalFetch,
        });

        if (approval.resultCode === "U112") {
          console.warn("[nicepay:return] orderId already approved; storing purchase", {
            orderId: reserved.orderId,
            tid: form.tid,
            resultCode: approval.resultCode,
            resultMsg: approval.resultMsg,
          });
          const stored = await storePurchaseAndGrantReferral(
            reserved,
            "u112",
            approval.paymentMode,
          );
          if (!stored.ok) {
            return htmlMessage(stored.error, stored.status, {
              resultCode: approval.resultCode,
              resultMsg: approval.resultMsg,
              responseStatus: approval.responseStatus,
              responseBody: approval.responseBody,
              tid: approval.tid,
              amount: approval.amount,
              orderId: approval.orderId,
              approvalUrl: approval.approvalUrl,
              paymentMode: approval.paymentMode,
              authResultCode: form.authResultCode,
              authResultMsg: form.authResultMsg,
              reachedApprovalFetch: approval.reachedApprovalFetch,
            });
          }
          return redirectSeeOther(resultLocation(origin, reserved));
        }

        return htmlMessage(approval.error, approval.status, {
          resultCode: approval.resultCode,
          resultMsg: approval.resultMsg,
          responseStatus: approval.responseStatus,
          responseBody: approval.responseBody,
          tid: approval.tid,
          amount: approval.amount,
          orderId: approval.orderId,
          approvalUrl: approval.approvalUrl,
          paymentMode: approval.paymentMode,
          authResultCode: form.authResultCode,
          authResultMsg: form.authResultMsg,
          reachedApprovalFetch: approval.reachedApprovalFetch,
          errorMessage: approval.errorMessage,
          errorStack: approval.errorStack,
        });
      }
      if (approval.data.orderId !== reserved.orderId) {
        return htmlMessage("승인된 주문번호가 요청 주문번호와 일치하지 않습니다.");
      }

      const stored = await storePurchaseAndGrantReferral(
        reserved,
        "approved",
        paymentMode.mode,
      );
      if (!stored.ok) {
        return htmlMessage(stored.error, stored.status);
      }

      return redirectSeeOther(resultLocation(origin, reserved));
    } finally {
      processingOrderIds.delete(reserved.orderId);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[nicepay:return] failed", {
      message: err.message,
      stack: err.stack,
      authResultCode: formForDebug?.authResultCode,
      authResultMsg: formForDebug?.authResultMsg,
      tid: formForDebug?.tid,
      amount: formForDebug?.amount,
      orderId: formForDebug?.orderId,
      clientId: formForDebug?.clientId,
      signature: formForDebug?.signature,
      paymentMode: paymentModeForDebug,
      reachedApprovalFetch: false,
    });
    return htmlMessage("결제 처리 중 서버 오류가 발생했습니다.", 500, {
      authResultCode: formForDebug?.authResultCode,
      authResultMsg: formForDebug?.authResultMsg,
      tid: formForDebug?.tid,
      amount: formForDebug?.amount,
      orderId: formForDebug?.orderId,
      approvalUrl: formForDebug?.tid
        ? `${nicepayApprovalEndpoint()}/${encodeURIComponent(formForDebug.tid)}`
        : nicepayApprovalEndpoint(),
      paymentMode: paymentModeForDebug,
      reachedApprovalFetch: false,
      errorMessage: err.message,
      errorStack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}
