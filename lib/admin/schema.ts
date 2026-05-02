/**
 * 향후 Supabase(Postgres) 등 실DB 적용 시 참고할 테이블 단위 타입.
 * 실운영에서는 서버 라우트/API에서만 조회·집계하고, 클라이언트 비밀번호만으로는 노출 금지.
 *
 * @see mapDbToServiceStatsRows (stub) — 구매/리포트 JOIN 결과를 ServiceStatsPurchaseRow[] 로 변환
 */

import type { Gender } from "../domain/user";

/** users — 계정 */
export type DbUserRow = {
  id: string;
  email: string;
  nickname: string;
  referral_code: string;
  referred_by: string | null;
  referral_reward_balance: number;
  referral_success_count: number;
  created_at: string;
  updated_at: string;
};

/** purchases — 결제 건 (금액·정산 단위) */
export type DbPurchaseRow = {
  id: string;
  user_id: string;
  amount_won: number;
  currency: "KRW";
  purchased_at: string;
  /** 연결된 저장 리포트 */
  report_id: string;
  status: "completed" | "refunded" | "pending";
  /** PG 식별자, 영수증 등 (선택) */
  external_ref?: string | null;
};

/** reports — 마이페이지에 저장된 공략 리포트(상대 1인분) */
export type DbReportRow = {
  id: string;
  user_id: string;
  partner_name: string;
  /** YYYY-MM-DD */
  birth: string;
  birthtime: string | null;
  /** 상대(분석 대상) 성별 */
  gender: Gender;
  ilju: string;
  /** object storage URL 등 (base64는 DB에 넣지 않는 것 권장) */
  photo_url: string | null;
  created_at: string;
  /** nullable: 무료만 저장하는 정책이면 purchase 없을 수 있음 */
  purchase_id: string | null;
};
