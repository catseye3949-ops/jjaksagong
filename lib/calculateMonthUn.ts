/** 천간 (갑을병정무기경신임계) */
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;

/**
 * 월지: 2월 인월부터 1월 축까지 (절기 미적용, 월 단위 단순화)
 * 인·묘·진·사·오·미·신·유·술·해·자·축
 */
const MONTH_BRANCHES = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"] as const;

/** 연간 천간 인덱스 (양력 연도 기준 간지: (year - 4) % 10 = 갑) */
function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

/**
 * 인월(2월)의 첫 천간 인덱스.
 * 갑/기년→병, 을/경년→무, 병/신년→경, 정/임년→임, 무/계년→갑
 */
function getStartGanIndexForYinMonth(yearStemIndex: number): number {
  const table: readonly number[] = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
  return table[yearStemIndex]!;
}

function stemToElement(stem: string): "목" | "화" | "토" | "금" | "수" {
  const idx = HEAVENLY_STEMS.indexOf(stem as (typeof HEAVENLY_STEMS)[number]);
  if (idx < 0) return "목";
  if (idx <= 1) return "목";
  if (idx <= 3) return "화";
  if (idx <= 5) return "토";
  if (idx <= 7) return "금";
  return "수";
}

export type MonthUnResult = {
  monthPillar: string;
  monthGan: string;
  monthBranch: string;
  monthElement: "목" | "화" | "토" | "금" | "수";
};

/**
 * 특정 양력 year, month의 월주·월운 오행을 계산합니다.
 * 절기·입춘 미적용: 월지는 2월=인 … 1월=축, 연간은 양력 연도의 연천간을 사용합니다.
 */
export function calculateMonthUn(year: number, month: number): MonthUnResult | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  const monthIndex = (month - 2 + 12) % 12;
  const yearStemIndex = getYearStemIndex(year);
  const startGanIndex = getStartGanIndexForYinMonth(yearStemIndex);

  const monthGan = HEAVENLY_STEMS[(startGanIndex + monthIndex) % 10]!;
  const monthBranch = MONTH_BRANCHES[monthIndex]!;
  const monthElement = stemToElement(monthGan);

  return {
    monthPillar: `${monthGan}${monthBranch}`,
    monthGan,
    monthBranch,
    monthElement,
  };
}
