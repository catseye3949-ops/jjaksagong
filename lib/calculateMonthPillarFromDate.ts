import solarlunar from "solarlunar";
import type { MonthUnResult } from "./calculateMonthUn";

const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;

/** calculateMonthUn과 동일: 인월=0 … 축월=11 */
const MONTH_BRANCHES = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"] as const;

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

/** solarlunar getTerm(y, n)의 n — 12절입기만 (小寒→丑 … 立春→寅 … 大雪→子) */
const JIE_N_TO_BRANCH_INDEX: readonly { n: number; branchIndex: number }[] = [
  { n: 3, branchIndex: 0 }, // 立春 → 인
  { n: 5, branchIndex: 1 }, // 惊蛰 → 묘
  { n: 7, branchIndex: 2 }, // 清明 → 진
  { n: 9, branchIndex: 3 }, // 立夏 → 사
  { n: 11, branchIndex: 4 }, // 芒种 → 오
  { n: 13, branchIndex: 5 }, // 小暑 → 미
  { n: 15, branchIndex: 6 }, // 立秋 → 신
  { n: 17, branchIndex: 7 }, // 白露 → 유
  { n: 19, branchIndex: 8 }, // 寒露 → 술
  { n: 21, branchIndex: 9 }, // 立冬 → 해
  { n: 23, branchIndex: 10 }, // 大雪 → 자
  { n: 1, branchIndex: 11 }, // 小寒 → 축
];

function parseYmd(input: string | Date): { y: number; m: number; d: number } | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return { y: input.getFullYear(), m: input.getMonth() + 1, d: input.getDate() };
  }
  const t = input.trim().replace(/\./g, "-");
  const parts = t.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}

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

/** 월주 월간에 쓸 연간 기준 연도 — 입춘 이전이면 전년 (calculateMonthUn의 양력 연도만 쓰는 방식과 구분) */
function getYearStemBasisForMonthPillar(y: number, m: number, d: number): number {
  const lichunDay = solarlunar.getTerm(y, 3);
  if (lichunDay < 1) return y;
  if (m < 2 || (m === 2 && d < lichunDay)) return y - 1;
  return y;
}

function noonTs(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

/**
 * 양력 생일이 속한 절입기 구간의 월주(천간은 연간 규칙과 calculateMonthUn 동일)를 계산합니다.
 */
export function calculateMonthPillarFromDate(birthDate: string | Date): MonthUnResult | null {
  const birth = parseYmd(birthDate);
  if (!birth) return null;
  const { y: by, m: bm, d: bd } = birth;
  if (by < YEAR_MIN || by > YEAR_MAX) return null;

  const birthTs = noonTs(by, bm, bd);

  type Cand = { ts: number; branchIndex: number };
  const cands: Cand[] = [];

  for (let y = by - 1; y <= by + 1; y++) {
    if (y < YEAR_MIN || y > YEAR_MAX) continue;
    for (const { n, branchIndex } of JIE_N_TO_BRANCH_INDEX) {
      const day = solarlunar.getTerm(y, n);
      if (day < 1 || day > 31) continue;
      const month = (n + 1) >> 1;
      if (month < 1 || month > 12) continue;
      const dim = new Date(y, month, 0).getDate();
      if (day > dim) continue;
      const ts = noonTs(y, month, day);
      if (ts <= birthTs) {
        cands.push({ ts, branchIndex });
      }
    }
  }

  if (cands.length === 0) return null;

  let best = cands[0]!;
  for (const c of cands) {
    if (c.ts > best.ts) best = c;
  }

  const monthIndex = best.branchIndex;
  const yearStemBasis = getYearStemBasisForMonthPillar(by, bm, bd);
  const yearStemIndex = getYearStemIndex(yearStemBasis);
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
