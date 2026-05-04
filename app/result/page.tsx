import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ResultIsPaidGate from "@/components/result/ResultIsPaidGate";
import ResultPageBody from "@/components/result/ResultPageBody";
import { cardsBasicData } from "@/data/cardsBasicData";
import { calculateIlju } from "../../lib/calculateIlju";
import { JJAK_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/sessionToken";
import type { Gender } from "../../lib/domain/user";
import {
  normalizeDayPillarForPurchase,
  normalizeTargetBirthDateForPurchase,
} from "@/lib/purchaseBirthNormalize";
import { getLoveStrategyForDayPillar } from "@/lib/server/getLoveStrategyForDayPillar";
import {
  fetchPurchasesForEmail,
  resolveResultPageIsPaid,
} from "@/lib/server/supabasePurchases";
import { isValidDayPillar } from "@/lib/getCompatibilityScore";
import {
  substituteDayPillarInBasicCard,
  substituteDayPillarInLoveStrategy,
} from "@/lib/replaceDayPillarInCardText";

type SearchParams = Promise<{
  name?: string;
  targetName?: string;
  birthdate?: string;
  birthtime?: string;
  gender?: string;
  dayPillar?: string;
  from?: string;
  /** Purchased report id — loads stored partner photo from account */
  reportId?: string;
}>;

type ResultPageProps = {
  searchParams: SearchParams;
};

type LoveStrategySide = {
  practicalTips?: {
    contact?: {
      title?: string;
      emoji?: string;
      content: string;
    };
    sns?: {
      title?: string;
      emoji?: string;
      content: string;
    };
  };
  title?: string;
  oneLineHook?: string;
  core: string;
  donts: string;
  steps: string;
  contact: string;
  trigger: string;
  coolingPoint: string;
  possibility?: string;
  conclusion: string;
};

type ResolvedCard = {
  basicCard?: {
    title: string;
    oneLine: string;
    summary: string;
    traits: string[];
    relationship: string;
    insight: string;
  };
  loveStrategy?: {
    male?: LoveStrategySide;
    female?: LoveStrategySide;
  };
};

function getTopicParticle(text: string) {
  const trimmed = text.trim();
  const lastChar = trimmed.charAt(trimmed.length - 1);
  if (!lastChar) return "는";

  const code = lastChar.charCodeAt(0);
  const isKoreanSyllable = code >= 0xac00 && code <= 0xd7a3;
  if (!isKoreanSyllable) return "는";

  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return hasBatchim ? "은" : "는";
}

function getAgeFromBirthdate(birthdate: string): number | null {
  const normalized = birthdate.trim().replace(/\./g, "-").replace(/\//g, "-");
  const [yearText, monthText, dayText] = normalized.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;
  const targetNameParam = params.targetName?.trim() || "";
  const nameParam = params.name?.trim() || "";
  /** 상대 표시명: 궁합 등에서 targetName 우선, 기존 name 쿼리와 호환 */
  const name = targetNameParam || nameParam || "이 사람";
  /** Name from query only — if empty, keep cardsData 일주 문구 (fallback 표시명 제외) */
  const userProvidedTargetName = (targetNameParam || nameParam).trim();
  const birthdate = params.birthdate || "";
  const birthtime = params.birthtime || "";
  const gender: Gender = params.gender === "female" ? "female" : "male";

  const dayPillarParam = params.dayPillar?.trim() || "";
  const dayPillarFromQuery =
    dayPillarParam && isValidDayPillar(dayPillarParam) ? dayPillarParam : null;
  const dayPillar =
    dayPillarFromQuery ?? calculateIlju(birthdate, birthtime);
  const reportId = params.reportId?.trim() || "";

  /** 생년월일이 없고 일주도 확정되지 않으면 빈·깨진 링크로 간주 (궁합 등 dayPillar-only 유입은 유지) */
  if (!dayPillar && birthdate.trim().length === 0) {
    redirect("/main");
  }

  const cookieStore = await cookies();
  const sessionRaw = cookieStore.get(JJAK_SESSION_COOKIE)?.value ?? null;
  const session = sessionRaw ? verifySessionToken(sessionRaw) : null;
  const sessionEmail = session?.sub ?? null;

  const dayPillarForPurchaseCheck =
    typeof dayPillar === "string" && dayPillar.trim()
      ? normalizeDayPillarForPurchase(dayPillar) ?? dayPillar.trim()
      : null;

  const normBirthServer = normalizeTargetBirthDateForPurchase(birthdate);

  let serverIsPaid = false;
  try {
    serverIsPaid = await resolveResultPageIsPaid({
      sessionEmail,
      targetBirthDate: birthdate,
      dayPillar: dayPillarForPurchaseCheck,
    });
  } catch (e) {
    console.error("[result] resolveResultPageIsPaid failed", e);
    serverIsPaid = false;
  }

  let purchasesRowsForLog: Awaited<
    ReturnType<typeof fetchPurchasesForEmail>
  > = [];
  if (sessionEmail != null) {
    try {
      purchasesRowsForLog = await fetchPurchasesForEmail(sessionEmail);
    } catch (e) {
      console.error("[result] fetchPurchasesForEmail failed", e);
    }
  }

  console.log("[result] server unlock summary", {
    sessionEmail,
    hasSessionCookie: Boolean(sessionRaw),
    birthdateQuery: birthdate,
    normalizedBirthdate: normBirthServer,
    calculatedDayPillar: dayPillar,
    dayPillarNormalizedForMatch: dayPillarForPurchaseCheck,
    dayPillarParam,
    dayPillarFromQuery,
    purchasesRows: purchasesRowsForLog,
    matchResultServer: serverIsPaid,
  });

  const canOfferPurchase = birthdate.trim().length > 0;
  const basicCardRaw =
    dayPillar && dayPillar in cardsBasicData
      ? cardsBasicData[dayPillar as keyof typeof cardsBasicData]?.basicCard
      : undefined;
  const loveStrategyRaw = dayPillar
    ? getLoveStrategyForDayPillar(dayPillar)
    : undefined;

  const basicCard =
    basicCardRaw && userProvidedTargetName && dayPillar
      ? substituteDayPillarInBasicCard(basicCardRaw, dayPillar, userProvidedTargetName)
      : basicCardRaw;
  const loveStrategy =
    loveStrategyRaw && userProvidedTargetName && dayPillar
      ? substituteDayPillarInLoveStrategy(
          loveStrategyRaw,
          dayPillar,
          userProvidedTargetName,
        )
      : loveStrategyRaw;

  const card: ResolvedCard | null =
    dayPillar && (basicCard || loveStrategy)
      ? { basicCard, loveStrategy }
      : null;
  const topicParticle = getTopicParticle(name);
  const basicTitle = card?.basicCard?.title || `${name}${topicParticle} 어떤 사람?`;
  const age = getAgeFromBirthdate(birthdate);
  const genderLabel = gender === "female" ? "여" : "남";
  const subjectLine =
    age !== null ? `${name} · ${age}살 ${genderLabel}` : `${name} · ${genderLabel}`;
  const strategySource =
    card?.loveStrategy?.[gender] ||
    (gender === "male" ? card?.loveStrategy?.female : card?.loveStrategy?.male);
  const oneLineHook = strategySource?.oneLineHook?.trim() || "";
  const strategySections = strategySource
    ? [
        { key: "core", label: "핵심 전략", content: strategySource.core },
        { key: "donts", label: "절대 금지", content: strategySource.donts },
        { key: "steps", label: "단계별 접근", content: strategySource.steps },
        { key: "contact", label: "연락 스타일", content: strategySource.contact },
        { key: "trigger", label: "감정 트리거", content: strategySource.trigger },
        {
          key: "coolingPoint",
          label: "관계 식는 포인트",
          content: strategySource.coolingPoint,
        },
        ...(strategySource.possibility
          ? [
              {
                key: "possibility",
                label: "관계 가능성",
                content: strategySource.possibility,
              },
            ]
          : []),
        {
          key: "conclusion",
          label: "한 줄 결론",
          content: strategySource.conclusion,
        },
      ]
    : [];
  const practicalTips = strategySource?.practicalTips
    ? [
        strategySource.practicalTips.contact
          ? {
              key: "contact",
              title:
                strategySource.practicalTips.contact.title ||
                "연락은 이렇게 해보세요!",
              emoji: strategySource.practicalTips.contact.emoji || "💬",
              content: strategySource.practicalTips.contact.content,
            }
          : null,
        strategySource.practicalTips.sns
          ? {
              key: "sns",
              title:
                strategySource.practicalTips.sns.title ||
                "이런 SNS가 어필돼요!",
              emoji: strategySource.practicalTips.sns.emoji || "📸",
              content: strategySource.practicalTips.sns.content,
            }
          : null,
      ].filter((tip): tip is { key: string; title: string; emoji: string; content: string } => Boolean(tip))
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[20%] h-[320px] w-[320px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <ResultIsPaidGate
        serverIsPaid={serverIsPaid}
        birthdate={birthdate}
        birthtime={birthtime}
        dayPillar={dayPillar}
      >
        <ResultPageBody
          name={name}
          gender={gender}
          birthdate={birthdate}
          birthtime={birthtime}
          reportId={reportId}
          dayPillar={dayPillar}
          dayPillarFromQuery={dayPillarFromQuery}
          canOfferPurchase={canOfferPurchase}
          subjectLine={subjectLine}
          basicTitle={basicTitle}
          oneLineHook={oneLineHook}
          strategySections={strategySections}
          practicalTips={practicalTips}
          card={card}
        />
      </ResultIsPaidGate>
    </main>
  );
}