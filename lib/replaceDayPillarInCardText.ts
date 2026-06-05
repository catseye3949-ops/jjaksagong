import type { Gender } from "@/lib/domain/user";

/**
 * Replace day-pillar phrases and target pronouns in card copy at render time.
 * Does not modify cardsData — call with strings loaded from data at runtime.
 */

export type TargetPronouns = {
  subject: "그는" | "그녀는";
  possessive: "그의" | "그녀의";
  nominative: "그가" | "그녀가";
  object: "그를" | "그녀를";
};

export function getTargetPronouns(targetGender: Gender): TargetPronouns {
  return targetGender === "female"
    ? {
        subject: "그녀는",
        possessive: "그녀의",
        nominative: "그녀가",
        object: "그녀를",
      }
    : {
        subject: "그는",
        possessive: "그의",
        nominative: "그가",
        object: "그를",
      };
}

export function substituteTargetPronounsInText(
  text: string,
  targetGender: Gender,
): string {
  const {
    subject: pronounSubject,
    possessive: pronounPossessive,
    nominative: pronounNominative,
    object: pronounObject,
  } = getTargetPronouns(targetGender);
  return text
    .split("{pronounPossessive}")
    .join(pronounPossessive)
    .split("{pronounSubject}")
    .join(pronounSubject)
    .split("{pronounNominative}")
    .join(pronounNominative)
    .split("{pronounObject}")
    .join(pronounObject)
    .split("그녀의")
    .join(pronounPossessive)
    .split("그의")
    .join(pronounPossessive)
    .split("그녀는")
    .join(pronounSubject)
    .split("그는")
    .join(pronounSubject)
    .split("그녀가")
    .join(pronounNominative)
    .split("그가")
    .join(pronounNominative)
    .split("그녀를")
    .join(pronounObject)
    .split("그를")
    .join(pronounObject);
}

export function substituteDayPillarInText(
  text: string,
  dayPillar: string,
  displayName: string,
): string {
  const name = displayName.trim();
  if (!name || !dayPillar) return text;
  const term = `${dayPillar}일주`;
  let s = text;
  // Longer / specific phrases first (gender → natural address with 님)
  s = s.split(`${term} 여성`).join(`${name}님`);
  s = s.split(`${term} 남성`).join(`${name}님`);
  s = s.split(`${term}는`).join(`${name}님은`);
  s = s.split(`${term}은`).join(`${name}님은`);
  s = s.split(term).join(name);
  return s;
}

function substituteReportText(
  text: string,
  dayPillar: string,
  displayName: string,
  targetGender: Gender,
) {
  return substituteTargetPronounsInText(
    substituteDayPillarInText(text, dayPillar, displayName),
    targetGender,
  );
}

type BasicCardLike = {
  title: string;
  oneLine: string;
  summary: string;
  traits: string[];
  relationship: string;
  insight: string;
};

export function substituteDayPillarInBasicCard<T extends BasicCardLike>(
  basicCard: T,
  dayPillar: string,
  displayName: string,
  targetGender: Gender,
): T {
  const name = displayName.trim();
  const sub = (t: string) =>
    name && dayPillar
      ? substituteReportText(t, dayPillar, name, targetGender)
      : substituteTargetPronounsInText(t, targetGender);
  return {
    ...basicCard,
    title: sub(basicCard.title),
    oneLine: sub(basicCard.oneLine),
    summary: sub(basicCard.summary),
    traits: basicCard.traits.map(sub),
    relationship: sub(basicCard.relationship),
    insight: sub(basicCard.insight),
  };
}

type PracticalTip = {
  title?: string;
  emoji?: string;
  content: string;
};

type LoveStrategySideLike = {
  title?: string;
  core: string;
  donts: string;
  steps: string;
  contact: string;
  trigger: string;
  coolingPoint: string;
  possibility?: string;
  conclusion: string;
  oneLineHook?: string;
  practicalTips?: {
    contact?: PracticalTip;
    sns?: PracticalTip;
  };
};

function substituteLoveStrategySide<T extends LoveStrategySideLike>(
  side: T,
  dayPillar: string,
  displayName: string,
  targetGender: Gender,
): T {
  const name = displayName.trim();
  const sub = (t: string) =>
    name && dayPillar
      ? substituteReportText(t, dayPillar, name, targetGender)
      : substituteTargetPronounsInText(t, targetGender);
  const tips = side.practicalTips;
  return {
    ...side,
    title: side.title !== undefined ? sub(side.title) : undefined,
    core: sub(side.core),
    donts: sub(side.donts),
    steps: sub(side.steps),
    contact: sub(side.contact),
    trigger: sub(side.trigger),
    coolingPoint: sub(side.coolingPoint),
    possibility:
      side.possibility !== undefined ? sub(side.possibility) : undefined,
    conclusion: sub(side.conclusion),
    oneLineHook:
      side.oneLineHook !== undefined ? sub(side.oneLineHook) : undefined,
    practicalTips: tips
      ? {
          contact: tips.contact
            ? {
                ...tips.contact,
                title:
                  tips.contact.title !== undefined
                    ? sub(tips.contact.title)
                    : undefined,
                content: sub(tips.contact.content),
              }
            : undefined,
          sns: tips.sns
            ? {
                ...tips.sns,
                title:
                  tips.sns.title !== undefined ? sub(tips.sns.title) : undefined,
                content: sub(tips.sns.content),
              }
            : undefined,
        }
      : undefined,
  };
}

export function substituteDayPillarInLoveStrategy<
  T extends {
    male?: LoveStrategySideLike;
    female?: LoveStrategySideLike;
  },
>(
  loveStrategy: T,
  dayPillar: string,
  displayName: string,
  targetGender: Gender,
): T {
  const name = displayName.trim();
  return {
    ...loveStrategy,
    male: loveStrategy.male
      ? substituteLoveStrategySide(
          loveStrategy.male,
          dayPillar,
          name,
          targetGender,
        )
      : undefined,
    female: loveStrategy.female
      ? substituteLoveStrategySide(
          loveStrategy.female,
          dayPillar,
          name,
          targetGender,
        )
      : undefined,
  };
}
