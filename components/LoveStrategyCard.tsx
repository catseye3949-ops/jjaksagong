import type { ReactNode } from "react";
import { Camera, MessageCircle } from "lucide-react";

type LoveStrategyCardProps = {
  title: string;
  hookLabel?: string;
  oneLineHook?: string;
  practicalTips?: {
    key: string;
    title: string;
    emoji: string;
    content: string;
  }[];
  sections: {
    key: string;
    label: string;
    content: string;
  }[];
  isPaid: boolean;
  /** 결제 전 오버레이 안에 표시 (checkout 등) */
  unlockSlot?: ReactNode;
};

export default function LoveStrategyCard({
  title,
  hookLabel,
  oneLineHook,
  practicalTips,
  sections,
  isPaid,
  unlockSlot,
}: LoveStrategyCardProps) {
  const premiumBody = (
    <>
      {oneLineHook ? (
        <div className="mt-4 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-400/10 p-4 shadow-[0_8px_24px_rgba(217,70,239,0.15)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100/85">
            {hookLabel || "사로잡을 수 있는 한 마디"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-7 text-white/95">{oneLineHook}</p>
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {practicalTips && practicalTips.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {practicalTips.map((tip) => (
              <div
                key={tip.key}
                className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-fuchsia-100">
                  {tip.key === "contact" ? (
                    <MessageCircle
                      className="h-[19px] w-[19px] shrink-0 text-pink-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <Camera
                      className="h-[19px] w-[19px] shrink-0 text-pink-400"
                      aria-hidden="true"
                    />
                  )}
                  {tip.title.replace(/^[^\p{L}\p{N}]+/u, "").trim()}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/85">{tip.content}</p>
              </div>
            ))}
          </div>
        ) : null}

        {sections.map((section) => (
          <div key={section.key}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
              {section.label}
            </p>
            <p
              className={
                section.key === "steps"
                  ? "mt-1 text-sm leading-7 text-white/80 whitespace-pre-line"
                  : "mt-1 text-sm leading-7 text-white/80"
              }
            >
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-pink-500/10 p-7 shadow-[0_20px_80px_rgba(90,24,154,0.35)] backdrop-blur-xl md:rounded-[28px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-fuchsia-300/45 bg-gradient-to-r from-pink-500/25 via-fuchsia-500/30 to-violet-500/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.25)]">
          Premium
        </span>
        <span className="text-[11px] font-semibold text-fuchsia-100/90">프리미엄 리포트</span>
        {isPaid ? (
          <span className="inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100/95">
            내 컬렉션에 저장됨
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/55">
            잠금 미리보기
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-fuchsia-200/95">연애 공략</p>
      <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>

      {isPaid ? (
        premiumBody
      ) : (
        <div className="relative mt-1 min-h-[12rem]">
          <div className="blur-md select-none">{premiumBody}</div>
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#0b1020]/55 px-4 py-6 text-center sm:px-6">
            <p className="text-base font-semibold text-white">프리미엄 연애 공략 리포트</p>
            <p className="max-w-sm text-sm leading-relaxed text-white/85">
              결제 후 전체 공략법을 확인할 수 있어요
            </p>
            {unlockSlot ? (
              <div className="pointer-events-auto mt-3 w-full max-w-md">{unlockSlot}</div>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
