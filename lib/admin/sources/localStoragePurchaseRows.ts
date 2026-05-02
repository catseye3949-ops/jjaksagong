/**
 * 데모 전용: `readUsers()` 결과(또는 메모리상 UserAccount 맵) → 집계용 행.
 * 운영 시 이 모듈 대신 서버 API + `mapDbToServiceStatsRows` 결과를 사용.
 */

import type { UserAccount } from "@/lib/domain/user";
import { DEMO_REPORT_PRICE_WON } from "@/lib/billing";
import { readUsers } from "@/lib/storage/userStore";
import type { ServiceStatsPurchaseRow } from "../serviceStatsRow";

/** localStorage 구조를 집계 입력으로만 변환 (통계 알고리즘 없음) */
export function mapUserRecordToPurchaseReportRows(
  users: Record<string, UserAccount>,
): ServiceStatsPurchaseRow[] {
  const rows: ServiceStatsPurchaseRow[] = [];
  for (const buyer of Object.values(users)) {
    for (const r of buyer.purchasedReports) {
      rows.push({
        reportId: r.id,
        purchaseId: r.id,
        purchasedAt: r.purchasedAt,
        amountWon: DEMO_REPORT_PRICE_WON,
        buyerEmail: buyer.email,
        buyerNickname: buyer.nickname,
        partnerName: r.name,
        ilju: r.ilju?.trim() ? r.ilju : "(미상)",
        subjectGender: r.gender,
      });
    }
  }
  return rows;
}

export function loadPurchaseReportRowsFromLocalStorage(): ServiceStatsPurchaseRow[] {
  return mapUserRecordToPurchaseReportRows(readUsers());
}
