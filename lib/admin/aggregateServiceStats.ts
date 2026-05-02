/**
 * 서비스 통계 집계 (순수 함수).
 * 데이터 소스는 `ServiceStatsPurchaseRow[]` 한 가지 — localStorage/DB 모두 이 shape으로 맞춘 뒤 전달.
 *
 * 운영 시: 서버에서 인증·권한 검증 후 Supabase로 JOIN 집계하거나,
 * 이 함수를 서버에서만 호출해 JSON으로 admin에 내려주는 방식 권장.
 * (클라이언트 비밀번호 + localStorage 는 데모용)
 */

import type { ServiceStatsPurchaseRow } from "./serviceStatsRow";
import type { Gender } from "../domain/user";

export type AdminRecentPurchaseRow = {
  purchasedAt: string;
  buyerEmail: string;
  buyerNickname: string;
  partnerName: string;
  ilju: string;
  gender: Gender;
  reportId: string;
};

export type AdminServiceStats = {
  totalPaymentCount: number;
  totalRevenueWon: number;
  todayPaymentCount: number;
  savedReportCount: number;
  topIlju: { ilju: string; count: number }[];
  genderBreakdown: { male: number; female: number };
  /** 요약 문구 (저장 리포트 상대 성별 분포 기준) */
  dominantGenderCombinationLabel: string;
  recentPurchases: AdminRecentPurchaseRow[];
  iljuCountsSorted: { ilju: string; count: number }[];
};

function isSameLocalCalendarDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function toRecentRow(r: ServiceStatsPurchaseRow): AdminRecentPurchaseRow {
  return {
    purchasedAt: r.purchasedAt,
    buyerEmail: r.buyerEmail,
    buyerNickname: r.buyerNickname,
    partnerName: r.partnerName,
    ilju: r.ilju,
    gender: r.subjectGender,
    reportId: r.reportId,
  };
}

export type AggregateServiceStatsOptions = {
  /**
   * `ServiceStatsPurchaseRow.amountWon` 이 없을 때 사용 (행 단가).
   * DB에서 amount_won 을 항상 채우면 이 값만으로는 합산이 덜 쓰일 수 있음.
   */
  pricePerReportWon: number;
  /** Override clock (tests) */
  now?: Date;
};

/**
 * 집계만 수행. `rows`는 호출 측에서 `mapUserRecordToPurchaseReportRows` / DB 매퍼로 준비.
 */
export function aggregateServiceStats(
  rows: ServiceStatsPurchaseRow[],
  options: AggregateServiceStatsOptions,
): AdminServiceStats {
  const now = options.now ?? new Date();
  const defaultPrice = options.pricePerReportWon;

  const recentPurchases = rows.map(toRecentRow);
  const iljuMap = new Map<string, number>();
  let male = 0;
  let female = 0;
  let todayPaymentCount = 0;

  for (const r of rows) {
    const key = r.ilju?.trim() ? r.ilju : "(미상)";
    iljuMap.set(key, (iljuMap.get(key) ?? 0) + 1);
    if (r.subjectGender === "female") female += 1;
    else male += 1;
    if (isSameLocalCalendarDay(r.purchasedAt, now)) todayPaymentCount += 1;
  }

  const total = rows.length;
  const totalRevenueWon = rows.reduce(
    (sum, r) => sum + (r.amountWon ?? defaultPrice),
    0,
  );

  const iljuCountsSorted = [...iljuMap.entries()]
    .map(([ilju, count]) => ({ ilju, count }))
    .sort((a, b) => b.count - a.count);

  const topIlju = iljuCountsSorted.slice(0, 5);

  const pct = (n: number) =>
    total > 0 ? ((n / total) * 100).toFixed(1) : "0";

  let dominantGenderCombinationLabel = "저장된 리포트가 없습니다.";
  if (total > 0) {
    if (male > female) {
      dominantGenderCombinationLabel = `상대(리포트) 성별 · 남성 ${male}건 (${pct(male)}%) — 가장 많음`;
    } else if (female > male) {
      dominantGenderCombinationLabel = `상대(리포트) 성별 · 여성 ${female}건 (${pct(female)}%) — 가장 많음`;
    } else {
      dominantGenderCombinationLabel = `상대(리포트) 성별 · 남성 ${male}건 / 여성 ${female}건 (동일)`;
    }
  }

  recentPurchases.sort(
    (a, b) =>
      new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
  );

  return {
    totalPaymentCount: total,
    totalRevenueWon,
    todayPaymentCount,
    savedReportCount: total,
    topIlju,
    genderBreakdown: { male, female },
    dominantGenderCombinationLabel,
    recentPurchases,
    iljuCountsSorted,
  };
}
