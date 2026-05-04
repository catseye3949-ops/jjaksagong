import type { FiveElement } from "./calculateLoveFortune";
import { calculateMonthUn } from "./calculateMonthUn";
import { calculateYearUn } from "./calculateYearUn";
import { isValidDayPillar } from "./getCompatibilityScore";

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;

function stemToElement(stem: string): FiveElement | null {
  const idx = HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]);
  if (idx < 0) return null;
  if (idx <= 1) return "목";
  if (idx <= 3) return "화";
  if (idx <= 5) return "토";
  if (idx <= 7) return "금";
  return "수";
}

function branchToElement(branch: string): FiveElement | null {
  switch (branch) {
    case "자":
    case "해":
      return "수";
    case "인":
    case "묘":
      return "목";
    case "사":
    case "오":
      return "화";
    case "신":
    case "유":
      return "금";
    case "진":
    case "술":
    case "축":
    case "미":
      return "토";
    default:
      return null;
  }
}

function targetElementsForDayElement(dayElement: FiveElement): { jaesung: FiveElement; gwansung: FiveElement } {
  const table: Record<FiveElement, { jaesung: FiveElement; gwansung: FiveElement }> = {
    목: { jaesung: "토", gwansung: "금" },
    화: { jaesung: "금", gwansung: "수" },
    토: { jaesung: "수", gwansung: "목" },
    금: { jaesung: "목", gwansung: "화" },
    수: { jaesung: "화", gwansung: "토" },
  };
  return table[dayElement];
}

export type LoveFortunePeriodHitStatus = "excellent" | "good";

export type LoveFortuneYearPeriod = {
  year: number;
  yearPillar: string;
  yearGanElement: FiveElement;
  yearBranchElement: FiveElement;
  status: LoveFortunePeriodHitStatus;
  label: string;
};

export type LoveFortuneMonthPeriod = {
  year: number;
  month: number;
  monthPillar: string;
  monthGanElement: FiveElement;
  monthBranchElement: FiveElement;
  status: LoveFortunePeriodHitStatus;
  label: string;
};

export type LoveFortunePeriodsResult = {
  dayGan: string;
  dayElement: FiveElement;
  targetType: "재성" | "관성";
  targetElement: FiveElement;
  years: LoveFortuneYearPeriod[];
  months: LoveFortuneMonthPeriod[];
};

function classifyHit(
  a: FiveElement,
  b: FiveElement,
  target: FiveElement,
): { status: LoveFortunePeriodHitStatus; label: string } | null {
  const hitA = a === target;
  const hitB = b === target;
  if (hitA && hitB) {
    return { status: "excellent", label: "연애/결혼운 매우 좋음" };
  }
  if (hitA || hitB) {
    return { status: "good", label: "연애/결혼운 좋음" };
  }
  return null;
}

/**
 * startYear부터 연속 yearsToCheck개 연도에 대해,
 * 연간·연지 또는 월간·월지가 재성/관성 타겟 오행과 맞는 해·월만 나열합니다.
 * (둘 다 맞지 않으면 배열에 포함하지 않음)
 */
export function calculateLoveFortunePeriods(
  dayPillar: string,
  gender: "male" | "female",
  startYear: number,
  yearsToCheck: number,
): LoveFortunePeriodsResult | null {
  const pillar = dayPillar.trim();
  if (!isValidDayPillar(pillar)) {
    return null;
  }

  if (gender !== "male" && gender !== "female") {
    return null;
  }

  if (!Number.isInteger(startYear) || !Number.isInteger(yearsToCheck) || yearsToCheck < 0) {
    return null;
  }

  const dayGan = pillar.charAt(0);
  const dayElement = stemToElement(dayGan);
  if (!dayElement) {
    return null;
  }

  const { jaesung, gwansung } = targetElementsForDayElement(dayElement);
  const targetType: "재성" | "관성" = gender === "male" ? "재성" : "관성";
  const targetElement = gender === "male" ? jaesung : gwansung;

  const years: LoveFortuneYearPeriod[] = [];
  const months: LoveFortuneMonthPeriod[] = [];

  for (let offset = 0; offset < yearsToCheck; offset++) {
    const year = startYear + offset;
    const yearUn = calculateYearUn(year);
    if (!yearUn) {
      continue;
    }

    const yearGanElement = stemToElement(yearUn.yearGan);
    const yearBranchElement = branchToElement(yearUn.yearBranch);
    if (!yearGanElement || !yearBranchElement) {
      continue;
    }

    const yearHit = classifyHit(yearGanElement, yearBranchElement, targetElement);
    if (yearHit) {
      years.push({
        year,
        yearPillar: yearUn.yearPillar,
        yearGanElement,
        yearBranchElement,
        status: yearHit.status,
        label: yearHit.label,
      });
    }

    for (let month = 1; month <= 12; month++) {
      const monthUn = calculateMonthUn(year, month);
      if (!monthUn) {
        continue;
      }

      const monthGanElement = stemToElement(monthUn.monthGan);
      const monthBranchElement = branchToElement(monthUn.monthBranch);
      if (!monthGanElement || !monthBranchElement) {
        continue;
      }

      const monthHit = classifyHit(monthGanElement, monthBranchElement, targetElement);
      if (monthHit) {
        months.push({
          year,
          month,
          monthPillar: monthUn.monthPillar,
          monthGanElement,
          monthBranchElement,
          status: monthHit.status,
          label: monthHit.label,
        });
      }
    }
  }

  return {
    dayGan,
    dayElement,
    targetType,
    targetElement,
    years,
    months,
  };
}
