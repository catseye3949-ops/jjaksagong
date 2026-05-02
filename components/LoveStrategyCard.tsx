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
  /** Shown below the blurred preview when unpaid (e.g. login / checkout CTA) */
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
  return (
    <>
    <article
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-pink-500/10 backdrop-blur-xl shadow-[0_20px_80px_rgba(90,24,154,0.35)] p-7 ${!isPaid ? "pb-28 sm:pb-32" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-fuchsia-300/45 bg-gradient-to-r from-pink-500/25 via-fuchsia-500/30 to-violet-500/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.25)]">
          Premium
        </span>
        <span className="text-[11px] font-semibold text-fuchsia-100/90">
          프리미엄 리포트
        </span>
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

      {oneLineHook ? (
        <div className="mt-4 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-400/10 p-4 shadow-[0_8px_24px_rgba(217,70,239,0.15)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100/85">
            {hookLabel || "사로잡을 수 있는 한 마디"}
          </p>
          <p className="mt-2 text-sm font-semibold leading-7 text-white/95">
            {oneLineHook}
          </p>
        </div>
      ) : null}

      <div className={!isPaid ? "mt-5 space-y-5 blur-sm" : "mt-5 space-y-5"}>
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

      {!isPaid && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[38%] bg-gradient-to-t from-[#0b1020]/95 via-[#0b1020]/65 to-transparent" />
      )}

      {!isPaid && (
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-fuchsia-300/25 bg-[#120f1f]/88 p-4 text-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <p className="text-sm font-semibold leading-snug text-white">
            이 리포트는 내 컬렉션에 저장됩니다
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/65">
            한 번 결제하면 언제든 다시 확인할 수 있어요
          </p>
          <p className="mt-2 text-xs leading-relaxed text-fuchsia-100/90">
            결제 후 언제든 마이페이지에서 다시 확인할 수 있어요
          </p>
        </div>
      )}
    </article>

    {!isPaid && unlockSlot ? (
      <div className="mt-4 w-full">{unlockSlot}</div>
    ) : null}
    </>
  );
}
