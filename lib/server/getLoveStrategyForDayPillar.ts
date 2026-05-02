import "server-only";

import { cardsPremiumData } from "@/data/cardsPremiumData";

/** Server-only. Do not import from client components. */
export function getLoveStrategyForDayPillar(dayPillar: string) {
  return cardsPremiumData[dayPillar as keyof typeof cardsPremiumData]
    ?.loveStrategy;
}
