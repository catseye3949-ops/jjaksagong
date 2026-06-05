"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AuthShell from "../../components/AuthShell";
import { useAuth } from "../../contexts/AuthContext";
import { PREMIUM_REPORT_PRICE_WON } from "../../lib/billing";
import { calculateIlju } from "../../lib/calculateIlju";
import type { Gender } from "../../lib/domain/user";
import { getPaymentModeMessage, resolvePaymentMode } from "../../lib/paymentMode";

const NICEPAY_CLIENT_KEY = process.env.NEXT_PUBLIC_NICEPAY_CLIENT_KEY ?? "";
const PAYMENT_MODE = resolvePaymentMode();

type NicepayOrderResponse =
  | {
      ok: true;
      method: string;
      orderId: string;
      amount: number;
      goodsName: string;
      returnUrl: string;
      mallReserved: string;
      buyerName: string;
      buyerEmail: string;
      mallUserId: string;
      language: "KO";
    }
  | { ok: false; error: string };

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [nicepayReady, setNicepayReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [hasRequestedPayment, setHasRequestedPayment] = useState(false);

  const name = searchParams.get("name")?.trim() || "";
  const birthdate = searchParams.get("birthdate") || "";
  const birthtime = searchParams.get("birthtime") || "";
  const genderParam = searchParams.get("gender");
  const gender: Gender = genderParam === "female" ? "female" : "male";

  const nextLogin = useMemo(
    () => `/login?next=${encodeURIComponent(`/checkout?${searchParams.toString()}`)}`,
    [searchParams],
  );

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(nextLogin);
    }
  }, [isReady, user, router, nextLogin]);

  const ilju = useMemo(
    () => calculateIlju(birthdate, birthtime) || "",
    [birthdate, birthtime],
  );

  const modeMessage = getPaymentModeMessage(PAYMENT_MODE.mode);
  const paymentModeError = !PAYMENT_MODE.isValid
    ? "결제 모드 설정이 올바르지 않습니다. NEXT_PUBLIC_PAYMENT_MODE는 nicepay-test 또는 nicepay-live만 사용할 수 있습니다."
    : PAYMENT_MODE.isLiveBlockedOutsideProduction
      ? "개발 환경에서는 실결제를 진행할 수 없습니다. NEXT_PUBLIC_PAYMENT_MODE를 nicepay-test로 변경해 주세요."
      : null;
  const canPurchase = Boolean(
    birthdate && ilju && user && !paymentModeError && !hasRequestedPayment,
  );

  const buildResultPath = () => {
    const q = new URLSearchParams();
    if (name) q.set("name", name);
    q.set("birthdate", birthdate);
    if (birthtime) q.set("birthtime", birthtime);
    q.set("gender", gender);
    return `/result?${q.toString()}`;
  };

  const onConfirm = async () => {
    if (!user) return;
    if (isPaying || hasRequestedPayment) return;
    setError(null);
    if (!birthdate || !ilju) {
      setError("생년월일 정보가 올바르지 않습니다. 다시 입력해 주세요.");
      return;
    }
    if (paymentModeError) {
      setError(paymentModeError);
      return;
    }
    if (!NICEPAY_CLIENT_KEY) {
      setError("나이스페이 클라이언트 키가 설정되지 않았습니다.");
      return;
    }
    if (!window.AUTHNICE?.requestPay) {
      setError("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setIsPaying(true);
    setHasRequestedPayment(true);
    try {
      const response = await fetch("/api/nicepay/order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: user.name || user.nickname || "사용자",
          targetName: name || "이 사람",
          birthdate,
          birthtime,
          gender,
        }),
      });
      const order = (await response.json()) as NicepayOrderResponse;
      if (!response.ok || !order.ok) {
        const orderError = order.ok ? "server_error" : order.error;
        if (orderError === "already_purchased") {
          router.push(buildResultPath());
          return;
        }
        setHasRequestedPayment(false);
        setError(
          orderError === "session_required"
            ? "로그인이 필요합니다. 다시 로그인해 주세요."
            : orderError === "invalid_payment_mode"
              ? "결제 모드 설정이 올바르지 않습니다."
              : orderError === "live_payment_blocked_in_development"
                ? "개발 환경에서는 실결제를 진행할 수 없습니다. PG 테스트결제 모드로 변경해 주세요."
                : "결제 주문을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      console.log("[checkout] AUTHNICE.requestPay", {
        paymentMode: PAYMENT_MODE.mode,
        clientKeyPrefix: NICEPAY_CLIENT_KEY.slice(0, 6),
      });
      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_KEY,
        method: order.method,
        orderId: order.orderId,
        amount: order.amount,
        goodsName: order.goodsName,
        returnUrl: order.returnUrl,
        mallReserved: order.mallReserved,
        mallUserId: order.mallUserId,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        language: order.language,
        fnError: (nicepayError) => {
          const message = nicepayError.errorMsg || "";
          if (message.includes("사용자 취소")) {
            setHasRequestedPayment(false);
            return;
          }
          setError(message || "결제창을 열지 못했습니다.");
          setHasRequestedPayment(false);
        },
      });
    } catch (e) {
      console.error("[checkout] NICEPAY request failed", e);
      setHasRequestedPayment(false);
      setError("결제창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsPaying(false);
    }
  };

  if (!isReady || !user) {
    return (
      <AuthShell title="결제" subtitle="로그인 확인 중…">
        <p className="text-sm text-white/55">잠시만 기다려주세요.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="프리미엄 리포트 결제"
      subtitle="나이스페이 결제 완료 후 리포트 전체가 열리고, 마이페이지에서 다시 볼 수 있어요."
    >
      <Script
        src="https://pay.nicepay.co.kr/v1/js/"
        strategy="afterInteractive"
        onLoad={() => setNicepayReady(true)}
        onError={() => setError("나이스페이 결제 모듈을 불러오지 못했습니다.")}
      />

      <Link
        href="/mypage"
        className="text-sm text-fuchsia-200/90 underline-offset-4 hover:underline"
      >
        ← 마이페이지
      </Link>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/50">리포트 금액</span>
          <span className="text-lg font-semibold text-white">
            {PREMIUM_REPORT_PRICE_WON.toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div>
          <p className="text-xs text-white/45">상대 정보</p>
          <p className="mt-1 font-medium text-white/90">
            {name || "이름 미입력"} · {birthdate || "—"}
          </p>
          <p className="mt-1 text-xs text-white/45">
            성별: {gender === "female" ? "여성" : "남성"}
            {birthtime ? ` · 출생시간: ${birthtime}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-3 text-xs leading-5 text-fuchsia-100/90">
          사용 가능 추천 포인트:{" "}
          <span className="font-semibold text-white">
            {user.referralRewardBalance.toLocaleString("ko-KR")}포인트
          </span>
          <br />
          적립된 포인트는 향후 리포트 구매 혜택에 사용할 수 있습니다.
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose-200/90" role="alert">
          {error}
        </p>
      ) : null}

      <p
        className={`mt-4 rounded-xl border px-4 py-3 text-center text-xs leading-5 ${
          PAYMENT_MODE.mode === "nicepay-live"
            ? "border-rose-300/30 bg-rose-500/10 text-rose-100"
            : "border-sky-300/30 bg-sky-500/10 text-sky-100"
        }`}
      >
        {modeMessage}
      </p>

      {paymentModeError ? (
        <p className="mt-3 text-center text-xs leading-5 text-rose-200/90">
          {paymentModeError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canPurchase || !nicepayReady || isPaying || hasRequestedPayment}
        onClick={onConfirm}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPaying || hasRequestedPayment ? "결제 진행 중..." : "3,900원 결제하기"}
      </button>

      <p className="mt-4 text-center text-xs text-white/45">
        <Link href={`/result?${searchParams.toString()}`} className="underline-offset-4 hover:underline">
          결과 페이지로 돌아가기
        </Link>
      </p>
    </AuthShell>
  );
}
