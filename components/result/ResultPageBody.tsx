"use client";

import Link from "next/link";
import PaidReportUnlockButton from "@/components/PaidReportUnlockButton";
import LoveStrategyCard from "@/components/LoveStrategyCard";
import PartnerStrategyPhoto from "@/components/PartnerStrategyPhoto";
import type { Gender } from "@/lib/domain/user";
import { useResultIsPaid } from "@/components/result/ResultIsPaidGate";

export type ResultPageBodyProps = {
  name: string;
  gender: Gender;
  birthdate: string;
  birthtime: string;
  reportId: string;
  dayPillar: string | null;
  dayPillarFromQuery: string | null;
  canOfferPurchase: boolean;
  subjectLine: string;
  basicTitle: string;
  oneLineHook: string;
  strategySections: { key: string; label: string; content: string }[];
  practicalTips: {
    key: string;
    title: string;
    emoji: string;
    content: string;
  }[];
  card: {
    basicCard?: {
      title: string;
      oneLine: string;
      summary: string;
      traits: string[];
      relationship: string;
      insight: string;
    };
    loveStrategy?: unknown;
  } | null;
};

export default function ResultPageBody(props: ResultPageBodyProps) {
  const isPaid = useResultIsPaid();
  const {
    name,
    gender,
    birthdate,
    birthtime,
    reportId,
    dayPillar,
    dayPillarFromQuery,
    canOfferPurchase,
    subjectLine,
    basicTitle,
    oneLineHook,
    strategySections,
    practicalTips,
    card,
  } = props;

  return (
    <>
      <section className="block md:hidden">
        <div className="relative mx-auto min-h-screen w-full max-w-[430px] border-x border-white/10 bg-gradient-to-b from-[#1a0a16] via-[#170a1f] to-[#10091a] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#130a19]/90 px-5 py-4 backdrop-blur-xl">
            <h1 className="text-center text-sm font-semibold tracking-wide text-white/95">
              연애공략 리포트
            </h1>
          </header>

          <section className="px-5 pb-32 pt-4">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <p className="text-xs font-medium text-fuchsia-200">연애 상대</p>
              <div className="mt-2 flex items-center gap-5">
                <PartnerStrategyPhoto
                  variant="pageHeader"
                  gender={gender}
                  reportId={reportId}
                />
                <h2 className="min-w-0 flex-1 text-2xl font-bold leading-tight text-white">
                  {dayPillar
                    ? `${name} 님 연애공략`
                    : "결과를 계산할 수 없어요"}
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  생년월일 {birthdate || "미입력"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                  출생 시간 {birthtime || "미입력"}
                </span>
              </div>
            </article>

            {card ? (
              <div className="mt-4 space-y-4">
                {card.basicCard ? (
                  <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-sky-300/35 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100/95">
                        Free
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium tracking-tight text-white/85">
                      {subjectLine}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-pink-200">기본 특징</p>
                    <h3 className="mt-2 text-xl font-bold leading-snug text-white">
                      {basicTitle}
                    </h3>
                    <p className="mt-4 text-base font-semibold leading-7 text-white/90">
                      {card.basicCard.oneLine}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/80">
                      {card.basicCard.summary}
                    </p>
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                        성향 포인트
                      </p>
                      <ul className="mt-3 space-y-3 text-sm leading-7 text-white/80">
                        {card.basicCard.traits.map((trait) => (
                          <li key={trait} className="flex gap-2">
                            <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
                            <span>{trait}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ) : null}

                {card.loveStrategy && strategySections.length > 0 ? (
                  <LoveStrategyCard
                    title={`${name} 연애 공략`}
                    hookLabel={`${name}님을 사로잡을 수 있는 한 마디`}
                    oneLineHook={oneLineHook}
                    practicalTips={practicalTips}
                    sections={strategySections}
                    isPaid={isPaid}
                    unlockSlot={
                      !isPaid && canOfferPurchase ? (
                        <PaidReportUnlockButton
                          variant="overlay"
                          name={name}
                          birthdate={birthdate}
                          birthtime={birthtime}
                          gender={gender}
                        />
                      ) : undefined
                    }
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                {dayPillar
                  ? `"${dayPillar}" 일주 카드 데이터가 아직 준비되지 않았어요.`
                  : "입력값을 다시 확인해 주세요."}
              </div>
            )}

            {!isPaid && card && (
              <div className="mt-4 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-4 text-sm leading-relaxed text-fuchsia-100">
                <p>
                  지금 보시는 건 <span className="font-semibold text-white">무료 미리보기</span>
                  입니다. 프리미엄 리포트를 저장하면 공략 전체가 풀리고,{" "}
                  <Link
                    href="/mypage"
                    className="inline-block rounded px-1.5 py-1.5 font-semibold text-violet-300 underline decoration-violet-300/60 underline-offset-2 transition hover:text-violet-200 hover:decoration-violet-200 sm:py-1"
                  >
                    마이페이지
                  </Link>
                  에서 언제든 다시 열어볼 수 있어요.
                </p>
                {!canOfferPurchase && dayPillarFromQuery ? (
                  <p className="mt-3 text-fuchsia-100/90">
                    계정에 저장하려면 생년월일 입력이 필요합니다.{" "}
                    <Link
                      href="/main"
                      className="font-medium text-white underline-offset-4 hover:underline"
                    >
                      만세력으로 다시 입력하기
                    </Link>
                  </p>
                ) : null}
              </div>
            )}

            {isPaid && card && (
              <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-100">
                프리미엄 리포트가 열렸어요. 이 공략은 계정에 남으니, 나중에{" "}
                <Link
                  href="/mypage"
                  className="inline-block rounded px-1.5 py-1.5 font-semibold text-violet-300 underline decoration-violet-300/60 underline-offset-2 transition hover:text-violet-200 hover:decoration-violet-200 sm:py-1"
                >
                  마이페이지
                </Link>
                에서도 천천히 다시 읽어보실 수 있어요.
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-white/55 underline-offset-4 transition hover:text-white/85 hover:underline"
              >
                첫 페이지로 돌아가기
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="hidden md:block px-6 py-12">
        <section className="relative mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-white/6 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-10">
          <div className="mt-1 flex items-center gap-5">
            <PartnerStrategyPhoto
              variant="pageHeader"
              gender={gender}
              reportId={reportId}
            />
            <h1 className="min-w-0 flex-1 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              {dayPillar ? `${name} 님 연애공략` : "결과를 계산할 수 없어요"}
            </h1>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 sm:grid-cols-3">
            <div>
              <p className="text-xs text-white/40">생년월일</p>
              <p className="mt-1 font-medium text-white/85">
                {birthdate || "미입력"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">출생 시간</p>
              <p className="mt-1 font-medium text-white/85">
                {birthtime || "미입력"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">성별</p>
              <p className="mt-1 font-medium text-white/85">
                {gender === "female" ? "여성" : "남성"}
              </p>
            </div>
          </div>

          {card ? (
            <div className="mt-6 space-y-4">
              {card.basicCard ? (
                <article className="rounded-[28px] border border-white/10 bg-white/6 p-7 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-sky-300/35 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100/95">
                      Free
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium tracking-tight text-white/85">
                    {subjectLine}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-pink-200">기본 특징</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">{basicTitle}</h2>
                  <p className="mt-5 text-base font-semibold text-white/90">
                    {card.basicCard.oneLine}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/80">
                    {card.basicCard.summary}
                  </p>
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                      성향 포인트
                    </p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-white/80">
                      {card.basicCard.traits.map((trait) => (
                        <li key={trait} className="flex gap-2">
                          <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                        관계 패턴
                      </p>
                      <p className="mt-1 text-sm leading-7 text-white/80">
                        {card.basicCard.relationship}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                        인사이트
                      </p>
                      <p className="mt-1 text-sm leading-7 text-white/80">
                        {card.basicCard.insight}
                      </p>
                    </div>
                  </div>
                </article>
              ) : null}
              {card.loveStrategy && strategySections.length > 0 ? (
                <LoveStrategyCard
                  title={`${name} 연애 공략`}
                  hookLabel={`${name}님을 사로잡을 수 있는 한 마디`}
                  oneLineHook={oneLineHook}
                  practicalTips={practicalTips}
                  sections={strategySections}
                  isPaid={isPaid}
                  unlockSlot={
                    !isPaid && canOfferPurchase ? (
                      <PaidReportUnlockButton
                        variant="overlay"
                        name={name}
                        birthdate={birthdate}
                        birthtime={birthtime}
                        gender={gender}
                      />
                    ) : undefined
                  }
                />
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              {dayPillar
                ? `"${dayPillar}" 일주 카드 데이터가 아직 준비되지 않았어요.`
                : "입력값을 다시 확인해 주세요."}
            </div>
          )}

          {!isPaid && card && (
            <div className="mt-6 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-4 text-sm leading-relaxed text-fuchsia-100">
              <p>
                지금 보시는 건 <span className="font-semibold text-white">무료 미리보기</span>
                입니다. 프리미엄 리포트를 저장하면 공략 전체가 풀리고,{" "}
                <Link
                  href="/mypage"
                  className="inline-block rounded px-1.5 py-1.5 font-semibold text-violet-300 underline decoration-violet-300/60 underline-offset-2 transition hover:text-violet-200 hover:decoration-violet-200 sm:py-1"
                >
                  마이페이지
                </Link>
                에서 언제든 다시 열어볼 수 있어요.
              </p>
              {!canOfferPurchase && dayPillarFromQuery ? (
                <p className="mt-3 text-fuchsia-100/90">
                  계정에 저장하려면 생년월일 입력이 필요합니다.{" "}
                  <Link
                    href="/main"
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    만세력으로 다시 입력하기
                  </Link>
                </p>
              ) : null}
            </div>
          )}

          {isPaid && card && (
            <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-100">
              프리미엄 리포트가 열렸어요. 이 공략은 계정에 남으니, 나중에{" "}
              <Link
                href="/mypage"
                className="inline-block rounded px-1.5 py-1.5 font-semibold text-violet-300 underline decoration-violet-300/60 underline-offset-2 transition hover:text-violet-200 hover:decoration-violet-200 sm:py-1"
              >
                마이페이지
              </Link>
              에서도 천천히 다시 읽어보실 수 있어요.
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-7 py-4 text-base font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition duration-300 hover:scale-[1.02]"
            >
              첫 페이지로 돌아가기
            </Link>
          </div>
        </section>
      </section>
    </>
  );
}
