/** 천간 (갑을병정무기경신임계) */
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;

/** 지지 (자축인묘진사오미신유술해) */
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

/** 1984년 = 갑자년을 60갑자 순환의 index 0으로 둠 */
const JIAZI_BASE_YEAR = 1984;

function stemToElement(stem: string): "목" | "화" | "토" | "금" | "수" {
  const idx = HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]);
  if (idx < 0) return "목";
  if (idx <= 1) return "목";
  if (idx <= 3) return "화";
  if (idx <= 5) return "토";
  if (idx <= 7) return "금";
  return "수";
}

export type YearUnResult = {
  yearPillar: string;
  yearGan: string;
  yearBranch: string;
  yearElement: "목" | "화" | "토" | "금" | "수";
};

/**
 * 특정 양력 year의 연주·연운 오행(연간 기준)을 계산합니다.
 * 기준: 1984년 갑자년을 cycle index 0으로 한 60갑자 순환.
 */
export function calculateYearUn(year: number): YearUnResult | null {
  if (!Number.isInteger(year)) {
    return null;
  }

  const cycleIndex = ((year - JIAZI_BASE_YEAR) % 60 + 60) % 60;
  const yearGan = HEAVENLY_STEMS[cycleIndex % 10]!;
  const yearBranch = EARTHLY_BRANCHES[cycleIndex % 12]!;
  const yearElement = stemToElement(yearGan);

  return {
    yearPillar: `${yearGan}${yearBranch}`,
    yearGan,
    yearBranch,
    yearElement,
  };
}
