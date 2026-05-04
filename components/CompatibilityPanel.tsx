"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Gender } from "@/lib/domain/user";
import { calculateIlju } from "@/lib/calculateIlju";
import { formatBirthDate } from "@/lib/formatBirth";
import {
  getCompatibilityScore,
  type CompatibilityRuleTag,
  type CompatibilityScoreResult,
} from "@/lib/getCompatibilityScore";

const LOADING_PHASE_MS = [0, 700, 1400] as const;
const LOADING_DONE_MS = 1800;
const LOADING_MESSAGES = [
  "두 사람의 흐름을 분석하는 중입니다...",
  "관계의 결을 비교하는 중...",
  "궁합 흐름을 정리하고 있습니다...",
] as const;

type UiPhase = "form" | "loading" | "result";

type ResolvedCompat = {
  pair: { myDayPillar: string; targetDayPillar: string };
  scoreResult: CompatibilityScoreResult;
  myName: string;
  targetName: string;
};

type GenderValue = "" | Gender;

const TENSION_HOOK_LINES = [
  "이 관계, 생각보다 더 깊게 얽혀 있습니다.",
  "가볍게 보면 놓치는 흐름이 있습니다.",
] as const;

const TAG_LABELS: Record<CompatibilityRuleTag, string[]> = {
  mutualPositiveFlow: [
    "서로에게 긍정적인 영향을 주는 흐름",
    "함께 있을 때 비교적 편안함을 느낄 수 있는 관계",
    "자연스럽게 서로를 끌어주는 경향",
  ],
  oneSidedLeadFlow: [
    "한쪽에서 관계를 더 이끌어갈 가능성이 있는 흐름",
    "관계의 균형이 중요하게 작용할 수 있는 흐름",
    "한쪽의 태도에 따라 분위기가 달라질 수 있는 관계",
  ],
  naturalHarmony: [
    "전체적으로 결이 잘 맞는 편",
    "자연스럽게 이어질 수 있는 흐름",
    "큰 무리 없이 관계가 형성될 가능성",
  ],
  strongPullTension: [
    "서로에게 강한 영향을 주는 관계",
    "끌림과 긴장이 함께 작용하는 흐름",
    "감정의 변화가 비교적 크게 나타날 수 있는 관계",
  ],
  sameRhythm: [
    "비슷한 성향을 공유하는 편",
    "서로를 이해하기 쉬운 흐름",
    "관계의 기본 리듬이 비슷한 편",
  ],
};

function pickPhrase(key: string, list: string[]): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % list.length;
  return list[idx]!;
}

function scoreBandText(score: number): string {
  if (score <= 44) {
    return `조금 다른 결의 흐름이 보입니다.\n서두르기보다 상대의 반응을 천천히 살피는 편이 더 자연스러울 수 있습니다.`;
  }
  if (score <= 59) {
    return `어느 정도 연결 가능성은 있지만,\n접근 방식에 따라 분위기가 달라질 수 있는 조합입니다.`;
  }
  if (score <= 74) {
    return `전체 흐름은 나쁘지 않은 편입니다.\n관계를 이어가는 과정에서 균형이 중요하게 작용할 수 있습니다.`;
  }
  return `비교적 자연스럽게 이어질 가능성이 있는 편입니다.\n편안함을 유지하는 방식이 더 잘 맞을 수 있습니다.`;
}

