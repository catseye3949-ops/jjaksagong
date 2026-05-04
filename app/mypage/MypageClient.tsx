"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildLoveFortuneFlowPoints } from "@/lib/buildLoveFortuneFlowPoints";
import { calculateDaewoonList } from "@/lib/calculateDaewoonList";
import { calculateIlju } from "@/lib/calculateIlju";
import { calculateLoveFortunePeriods } from "@/lib/calculateLoveFortunePeriods";
import { useAuth } from "../../contexts/AuthContext";
import { LoveFortuneFlowChart, type LoveFlowPoint } from "./LoveFortuneFlowChart";

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const actionBtnClass =
  "min-h-[44px] shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white/90 transition hover:border-fuchsia-300/45 hover:bg-white/[0.12] sm:min-h-0 sm:py-2";

/** 수정·복사 — 작은 크기, md 이상에서만 카드 오른쪽으로 살짝 돌출 */
const inlineActionBtnClass =
  "shrink-0 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-white/90 transition hover:border-fuchsia-300/45 hover:bg-white/[0.12] leading-none";

const inlineActionShiftClass = "inline-flex md:translate-x-3";

type LoveFlowChartState =
  | { kind: "hidden" }
  | { kind: "error" }
  | { kind: "chart"; points: LoveFlowPoint[]; allZero: boolean };

