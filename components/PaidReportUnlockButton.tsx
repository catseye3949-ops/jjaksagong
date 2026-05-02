"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import type { Gender } from "../lib/domain/user";
import { DEMO_REPORT_PRICE_WON } from "../lib/billing";

type PaidReportUnlockButtonProps = {
  name: string;
  birthdate: string;
  birthtime: string;
  gender: Gender;
};

function buildCheckoutPath(p: PaidReportUnlockButtonProps) {
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
  const router = useRouter();
  const { user, isReady } = useAuth();

  const onClick = () => {
    if (!isReady) return;
    const next = buildCheckoutPath(props);
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    router.push(next);
  };

  const priceLabel = `${DEMO_REPORT_PRICE_WON.toLocaleString("ko-KR")}원`;

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
    </div>
  );
}