function MobileGenderDropdown({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: GenderValue;
  onChange: (value: GenderValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    value === "male" ? "남성" : value === "female" ? "여성" : "성별을 선택해 주세요";

  return (
    <div className="md:hidden">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left text-sm outline-none transition ${
            value ? "text-slate-900" : "text-slate-500"
          }`}
        >
          <span>{selectedLabel}</span>
          <span className="text-slate-500">{open ? "▲" : "▼"}</span>
        </button>
        {open ? (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => {
                onChange("male");
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm ${
                value === "male"
                  ? "bg-pink-50 text-pink-500 font-medium"
                  : "bg-white text-gray-900 hover:bg-pink-50"
              }`}
            >
              남성
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("female");
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm ${
                value === "female"
                  ? "bg-pink-50 text-pink-500 font-medium"
                  : "bg-white text-gray-900 hover:bg-pink-50"
              }`}
            >
              여성
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CompatibilityPanel() {
  const router = useRouter();
  const [myName, setMyName] = useState("");
  const [myBirthDate, setMyBirthDate] = useState("");
  const [myGender, setMyGender] = useState<"" | Gender>("");
  const [targetName, setTargetName] = useState("");
  const [targetBirthDate, setTargetBirthDate] = useState("");
  const [targetGender, setTargetGender] = useState<"" | Gender>("");
  const [uiPhase, setUiPhase] = useState<UiPhase>("form");
  const [loadingMessage, setLoadingMessage] = useState<string>(
    LOADING_MESSAGES[0],
  );
  const [resolvedCompat, setResolvedCompat] = useState<ResolvedCompat | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uiPhase !== "loading") return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        if (!cancelled) setLoadingMessage(LOADING_MESSAGES[1]);
      }, LOADING_PHASE_MS[1]),
    );
    timers.push(
      setTimeout(() => {
        if (!cancelled) setLoadingMessage(LOADING_MESSAGES[2]);
      }, LOADING_PHASE_MS[2]),
    );
    timers.push(
      setTimeout(() => {
        if (!cancelled) setUiPhase("result");
      }, LOADING_DONE_MS),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [uiPhase]);

  const result = resolvedCompat?.scoreResult ?? null;
  const resolvedPair = resolvedCompat?.pair ?? null;
  const resolvedTargetName = resolvedCompat?.targetName?.trim() ?? "";

  const flowKey = resolvedPair
    ? `${resolvedPair.myDayPillar}-${resolvedPair.targetDayPillar}`
    : "";

  const tagDisplays = useMemo(() => {
    if (!result?.tags.length) return [];
    return result.tags.map((tag) => ({
      tag,
      label: pickPhrase(`${flowKey}:${tag}`, TAG_LABELS[tag]),
    }));
  }, [result, flowKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!myBirthDate.trim()) {
      setError("내 생년월일을 입력해 주세요.");
      return;
    }
    if (!myGender) {
      setError("내 성별을 선택해 주세요.");
      return;
    }
    if (!targetBirthDate.trim()) {
      setError("상대방 생년월일을 입력해 주세요.");
      return;
    }
    if (!targetGender) {
      setError("상대방 성별을 선택해 주세요.");
      return;
    }

    const myDayPillar = calculateIlju(myBirthDate, "");
    const targetDayPillar = calculateIlju(targetBirthDate, "");

    if (!myDayPillar) {
      setError("내 생년월일을 다시 확인해 주세요.");
      return;
    }
    if (!targetDayPillar) {
      setError("상대방 생년월일을 다시 확인해 주세요.");
      return;
    }

    const scoreResult = getCompatibilityScore(myDayPillar, targetDayPillar);
    if (!scoreResult) {
      setError("입력값을 다시 확인해 주세요.");
      return;
    }

    setResolvedCompat({
      pair: { myDayPillar, targetDayPillar },
      scoreResult,
      myName: myName.trim(),
      targetName: targetName.trim(),
    });
    setLoadingMessage(LOADING_MESSAGES[0]);
    setUiPhase("loading");
  };

  const goStrategy = () => {
    if (!resolvedPair || !targetGender) return;
    const q = new URLSearchParams();
    q.set("dayPillar", resolvedPair.targetDayPillar);
    q.set("gender", targetGender);
    q.set("from", "compatibility");
    const tn = resolvedCompat?.targetName.trim();
    if (tn) q.set("targetName", tn);
    router.push(`/result?${q.toString()}`);
  };

  const reset = () => {
    setUiPhase("form");
    setResolvedCompat(null);
    setLoadingMessage(LOADING_MESSAGES[0]);
    setError(null);
  };

  if (uiPhase === "loading") {
    return (
      <div
        className="flex min-h-[280px] flex-col items-center justify-center gap-6 rounded-2xl border border-violet-100 bg-violet-50/40 px-6 py-14"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="h-9 w-9 shrink-0 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin"
          aria-hidden
        />
        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-400 opacity-60 animate-pulse"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </div>
        <p className="max-w-sm text-center text-sm font-medium leading-relaxed text-slate-700">
          {loadingMessage}
        </p>
      </div>
    );
  }

  if (uiPhase === "result" && result && resolvedPair) {
    const ctaHelperText = resolvedTargetName
      ? `${resolvedTargetName}님의 성향을 기준으로 참고해볼 수 있습니다`
      : "상대방의 성향을 기준으로 참고해볼 수 있습니다";
    const ctaButtonLabel = resolvedTargetName
      ? `${resolvedTargetName}님에게 맞는 접근 방식 보기`
      : "이 사람에게 맞는 접근 방식 보기";

    const tensionHookLine = pickPhrase(
      `${flowKey}:tensionHook`,
      [...TENSION_HOOK_LINES],
    );

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-pink-50 px-5 pb-6 pt-7 md:px-8 md:pb-8 md:pt-9">
          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 md:text-xs">
              궁합 흐름 점수
            </p>
            <p className="mt-3 text-6xl font-black tabular-nums leading-none tracking-tight text-slate-900 sm:text-7xl md:mt-4 md:text-8xl">
              {result.score}
              <span className="inline-block align-baseline text-[34%] font-bold leading-none text-violet-600">
                %
              </span>
            </p>
            <p className="mt-5 max-w-xl text-base font-semibold leading-snug text-slate-800 md:text-lg">
              {tensionHookLine}
            </p>
          </div>
          <p className="mt-5 whitespace-pre-line text-center text-sm leading-7 text-slate-600 md:mt-6">
            {scoreBandText(result.score)}
          </p>
          {tagDisplays.length > 0 ? (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {tagDisplays.map(({ tag, label }) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full rounded-full border border-violet-200 bg-white/90 px-3 py-1.5 text-xs font-medium leading-snug text-violet-900"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-slate-500">
              입력하신 조합 기준으로 참고해볼 수 있는 흐름을 정리해 보았습니다.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-center text-xs leading-relaxed text-slate-500">
            {ctaHelperText}
          </p>
          <button
            type="button"
            onClick={goStrategy}
            className="w-full rounded-2xl bg-slate-900 px-6 py-4 text-center text-base font-semibold text-white transition hover:bg-slate-800"
          >
            {ctaButtonLabel}
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          className="w-full rounded-2xl border border-slate-300 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          다시 입력하기
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <fieldset className="space-y-5 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold text-slate-800">
          내 정보
        </legend>
        <div>
          <label
            htmlFor="compat-my-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            내 이름
          </label>
          <input
            id="compat-my-name"
            type="text"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="내 이름을 입력해 주세요"
            autoComplete="name"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
          />
        </div>
        <div>
          <label
            htmlFor="compat-my-birthdate"
            className="mb-2 block text-sm font-medium text-slate-700 md:hidden"
          >
            내 생년월일
          </label>
          <label
            htmlFor="compat-my-birthdate-desktop"
            className="mb-2 hidden text-sm font-medium text-slate-700 md:block"
          >
            내 생년월일
          </label>
          <input
            id="compat-my-birthdate"
            type="text"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            value={myBirthDate}
            onChange={(e) => setMyBirthDate(formatBirthDate(e.target.value))}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 md:hidden"
          />
          <input
            id="compat-my-birthdate-desktop"
            type="date"
            value={myBirthDate}
            onChange={(e) => setMyBirthDate(e.target.value)}
            className="hidden w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 md:block"
          />
        </div>
        <div>
          <MobileGenderDropdown
            id="compat-my-gender-mobile"
            label="내 성별"
            value={myGender}
            onChange={setMyGender}
          />
          <div className="hidden md:block">
            <label
              htmlFor="compat-my-gender"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              내 성별
            </label>
            <select
              id="compat-my-gender"
              value={myGender}
              onChange={(e) => setMyGender(e.target.value as "" | Gender)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            >
              <option value="">성별을 선택해 주세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold text-slate-800">
          상대 정보
        </legend>
        <div>
          <label
            htmlFor="compat-target-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            상대방 이름
          </label>
          <input
            id="compat-target-name"
            type="text"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="상대방 이름을 입력해 주세요"
            autoComplete="off"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
          />
        </div>
        <div>
          <label
            htmlFor="compat-target-birthdate"
            className="mb-2 block text-sm font-medium text-slate-700 md:hidden"
          >
            상대방 생년월일
          </label>
          <label
            htmlFor="compat-target-birthdate-desktop"
            className="mb-2 hidden text-sm font-medium text-slate-700 md:block"
          >
            상대방 생년월일
          </label>
          <input
            id="compat-target-birthdate"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            value={targetBirthDate}
            onChange={(e) => setTargetBirthDate(formatBirthDate(e.target.value))}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 md:hidden"
          />
          <input
            id="compat-target-birthdate-desktop"
            type="date"
            value={targetBirthDate}
            onChange={(e) => setTargetBirthDate(e.target.value)}
            className="hidden w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500 md:block"
          />
        </div>
        <div>
          <MobileGenderDropdown
            id="compat-target-gender-mobile"
            label="상대방 성별"
            value={targetGender}
            onChange={setTargetGender}
          />
          <div className="hidden md:block">
            <label
              htmlFor="compat-target-gender"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              상대방 성별
            </label>
            <select
              id="compat-target-gender"
              value={targetGender}
              onChange={(e) =>
                setTargetGender(e.target.value as "" | Gender)
              }
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            >
              <option value="">성별을 선택해 주세요</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>
        </div>
      </fieldset>

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={uiPhase !== "form"}
        className="w-full rounded-2xl bg-violet-700 px-6 py-4 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        궁합 흐름 확인하기
      </button>
    </form>
  );
}
