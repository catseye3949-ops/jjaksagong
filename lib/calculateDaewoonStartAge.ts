import solarlunar from "solarlunar";
import type { SolarLunarResult } from "solarlunar";

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;
const MAX_SEARCH_DAYS = 40;

/** 월이 바뀌는 12절입기 — solarlunar.lunarTerm 인덱스 (0,2,4,…,22) */
const JIE_TERM_INDICES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

function buildJieTermSet(): Set<string> {
  const set = new Set<string>();
  for (const i of JIE_TERM_INDICES) {
    set.add(solarlunar.lunarTerm[i]!);
  }
  return set;
}

const JIE_TERMS = buildJieTermSet();

function parseBirthParts(input: string | Date): { y: number; m: number; d: number } | null {
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

function isYearInRange(y: number): boolean {
  return y >= YEAR_MIN && y <= YEAR_MAX;
}

function solar2lunarSafe(y: number, m: number, d: number): SolarLunarResult | null {
  if (!isYearInRange(y)) return null;
  const r = solarlunar.solar2lunar(y, m, d);
  if (r === -1) return null;
  return r;
}

/** 월이 바뀌는 절입기(12절)일 때만 true — isTerm이어도 「중기」는 제외 */
function isJieEntryDay(result: SolarLunarResult): boolean {
  return result.isTerm && JIE_TERMS.has(result.term);
}

function addCalendarDays(y: number, mo: number, d: number, delta: number): { y: number; m: number; d: number } {
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
  dt.setDate(dt.getDate() + delta);
  return {
    y: dt.getFullYear(),
    m: dt.getMonth() + 1,
    d: dt.getDate(),
  };
}

function formatYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 양의 정수 daysDiff에 대해 3일=1세 규칙 적용 */
function startAgeFromDaysDiff(daysDiff: number): number {
  if (daysDiff <= 0) return 0;
  const q = Math.trunc(daysDiff / 3);
  const r = daysDiff % 3;
  if (r === 0 || r === 1) return q;
  return q + 1;
}

/** 정오 기준 달력 일 차이 (later − earlier, 일 단위) */
function calendarDiffDays(
  earlier: { y: number; m: number; d: number },
  later: { y: number; m: number; d: number },
): number {
  const a = new Date(earlier.y, earlier.m - 1, earlier.d, 12, 0, 0, 0).getTime();
  const b = new Date(later.y, later.m - 1, later.d, 12, 0, 0, 0).getTime();
  return Math.round((b - a) / 86400000);
}

export type DaewoonStartAgeResult = {
  startAge: number;
  daysDiff: number;
  targetTermDate: string;
  targetTermName: string;
};

/**
 * birthDate 기준 순행·역행 대운 시작 나이(3일=1세)를 계산합니다.
 * 절입기는 solarlunar의 12절(立春·惊蛰·…·小寒)만 인정합니다.
 */
export function calculateDaewoonStartAge(
  birthDate: string | Date,
  direction: "forward" | "backward",
): DaewoonStartAgeResult | null {
  const birth = parseBirthParts(birthDate);
  if (!birth) return null;
  if (!isYearInRange(birth.y)) return null;

  if (direction === "forward") {
    for (let step = 1; step <= MAX_SEARCH_DAYS; step++) {
      const { y, m, d } = addCalendarDays(birth.y, birth.m, birth.d, step);
      if (!isYearInRange(y)) return null;
      const lunar = solar2lunarSafe(y, m, d);
      if (!lunar) return null;
      if (isJieEntryDay(lunar)) {
        const daysDiff = calendarDiffDays(birth, { y, m, d });
        return {
          startAge: startAgeFromDaysDiff(daysDiff),
          daysDiff,
          targetTermDate: formatYmd(y, m, d),
          targetTermName: lunar.term,
        };
      }
    }
    return null;
  }

  if (direction === "backward") {
    for (let step = 1; step <= MAX_SEARCH_DAYS; step++) {
      const { y, m, d } = addCalendarDays(birth.y, birth.m, birth.d, -step);
      if (!isYearInRange(y)) return null;
      const lunar = solar2lunarSafe(y, m, d);
      if (!lunar) return null;
      if (isJieEntryDay(lunar)) {
        const daysDiff = calendarDiffDays({ y, m, d }, birth);
        return {
          startAge: startAgeFromDaysDiff(daysDiff),
          daysDiff,
          targetTermDate: formatYmd(y, m, d),
          targetTermName: lunar.term,
        };
      }
    }
    return null;
  }

  return null;
}
