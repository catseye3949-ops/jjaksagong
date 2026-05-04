import { calculateDaewoonDirection } from "./calculateDaewoonDirection";
import { calculateDaewoonStartAge } from "./calculateDaewoonStartAge";
import { calculateMonthPillarFromDate } from "./calculateMonthPillarFromDate";
import { calculateYearUn } from "./calculateYearUn";

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

/** index 0 = 갑자 (calculateYearUn과 동일) */
const SEXAGENARY_60 = Array.from({ length: 60 }, (_, i) => {
  return `${HEAVENLY_STEMS[i % 10]!}${EARTHLY_BRANCHES[i % 12]!}`;
});

function parseBirthYmd(input: string | Date): { y: number; m: number; d: number } | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return {
      y: input.getFullYear(),
      m: input.getMonth() + 1,
      d: input.getDate(),
    };
  }
  const t = input.trim().replace(/\./g, "-");
  const parts = t.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return { y, m, d };
}

export type DaewoonListItem = {
  order: number;
  pillar: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
};

export type DaewoonListResult = {
  direction: "forward" | "backward";
  startAge: number;
  startAgeDetail: {
    daysDiff: number;
    targetTermDate: string;
    targetTermName: string;
  };
  yearPillar: string;
  monthPillar: string;
  items: DaewoonListItem[];
};

/**
 * 생년월일·성별을 기준으로 대운 방향, 시작 나이, 월주 기준 대운 간지 목록을 계산합니다.
 */
export function calculateDaewoonList(
  birthDate: string | Date,
  birthTime: string | undefined,
  gender: "male" | "female",
  count: number = 8,
): DaewoonListResult | null {
  void birthTime;

  const birth = parseBirthYmd(birthDate);
  if (!birth) return null;

  const n = count;
  if (!Number.isInteger(n) || n < 1) {
    return null;
  }

  const { y: birthYear } = birth;

  const yearUn = calculateYearUn(birthYear);
  if (!yearUn) return null;

  const dir = calculateDaewoonDirection(gender, yearUn.yearGan);
  if (!dir) return null;

  const monthUn = calculateMonthPillarFromDate(birthDate);
  if (!monthUn) return null;

  const startAgeRes = calculateDaewoonStartAge(birthDate, dir.direction);
  if (!startAgeRes) return null;

  const monthIdx = SEXAGENARY_60.indexOf(monthUn.monthPillar);
  if (monthIdx < 0) return null;

  const baseStartAge = startAgeRes.startAge;
  const items: DaewoonListItem[] = [];

  for (let order = 1; order <= n; order++) {
    const pillarIdx =
      dir.direction === "forward"
        ? (monthIdx + order + 60) % 60
        : (monthIdx - order + 60) % 60;

    const pillar = SEXAGENARY_60[pillarIdx]!;
    const itemStartAge = baseStartAge + (order - 1) * 10;
    const itemEndAge = itemStartAge + 9;
    const startYear = birthYear + baseStartAge + (order - 1) * 10;
    const endYear = startYear + 9;

    items.push({
      order,
      pillar,
      startAge: itemStartAge,
      endAge: itemEndAge,
      startYear,
      endYear,
    });
  }

  return {
    direction: dir.direction,
    startAge: baseStartAge,
    startAgeDetail: {
      daysDiff: startAgeRes.daysDiff,
      targetTermDate: startAgeRes.targetTermDate,
      targetTermName: startAgeRes.targetTermName,
    },
    yearPillar: yearUn.yearPillar,
    monthPillar: monthUn.monthPillar,
    items,
  };
}
