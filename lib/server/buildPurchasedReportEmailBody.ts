import "server-only";

import { cardsBasicData } from "@/data/cardsBasicData";
import { calculateIlju } from "@/lib/calculateIlju";
import type { Gender, PurchasedReport } from "@/lib/domain/user";
import { formatBirthDisplay, getManAgeFromIsoDate } from "@/lib/formatBirth";
import { isValidDayPillar } from "@/lib/getCompatibilityScore";
import {
  substituteDayPillarInBasicCard,
  substituteDayPillarInLoveStrategy,
} from "@/lib/replaceDayPillarInCardText";
import { getLoveStrategyForDayPillar } from "@/lib/server/getLoveStrategyForDayPillar";

function truncate(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function buildPurchasedReportEmailText(opts: {
  report: PurchasedReport;
  /** Saved / paid reports: summary + link only */
  isPremium: boolean;
  resultAbsoluteUrl: string;
}): { textPlain: string } {
  const { report, isPremium, resultAbsoluteUrl } = opts;
  const name = report.name.trim() || "상대";
  const birthtime = report.birthtime ?? "";
  const dayPillar =
    report.ilju && isValidDayPillar(report.ilju)
      ? report.ilju
      : calculateIlju(report.birth, birthtime) ?? "";

  const gender: Gender = report.gender;
  const genderLabel = gender === "female" ? "여성" : "남성";
  const birthLine = formatBirthDisplay(report.birth);
  const age = getManAgeFromIsoDate(report.birth);
  const birthAgeLine =
    age !== null
      ? `${birthLine} · 만 ${age}세 · ${genderLabel}`
      : `${birthLine} · ${genderLabel}`;

  const basicCardRaw =
    dayPillar && dayPillar in cardsBasicData
      ? cardsBasicData[dayPillar as keyof typeof cardsBasicData]?.basicCard
      : undefined;
  const loveStrategyRaw = dayPillar
    ? getLoveStrategyForDayPillar(dayPillar)
    : undefined;

  const basicCard =
    basicCardRaw && name && dayPillar
      ? substituteDayPillarInBasicCard(basicCardRaw, dayPillar, name)
      : basicCardRaw;

  const loveStrategy =
    loveStrategyRaw && name && dayPillar
      ? substituteDayPillarInLoveStrategy(
          loveStrategyRaw,
          dayPillar,
          name,
        )
      : loveStrategyRaw;

  const strategySource =
    loveStrategy?.[gender] ||
    (gender === "male" ? loveStrategy?.female : loveStrategy?.male);

  const basicSummary =
    basicCard?.summary?.trim() || "기본 성향 요약을 불러오지 못했습니다.";
  const oneLineHook = strategySource?.oneLineHook?.trim() || "";
  const core = strategySource?.core?.trim() || "";

  const lines: string[] = [];
  lines.push(
    "안녕하세요, 짝사공입니다.",
    "",
    "저장해 두신 연애 공략 리포트 요약입니다.",
    "",
  );
  lines.push("■ 상대 이름", name, "");
  lines.push("■ 생년월일 · 나이 · 성별", birthAgeLine, "");

  if (isPremium) {
    lines.push(
      "■ 기본 성향 요약",
      truncate(basicSummary, 500),
      "",
      "■ 연애 공략 핵심 요약",
      [
        oneLineHook ? `· 한 줄 후크: ${oneLineHook}` : null,
        core ? `· 핵심 전략(발췌): ${truncate(core, 400)}` : null,
      ]
        .filter(Boolean)
        .join("\n") || "· (요약은 앱에서 전체를 확인해 주세요.)",
      "",
      "프리미엄 리포트는 이메일에 전체 본문을 담지 않았어요. 아래 링크에서 전체 내용을 확인할 수 있어요.",
      "",
    );
  } else {
    lines.push("■ 기본 성향 요약", basicSummary, "", "■ 연애 공략", "");
    if (oneLineHook) lines.push(oneLineHook);
    if (core) lines.push(truncate(core, 2000));
    lines.push("");
  }

  lines.push("■ 다시 보기", resultAbsoluteUrl, "", "—", "짝사공");

  return { textPlain: lines.join("\n") };
}
