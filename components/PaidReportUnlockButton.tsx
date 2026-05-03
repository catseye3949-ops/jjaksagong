"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import type { Gender } from "../lib/domain/user";
import { DEMO_REPORT_PRICE_WON } from "../lib/billing";

export type PaidReportUnlockButtonProps = {
  name: string;
  birthdate: string;
  birthtime: string;
  gender: Gender;
  /** 프리미엄 카드 오버레이용 단일 CTA 문구 */
  variant?: "default" | "overlay";
};

function buildCheckoutPath(p: Omit<PaidReportUnlockButtonProps, "variant">) {
  const q = new URLSearchParams();
  if (p.name) q.set("name", p.name);
  q.set("birthdate", p.birthdate);
  if (p.birthtime) q.set("birthtime", p.birthtime);
  q.set("gender", p.gender);
  return `/checkout?${q.toString()}`;
}

export default function PaidReportUnlockButton(
  props: PaidReportUnlockButtonProps,
) {
  const { variant = "default", ...checkoutFields } = props;
  const router = useRouter();
  const { user, isReady } = useAuth();

  const checkoutNext = buildCheckoutPath(checkoutFields);
  const loginNext = `/login?next=${encodeURIComponent(checkoutNext)}`;
  const signupNext = `/signup?next=${encodeURIComponent(checkoutNext)}`;

  const onClick = () => {
    if (!isReady) return;
    if (!user) {
      router.push(loginNext);
      return;
    }
    router.push(checkoutNext);
  };

  const priceLabel = `${DEMO_REPORT_PRICE_WON.toLocaleString("ko-KR")}원`;

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-fuchsia-300/40 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-5 py-3.5 text-center shadow-[0_14px_48px_rgba(217,70,239,0.42)] ring-1 ring-white/15 transition duration-300 hover:scale-[1.02] hover:shadow-[0_18px_56px_rgba(217,70,239,0.5)] sm:py-4"
      >
        <span className="text-sm font-bold leading-snug text-white sm:text-base">
          이 사람 공략 리포트 열기
          <span className="mx-1.5 text-white/50">·</span>
          <span className="tabular-nums text-white">{priceLabel}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-1 sm:px-0">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl border border-fuchsia-300/40 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-6 py-4 text-center shadow-[0_14px_48px_rgba(217,70,239,0.42)] ring-1 ring-white/15 transition duration-300 hover:scale-[1.02] hover:shadow-[0_18px_56px_rgba(217,70,239,0.5)] sm:py-5"
      >
        <span className="text-[11px] font-medium text-white/75">
          마이페이지에 남는 프리미엄 리포트
        </span>
        <span className="text-base font-bold leading-snug text-white sm:text-lg">
          이 사람 공략 리포트 영구 저장하기
          <span className="mx-1.5 text-white/50">·</span>
          <span className="tabular-nums text-white">{priceLabel}</span>
        </span>
      </button>
      <p className="text-center text-xs leading-relaxed text-white/50">
        로그인 후 결제하면 마이페이지에 남고, 언제든 다시 열어볼 수 있어요.
        <span className="block text-white/35">
          (현재는 PG 없이 데모 결제만 제공)
        </span>
      </p>
      <p className="text-center text-xs leading-relaxed text-white/45">
        계정이 없으면{" "}
        <Link href={signupNext} className="text-fuchsia-200 underline-offset-4 hover:underline">
          회원가입
        </Link>
        , 이미 있으면{" "}
        <Link href={loginNext} className="text-fuchsia-200 underline-offset-4 hover:underline">
          로그인
        </Link>
        후 같은 결제 화면으로 돌아옵니다.
      </p>
    </div>
  );
}
