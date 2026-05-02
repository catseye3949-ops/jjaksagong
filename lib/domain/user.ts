/**
 * Client-side demo persistence shape. Replace with API + DB when going live.
 * Payment webhook should upsert `purchasedReports` and run referral credit server-side.
 */

export type Gender = "male" | "female";

export type PurchasedReport = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  birth: string;
  gender: Gender;
  /** Internal only — do not render in collection UI */
  ilju: string;
  /** ISO 8601 */
  purchasedAt: string;
  /** Preserved for reopening full result view */
  birthtime?: string;
  /** Optional partner portrait; base64 data URL, stored client-side only */
  photoDataUrl?: string;
};

export type UserAccount = {
  email: string;
  nickname: string;
  referralCode: string;
  /** Uppercase referral code of the referrer, if any */
  referredBy: string | null;
  /** Accumulated discount balance (KRW) for next report — settlement with PG later */
  referralRewardBalance: number;
  /** Referred users who completed their first paid purchase */
  referralSuccessCount: number;
  purchasedReports: PurchasedReport[];
};

export const REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW = 5000;