export default function MypageClient() {
  const router = useRouter();
  const { user, isReady, logout, updateDisplayName } = useAuth();

  const displayName = user?.name || user?.nickname || "";

  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [copyLabel, setCopyLabel] = useState<"복사" | "복사됨">("복사");

  useEffect(() => {
    if (!user || nameEditing) return;
    setNameDraft(user.name || user.nickname);
  }, [user, nameEditing, user?.name, user?.nickname]);

  const beginEditName = useCallback(() => {
    if (!user) return;
    setNameError(null);
    setNameDraft(user.name || user.nickname);
    setNameEditing(true);
  }, [user]);

  const cancelEditName = useCallback(() => {
    if (!user) return;
    setNameDraft(user.name || user.nickname);
    setNameError(null);
    setNameEditing(false);
  }, [user]);

  const saveName = useCallback(() => {
    const t = nameDraft.trim();
    if (!t) {
      setNameError("이름 또는 별명을 입력해 주세요.");
      return;
    }
    const result = updateDisplayName(t);
    if (!result.ok) {
      setNameError(result.error);
      return;
    }
    setNameError(null);
    setNameEditing(false);
    setNameSaved(true);
    window.setTimeout(() => setNameSaved(false), 2000);
  }, [nameDraft, updateDisplayName]);

  const onCopyReferral = useCallback(async () => {
    if (!user) return;
    const ok = await copyTextToClipboard(user.referralCode);
    if (!ok) return;
    setCopyLabel("복사됨");
    window.setTimeout(() => setCopyLabel("복사"), 1500);
  }, [user]);

  const loveFlowChart = useMemo((): LoveFlowChartState => {
    if (!user) return { kind: "hidden" };
    const gender = user.profileGender;
    if (gender !== "male" && gender !== "female") {
      return { kind: "hidden" };
    }
    if (!user.birthDate?.trim()) {
      return { kind: "hidden" };
    }
    const dayPillar = calculateIlju(user.birthDate, user.birthTime ?? "");
    if (!dayPillar) {
      return { kind: "hidden" };
    }
    const now = new Date();
    const apiYear = now.getFullYear();
    const periods = calculateLoveFortunePeriods(dayPillar, gender, apiYear, 6);
    if (!periods) {
      return { kind: "error" };
    }
    const daewoon = calculateDaewoonList(
      user.birthDate,
      user.birthTime ?? undefined,
      gender,
      12,
    );
    if (!daewoon) {
      return { kind: "error" };
    }
    const points = buildLoveFortuneFlowPoints(periods, daewoon, user.birthDate, now);
    const allZero = points.every((p) => p.score === 0);
    return { kind: "chart", points, allZero };
  }, [user]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/mypage")}`);
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <main className="relative min-h-screen bg-[#0b1020] px-4 py-24 text-center text-sm text-white/50">
        마이페이지를 불러오는 중…
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] px-4 py-16 pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[20%] h-[320px] w-[320px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">마이페이지</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-fuchsia-300/40"
            >
              홈
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-fuchsia-300/40"
            >
              로그아웃
            </button>
          </div>
        </div>

        <section className="overflow-visible rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <h2 className="text-lg font-semibold text-fuchsia-200">내 정보</h2>
          <p className="mt-1 text-xs text-white/45">
            브라우저에 저장되는 데모 계정입니다. 추후 DB·서버 세션으로 교체하면
            됩니다.
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <dt className="shrink-0 text-white/50">이름 또는 별명</dt>
              <dd className="min-w-0 flex-1 sm:text-right">
                {!nameEditing ? (
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-base font-semibold text-white">
                      {displayName}
                    </span>
                    {nameSaved ? (
                      <span className="text-xs font-medium text-emerald-300/95">
                        저장됨
                      </span>
                    ) : null}
                    <span className={inlineActionShiftClass}>
                      <button
                        type="button"
                        onClick={beginEditName}
                        className={inlineActionBtnClass}
                      >
                        수정
                      </button>
                    </span>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-stretch gap-2 sm:ml-auto sm:max-w-md">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(e) => {
                        setNameDraft(e.target.value);
                        setNameError(null);
                      }}
                      autoComplete="nickname"
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none ring-fuchsia-500/30 placeholder:text-white/35 focus:border-fuchsia-400/50 focus:ring-2"
                      placeholder="이름 또는 별명"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveName}
                        disabled={!nameDraft.trim()}
                        className={`${actionBtnClass} border-fuchsia-400/35 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditName}
                        className={actionBtnClass}
                      >
                        취소
                      </button>
                    </div>
                    {nameError ? (
                      <p className="text-left text-xs text-rose-300" role="alert">
                        {nameError}
                      </p>
                    ) : null}
                  </div>
                )}
              </dd>
            </div>
            {user.birthDate ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-white/50">생년월일</dt>
                <dd className="text-base font-medium text-white/90">
                  {user.birthDate}
                </dd>
              </div>
            ) : null}
            {user.profileGender ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-white/50">성별</dt>
                <dd className="text-base font-medium text-white/90">
                  {user.profileGender === "male"
                    ? "남성"
                    : user.profileGender === "female"
                      ? "여성"
                      : "선택 안 함"}
                </dd>
              </div>
            ) : null}
            {user.mbti ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-white/50">MBTI</dt>
                <dd className="font-medium text-white/90">{user.mbti}</dd>
              </div>
            ) : null}
            {typeof user.marketingConsent === "boolean" ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <dt className="text-white/50">마케팅 수신</dt>
                <dd className="font-medium text-white/90">
                  {user.marketingConsent ? "동의" : "미동의"}
                </dd>
              </div>
            ) : null}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-white/50">이메일</dt>
              <dd className="break-all text-base font-medium text-white/90">
                {user.email}
              </dd>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <dt className="shrink-0 text-white/50">내 추천 코드</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                <span className="font-mono text-base font-semibold tracking-wide text-pink-100 break-all">
                  {user.referralCode}
                </span>
                <span className={inlineActionShiftClass}>
                  <button
                    type="button"
                    onClick={onCopyReferral}
                    className={inlineActionBtnClass}
                  >
                    {copyLabel}
                  </button>
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-white/50">사용 가능 추천 보상</dt>
              <dd className="text-lg font-semibold text-pink-200">
                {user.referralRewardBalance.toLocaleString("ko-KR")}원
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-white/40">
            추천 성공 {user.referralSuccessCount}명 · 친구의 첫 유료 결제 시
            보상이 쌓입니다.
          </p>
        </section>

        <div className="mt-6">
          <Link
            href="/reports"
            className="flex w-full min-h-[52px] items-center justify-center rounded-2xl border border-fuchsia-400/35 bg-gradient-to-r from-pink-500/25 via-fuchsia-500/30 to-violet-500/25 px-6 py-4 text-center text-sm font-semibold text-white shadow-[0_8px_28px_rgba(217,70,239,0.25)] transition hover:border-fuchsia-300/55 hover:brightness-110 sm:min-h-0 sm:py-3.5"
          >
            내 공략 컬렉션 보기
          </Link>
        </div>

        {loveFlowChart.kind !== "hidden" ? (
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/8 p-6 pb-12 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <h2 className="text-lg font-semibold text-fuchsia-200">연애운 상승 시기</h2>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/42">
              이 연애운은 결혼까지 갈 수 있는 진지한 연애를 전제로 한 운입니다.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              앞으로 5년간 관계 기회가 강해질 수 있는 흐름을 월별로 정리했어요.
            </p>

            {loveFlowChart.kind === "error" ? (
              <p className="mt-5 text-sm text-rose-200/90" role="alert">
                연애운 흐름을 불러올 수 없습니다.
              </p>
            ) : (
              <LoveFortuneFlowChart points={loveFlowChart.points} allZero={loveFlowChart.allZero} />
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
