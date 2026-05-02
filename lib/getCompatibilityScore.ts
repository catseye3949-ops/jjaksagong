/** 천간·지지 문자열 (일주 2글자) */
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
const BRANCHES = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
] as const;

export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];

export const SEXAGENARY_DAY_PILLARS = Array.from({ length: 60 }, (_, index) => {
  return `${STEMS[index % 10]}${BRANCHES[index % 12]}`;
});

const SEXAGENARY_SET = new Set<string>(SEXAGENARY_DAY_PILLARS);

/** 일간 → 천을귀인 지지(표기는 코드 내부용) */
const CHEON_EUL_GIIN: Partial<Record<Stem, Branch[]>> = {
  을: ["자", "신"],
  기: ["자", "신"],
  갑: ["축", "미"],
  무: ["축", "미"],
  경: ["축", "미"],
  신: ["인", "오"],
  임: ["묘", "사"],
  계: ["묘", "사"],
  병: ["해", "유"],
  정: ["해", "유"],
};

const BRANCH_HARMONY_GROUPS: Branch[][] = [
  ["해", "묘", "미"],
  ["인", "오", "술"],
  ["사", "유", "축"],
  ["신", "자", "진"],
  ["해", "자", "축"],
  ["인", "묘", "진"],
  ["사", "오", "미"],
  ["신", "유", "술"],
];

const STEM_CHUNG_PAIRS: [Stem, Stem][] = [
  ["갑", "경"],
  ["을", "신"],
  ["병", "임"],
  ["정", "계"],
];

export type CompatibilityRuleTag =
  | "mutualPositiveFlow"
  | "oneSidedLeadFlow"
  | "sameRhythm"
  | "naturalHarmony"
  | "strongPullTension";

export type CompatibilityScoreResult = {
  score: number;
  /** 화면용 태그(최대 2개), 우선순위·가산 정도 반영 */
  tags: CompatibilityRuleTag[];
};

function isStem(c: string): c is Stem {
  return STEMS.includes(c as Stem);
}

function isBranch(c: string): c is Branch {
  return BRANCHES.includes(c as Branch);
}

export function isValidDayPillar(pillar: string): boolean {
  const t = pillar.trim();
  if (t.length !== 2) return false;
  return SEXAGENARY_SET.has(t);
}

export function parseDayPillar(pillar: string): { stem: Stem; branch: Branch } | null {
  const t = pillar.trim();
  if (t.length !== 2) return null;
  const a = t[0];
  const b = t[1];
  if (!isStem(a) || !isBranch(b)) return null;
  if (!SEXAGENARY_SET.has(t)) return null;
  return { stem: a, branch: b };
}

function hashOffsetMinus4To4(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  const u = h >>> 0;
  return (u % 9) - 4;
}

function cheonEulRelation(
  myStem: Stem,
  myBranch: Branch,
  targetStem: Stem,
  targetBranch: Branch,
): "mutual" | "one" | "none" {
  const myGiin = CHEON_EUL_GIIN[myStem];
  const targetGiin = CHEON_EUL_GIIN[targetStem];
  const mineTowardThem = Boolean(myGiin?.includes(targetBranch));
  const theirsTowardMe = Boolean(targetGiin?.includes(myBranch));
  if (mineTowardThem && theirsTowardMe) return "mutual";
  if (mineTowardThem || theirsTowardMe) return "one";
  return "none";
}

function branchHarmony(a: Branch, b: Branch): boolean {
  if (a === b) return false;
  return BRANCH_HARMONY_GROUPS.some(
    (g) => g.includes(a) && g.includes(b),
  );
}

function stemChung(a: Stem, b: Stem): boolean {
  return STEM_CHUNG_PAIRS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  );
}

const TAG_WEIGHT: Record<CompatibilityRuleTag, number> = {
  mutualPositiveFlow: 18,
  sameRhythm: 15,
  strongPullTension: 15,
  oneSidedLeadFlow: 10,
  naturalHarmony: 8,
};

/**
 * 규칙 기반 궁합 점수(30~90). Math.random 미사용.
 * 동일 myDayPillar + targetDayPillar 조합은 항상 동일 점수.
 */
export function getCompatibilityScore(
  myDayPillar: string,
  targetDayPillar: string,
): CompatibilityScoreResult | null {
  const my = parseDayPillar(myDayPillar);
  const target = parseDayPillar(targetDayPillar);
  if (!my || !target) return null;

  let score = 50;
  const fired: CompatibilityRuleTag[] = [];

  const ce = cheonEulRelation(my.stem, my.branch, target.stem, target.branch);
  if (ce === "mutual") {
    score += 18;
    fired.push("mutualPositiveFlow");
  } else if (ce === "one") {
    score += 10;
    fired.push("oneSidedLeadFlow");
  }

  if (my.branch === target.branch) {
    score += 15;
    fired.push("sameRhythm");
  } else if (branchHarmony(my.branch, target.branch)) {
    score += 8;
    fired.push("naturalHarmony");
  }

  if (stemChung(my.stem, target.stem)) {
    score += 15;
    fired.push("strongPullTension");
  }

  const key = `${myDayPillar.trim()}-${targetDayPillar.trim()}`;
  score += hashOffsetMinus4To4(key);

  score = Math.max(30, Math.min(90, score));

  const unique = [...new Set(fired)];
  unique.sort((a, b) => TAG_WEIGHT[b] - TAG_WEIGHT[a]);
  const tags = unique.slice(0, 2);

  return { score, tags };
}
