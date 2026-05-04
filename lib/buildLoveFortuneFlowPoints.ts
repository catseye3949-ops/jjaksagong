import type { DaewoonListResult } from "./calculateDaewoonList";
import type { FiveElement } from "./calculateLoveFortune";
import type { LoveFortunePeriodsResult } from "./calculateLoveFortunePeriods";
import { calculateMonthUn } from "./calculateMonthUn";
import { calculateYearUn } from "./calculateYearUn";

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

function elementUn(el: FiveElement): string {
  return `${el}운`;
}

function parseBirthYmd(s: string): { y: number; m: number; d: number } | null {
  const t = s.trim().replace(/\./g, "-");
  const parts = t.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** 해당 양력 연·월 1일 기준 만나이 */
function fullAgeAtMonthStart(birth: { y: number; m: number; d: number }, y: number, mo: number): number {
  const monthStart = new Date(y, mo - 1, 1, 12, 0, 0, 0).getTime();
  const birthdayThisYear = new Date(y, birth.m - 1, birth.d, 12, 0, 0, 0).getTime();
  let age = y - birth.y;
  if (monthStart < birthdayThisYear) {
    age -= 1;
  }
  return age;
}

function splitPillar(pillar: string): { stem: string; branch: string } | null {
  const t = pillar.trim();
  if (t.length !== 2) return null;
  return { stem: t[0]!, branch: t[1]! };
}

const SCORE_MAX = 9;

export type LoveFlowPoint = {
  year: number;
  month: number;
  xLabel: string;
  score: number;
  detailDaewoon: string;
  detailYearUn: string;
  detailMonthUn: string;
};

/**
 * 연운·월운·대운(5년 천간/5년 지지)을 합산해 60개월 연애운 점수(0~9)와 툴팁용 문장을 만듭니다.
 */
export function buildLoveFortuneFlowPoints(
  periods: LoveFortunePeriodsResult,
  daewoon: DaewoonListResult,
  birthDate: string,
  now: Date,
): LoveFlowPoint[] {
  const birth = parseBirthYmd(birthDate);
  if (!birth) {
    return [];
  }

  const yearAdd = new Map<number, number>();
  for (const y of periods.years) {
    yearAdd.set(y.year, y.status === "excellent" ? 4 : 2);
  }
  const monthAdd = new Map<string, number>();
  for (const m of periods.months) {
    monthAdd.set(`${m.year}-${m.month}`, m.status === "excellent" ? 2 : 1);
  }

  const target = periods.targetElement;

  let y = now.getFullYear();
  let mo = now.getMonth() + 1;
  const out: LoveFlowPoint[] = [];

  for (let i = 0; i < 60; i++) {
    const yScore = yearAdd.get(y) ?? 0;
    const mScore = monthAdd.get(`${y}-${mo}`) ?? 0;

    let dScore = 0;
    let detailDaewoon = "대운: —";
    const age = fullAgeAtMonthStart(birth, y, mo);
    const item = daewoon.items.find((it) => age >= it.startAge && age <= it.endAge);
    if (item) {
      const sp = splitPillar(item.pillar);
      if (sp) {
        const stemEl = stemToElement(sp.stem);
        const brEl = branchToElement(sp.branch);
        const offset = age - item.startAge;
        const firstHalf = offset <= 4;
        const activeEl = firstHalf ? stemEl : brEl;
        if (activeEl === target) {
          dScore = 3;
        }
        const halfLabel = firstHalf ? "앞 5년" : "뒤 5년";
        const activeLabel = activeEl ? elementUn(activeEl) : "—";
        detailDaewoon = `대운: ${item.pillar}대운 ${halfLabel} · ${activeLabel}`;
      }
    }

    const score = Math.min(SCORE_MAX, yScore + mScore + dScore);

    const yu = calculateYearUn(y);
    const mu = calculateMonthUn(y, mo);
    let detailYearUn = "연운: —";
    let detailMonthUn = "월운: —";
    if (yu) {
      const ge = stemToElement(yu.yearGan);
      const be = branchToElement(yu.yearBranch);
      detailYearUn = `연운: ${yu.yearPillar}년 · ${ge ?? "—"}/${be ?? "—"}`;
    }
    if (mu) {
      const ge = stemToElement(mu.monthGan);
      const be = branchToElement(mu.monthBranch);
      detailMonthUn = `월운: ${mu.monthPillar}월 · ${ge ?? "—"}/${be ?? "—"}`;
    }

    out.push({
      year: y,
      month: mo,
      xLabel: `${y}.${String(mo).padStart(2, "0")}`,
      score,
      detailDaewoon,
      detailYearUn,
      detailMonthUn,
    });

    mo += 1;
    if (mo > 12) {
      mo = 1;
      y += 1;
    }
  }

  return out;
}

export const LOVE_FLOW_SCORE_MAX = SCORE_MAX;
