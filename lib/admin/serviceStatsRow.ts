/**
 * `aggregateServiceStats` 입력 한 행.
 * - 데모: localStorage `UserAccount` + `PurchasedReport` 를 평탄화.
 * - 운영: `purchases` + `reports` (+ `users`) JOIN 후 동일 필드로 매핑.
 */

import type { Gender } from "../domain/user";

export type ServiceStatsPurchaseRow = {
  reportId: string;
  /** 데모에선 report id와 동일. 운영에선 purchase id */
  purchaseId: string;
  purchasedAt: string;
  /**
   * 해당 건 매출(원). 미지정 시 `aggregateServiceStats` 옵션의 단가로 대체.
   */
  amountWon?: number;
  buyerEmail: string;
  buyerNickname: string;
  partnerName: string;
  ilju: string;
  /** 리포트 대상(상대) 성별 */
  subjectGender: Gender;
};
