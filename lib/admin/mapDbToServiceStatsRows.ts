/**
 * 실운영 시 서버(예: Route Handler + Supabase service role)에서 구현.
 *
 * - admin 클라이언트에서 직접 DB 접속 금지
 * - 세션/역할 기반 인증 후 집계 전용 API만 노출
 *
 * 예시 입력: DbUserRow[], DbPurchaseRow[], DbReportRow[] 또는 JOIN 결과
 * 출력: `aggregateServiceStats`에 넘길 ServiceStatsPurchaseRow[]
 */

import type { DbPurchaseRow, DbReportRow, DbUserRow } from "./schema";
import type { ServiceStatsPurchaseRow } from "./serviceStatsRow";

export type MapDbToServiceStatsRowsInput = {
  usersById: Record<string, DbUserRow>;
  purchases: DbPurchaseRow[];
  reports: DbReportRow[];
};

/**
 * 스키마 연결용 스텁. 실DB 연동 시 서버에서 완성.
 */
export function mapDbToServiceStatsRows(
  _input: MapDbToServiceStatsRowsInput,
): ServiceStatsPurchaseRow[] {
  void _input;
  throw new Error(
    "mapDbToServiceStatsRows: implement server-side after Supabase migration",
  );
}
