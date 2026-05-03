/**
 * Client-side demo persistence shape. Replace with API + DB when going live.
 * Payment webhook should upsert `purchasedReports` and run referral credit server-side.
 */

export type Gender = "male" | "female";

/** 회원 프로필 성별 (리포트 대상 Gender 와 별도) */
export type ProfileGender = "male" | "female" | "none";

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
  /** 이름 또는 별명 */
  name: string;
  /** 레거시·표시용 — `name` 과 동기화 유지 */
  nickname: string;
  referralCode: string;
  /** Uppercase referral code of the referrer, if any */
  referredBy: string | null;
  /** Accumulated discount balance (KRW) for next report — settlement with PG later */
  referralRewardBalance: number;
  /** Referred users who completed their first paid purchase */
  referralSuccessCount: number;
  purchasedReports: PurchasedReport[];
  /** SHA-256 hex; 없으면 이메일만 로그인 허용(구 데모 계정) */
  passwordDigest?: string;
  /** YYYY-MM-DD */
  birthDate?: string;
  profileGender?: ProfileGender;
  /** 출생 시간(HH:mm 등) — 모름이면 생략 */
  birthTime?: string;
  mbti?: string;
  marketingConsent?: boolean;
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
};

export const REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW = 5000;
