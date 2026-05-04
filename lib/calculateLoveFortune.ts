import { calculateMonthUn } from "./calculateMonthUn";
import { calculateYearUn } from "./calculateYearUn";
import { isValidDayPillar } from "./getCompatibilityScore";

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;

export type FiveElement = "목" | "화" | "토" | "금" | "수";

function stemToElement(stem: string): FiveElement | null {
  const idx = HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]);
  if (idx < 0) return null;
  if (idx <= 1) return "목";
  if (idx <= 3) return "화";
  if (idx <= 5) return "토";
  if (idx <= 7) return "금";
  return "수";
}

/** 지지 → 오행 (연운·월운 연지·월지에만 사용) */
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

/** 일간 오행 → (재성, 관성) 오행 */
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

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export type LoveFortuneStatus = "excellent" | "good" | "average";

export type LoveFortuneResult = {
  status: LoveFortuneStatus;
  label: string;
  dayGan: string;
  dayElement: FiveElement;
  targetType: "재성" | "관성";
  targetElement: FiveElement;
  yearPillar: string;
  yearGanElement: FiveElement;
  yearBranchElement: FiveElement;
  activeYearElement: FiveElement;
  monthPillar: string;
  monthGanElement: FiveElement;
  monthBranchElement: FiveElement;
  activeMonthElement: FiveElement;
  reason: string;
};

export function calculateLoveFortune(
  dayPillar: string,
  gender: "male" | "female",
  year: number,
  month: number,
  day: number,
): LoveFortuneResult | null {
  const pillar = dayPillar.trim();
  if (!isValidDayPillar(pillar)) {
    return null;
  }

  if (gender !== "male" && gender !== "female") {
    return null;
  }

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  const dim = daysInMonth(year, month);
  if (day < 1 || day > dim) {
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

  const yearUn = calculateYearUn(year);
  const monthUn = calculateMonthUn(year, month);
  if (!yearUn || !monthUn) {
    return null;
  }

  const yearGanElement = stemToElement(yearUn.yearGan);
  const yearBranchElement = branchToElement(yearUn.yearBranch);
  const monthGanElement = stemToElement(monthUn.monthGan);
  const monthBranchElement = branchToElement(monthUn.monthBranch);

  if (!yearGanElement || !yearBranchElement || !monthGanElement || !monthBranchElement) {
    return null;
  }

  const activeYearElement: FiveElement = month >= 1 && month <= 6 ? yearGanElement : yearBranchElement;
  const activeMonthElement: FiveElement = day >= 1 && day <= 15 ? monthGanElement : monthBranchElement;

  const yearHit = activeYearElement === targetElement;
  const monthHit = activeMonthElement === targetElement;

  let status: LoveFortuneStatus;
  let label: string;
  if (yearHit && monthHit) {
    status = "excellent";
    label = "연애운 매우 좋음";
  } else if (yearHit || monthHit) {
    status = "good";
    label = "연애운 좋음";
  } else {
    status = "average";
    label = "보통";
  }

  const halfYearLabel = month <= 6 ? "상반기(연간)" : "하반기(연지)";
  const halfMonthLabel = day <= 15 ? "전반(월간)" : "후반(월지)";

  const reason =
    `일간 ${dayGan}(${dayElement}), ${gender === "male" ? "남" : "여"}·${targetType} 타겟 ${targetElement}. ` +
    `연주 ${yearUn.yearPillar} → 연간 ${yearGanElement}, 연지 ${yearBranchElement}; ${month}월은 ${halfYearLabel}로 활성 ${activeYearElement}. ` +
    `월주 ${monthUn.monthPillar} → 월간 ${monthGanElement}, 월지 ${monthBranchElement}; ${day}일은 ${halfMonthLabel}로 활성 ${activeMonthElement}. ` +
    `연운${yearHit ? " 일치" : " 비일치"}, 월운${monthHit ? " 일치" : " 비일치"}.`;

  return {
    status,
    label,
    dayGan,
    dayElement,
    targetType,
    targetElement,
    yearPillar: yearUn.yearPillar,
    yearGanElement,
    yearBranchElement,
    activeYearElement,
    monthPillar: monthUn.monthPillar,
    monthGanElement,
    monthBranchElement,
    activeMonthElement,
    reason,
  };
}
