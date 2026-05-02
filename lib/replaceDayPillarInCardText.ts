/**
 * Replace day-pillar phrases in card copy with the user's target name (render-time only).
 * Does not modify cardsData — call with strings loaded from data at runtime.
 */

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
): T {
  const name = displayName.trim();
  if (!name || !dayPillar) return basicCard;
  const sub = (t: string) => substituteDayPillarInText(t, dayPillar, name);
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
): T {
  const name = displayName.trim();
  if (!name || !dayPillar) return side;
  const sub = (t: string) => substituteDayPillarInText(t, dayPillar, name);
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
>(loveStrategy: T, dayPillar: string, displayName: string): T {
  const name = displayName.trim();
  if (!name || !dayPillar) return loveStrategy;
  return {
    ...loveStrategy,
    male: loveStrategy.male
      ? substituteLoveStrategySide(loveStrategy.male, dayPillar, name)
      : undefined,
    female: loveStrategy.female
      ? substituteLoveStrategySide(loveStrategy.female, dayPillar, name)
      : undefined,
  };
}
