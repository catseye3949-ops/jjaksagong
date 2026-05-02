import type { Gender, PurchasedReport, UserAccount } from "../domain/user";
import {
  REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW,
} from "../domain/user";
import { generateReferralCodeSegment } from "../referralCode";
import { STORAGE_SESSION_KEY, STORAGE_USERS_KEY } from "./keys";

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("jjak-auth-changed"));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function allocateReferralCode(taken: Set<string>) {
  for (let i = 0; i < 48; i += 1) {
    const code = generateReferralCodeSegment(6);
    const upper = code.toUpperCase();
    if (!taken.has(upper)) {
      taken.add(upper);
      return code;
    }
  }
  const fallback = `${generateReferralCodeSegment(4)}${Date.now()
    .toString(36)
    .slice(-4)}`.toUpperCase();
  taken.add(fallback);
  return fallback;
}

function normalizePurchasedReport(entry: unknown): PurchasedReport | null {
  if (!entry || typeof entry !== "object") return null;
  const r = entry as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : crypto.randomUUID();
  const name = typeof r.name === "string" ? r.name : "이 사람";
  const birth =
    typeof r.birth === "string"
      ? r.birth
      : typeof r.birthdate === "string"
        ? r.birthdate
        : "";
  const gender = r.gender === "female" ? "female" : "male";
  const ilju = typeof r.ilju === "string" ? r.ilju : "";
  const purchasedAt =
    typeof r.purchasedAt === "string"
      ? r.purchasedAt
      : new Date().toISOString();
  const birthtime =
    typeof r.birthtime === "string" && r.birthtime ? r.birthtime : undefined;
  const photoDataUrl =
    typeof r.photoDataUrl === "string" && r.photoDataUrl.startsWith("data:image/")
      ? r.photoDataUrl
      : undefined;
  if (!birth) return null;
  return {
    id,
    name,
    birth,
    gender,
    ilju,
    purchasedAt,
    birthtime,
    photoDataUrl,
  };
}

function normalizeUserAccount(
  raw: unknown,
  takenReferralCodes: Set<string>,
): { account: UserAccount; changed: boolean } | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const email = typeof u.email === "string" ? u.email.trim().toLowerCase() : "";
  if (!email) return null;

  let changed = false;

  const nickname = typeof u.nickname === "string" ? u.nickname : "사용자";
  if (nickname !== u.nickname) changed = true;

  let referralCode =
    typeof u.referralCode === "string" ? u.referralCode.trim() : "";
  if (referralCode) {
    const upper = referralCode.toUpperCase();
    if (!takenReferralCodes.has(upper)) {
      takenReferralCodes.add(upper);
    }
  } else {
    referralCode = allocateReferralCode(takenReferralCodes);
    changed = true;
  }

  const referredBy =
    typeof u.referredBy === "string" && u.referredBy.trim()
      ? u.referredBy.trim().toUpperCase()
      : null;
  if (referredBy !== (u.referredBy ?? null)) changed = true;

  const referralRewardBalance =
    typeof u.referralRewardBalance === "number" &&
    Number.isFinite(u.referralRewardBalance)
      ? u.referralRewardBalance
      : 0;
  if (referralRewardBalance !== u.referralRewardBalance) changed = true;

  const referralSuccessCount =
    typeof u.referralSuccessCount === "number" &&
    Number.isFinite(u.referralSuccessCount)
      ? u.referralSuccessCount
      : 0;
  if (referralSuccessCount !== u.referralSuccessCount) changed = true;

  const reportsRaw = Array.isArray(u.purchasedReports)
    ? u.purchasedReports
    : [];
  if (!Array.isArray(u.purchasedReports)) changed = true;

  const purchasedReports = reportsRaw
    .map(normalizePurchasedReport)
    .filter((x): x is PurchasedReport => Boolean(x));
  if (purchasedReports.length !== reportsRaw.length) changed = true;

  const account: UserAccount = {
    email,
    nickname,
    referralCode,
    referredBy,
    referralRewardBalance,
    referralSuccessCount,
    purchasedReports,
  };

  return { account, changed };
}

export function readUsers(): Record<string, UserAccount> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<Record<string, unknown>>(
    localStorage.getItem(STORAGE_USERS_KEY),
    {},
  );

  const takenReferralCodes = new Set<string>();
  for (const value of Object.values(parsed)) {
    if (!value || typeof value !== "object") continue;
    const code = (value as Record<string, unknown>).referralCode;
    if (typeof code === "string" && code.trim()) {
      takenReferralCodes.add(code.trim().toUpperCase());
    }
  }

  const normalized: Record<string, UserAccount> = {};
  let needsPersist = false;

  for (const [, value] of Object.entries(parsed)) {
    const result = normalizeUserAccount(value, takenReferralCodes);
    if (!result) continue;
    normalized[result.account.email] = result.account;
    if (result.changed) needsPersist = true;
  }

  if (needsPersist && Object.keys(normalized).length > 0) {
    writeUsers(normalized);
    notifyAuthChanged();
  }

  return normalized;
}

export function writeUsers(users: Record<string, UserAccount>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

export function readSessionEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_SESSION_KEY);
}

export function writeSessionEmail(email: string | null) {
  if (typeof window === "undefined") return;
  if (email) localStorage.setItem(STORAGE_SESSION_KEY, email);
  else localStorage.removeItem(STORAGE_SESSION_KEY);
}

function uniqueReferralCode(users: Record<string, UserAccount>) {
  const existing = new Set(
    Object.values(users).map((u) => u.referralCode.toUpperCase()),
  );
  for (let i = 0; i < 40; i += 1) {
    const code = generateReferralCodeSegment(6);
    if (!existing.has(code)) return code;
  }
  return `${generateReferralCodeSegment(4)}${Date.now().toString(36).slice(-4)}`.toUpperCase();
}

export function normalizeReferralInput(code: string | null | undefined) {
  const t = (code ?? "").trim().toUpperCase();
  return t.length ? t : null;
}

export function findUserByReferralCode(
  users: Record<string, UserAccount>,
  code: string,
) {
  const upper = code.toUpperCase();
  return Object.values(users).find(
    (u) => u.referralCode.toUpperCase() === upper,
  );
}

export type SignupInput = {
  email: string;
  nickname: string;
  referredBy?: string | null;
};

export function signupUser(input: SignupInput): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 가입할 수 있습니다." };
  }
  const email = input.email.trim().toLowerCase();
  const nickname = input.nickname.trim();
  if (!email || !nickname) {
    return { ok: false, error: "이메일과 닉네임을 입력해주세요." };
  }
  const users = readUsers();
  if (users[email]) {
    return { ok: false, error: "이미 가입된 이메일입니다." };
  }

  let referredBy = normalizeReferralInput(input.referredBy);
  if (referredBy) {
    const referrer = findUserByReferralCode(users, referredBy);
    if (!referrer) {
      return { ok: false, error: "유효하지 않은 추천 코드입니다." };
    }
    if (referrer.email === email) {
      return { ok: false, error: "본인 추천 코드는 사용할 수 없습니다." };
    }
  } else {
    referredBy = null;
  }

  const account: UserAccount = {
    email,
    nickname,
    referralCode: uniqueReferralCode(users),
    referredBy,
    referralRewardBalance: 0,
    referralSuccessCount: 0,
    purchasedReports: [],
  };

  users[email] = account;
  writeUsers(users);
  writeSessionEmail(email);
  notifyAuthChanged();
  return { ok: true };
}

export function loginWithEmail(email: string): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 로그인할 수 있습니다." };
  }
  const key = email.trim().toLowerCase();
  const users = readUsers();
  if (!users[key]) {
    return { ok: false, error: "가입되지 않은 이메일입니다." };
  }
  writeSessionEmail(key);
  notifyAuthChanged();
  return { ok: true };
}

export function logout() {
  writeSessionEmail(null);
  notifyAuthChanged();
}

export type PurchasePayload = {
  name: string;
  birth: string;
  birthtime?: string;
  gender: Gender;
  ilju: string;
  photoDataUrl?: string;
};

/**
 * Simulates a successful paid checkout. Later: call from payment-confirm API route
 * after verifying PG signature, using the same payload + user id from session.
 */
export function completeMockPurchase(
  buyerEmail: string,
  payload: PurchasePayload,
): { ok: true; report: PurchasedReport } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 처리할 수 있습니다." };
  }
  const users = readUsers();
  const buyer = users[buyerEmail.trim().toLowerCase()];
  if (!buyer) {
    return { ok: false, error: "로그인이 필요합니다." };
  }

  const wasFirstPaidReport = buyer.purchasedReports.length === 0;

  const report: PurchasedReport = {
    id: crypto.randomUUID(),
    name: payload.name.trim() || "이 사람",
    birth: payload.birth,
    gender: payload.gender,
    ilju: payload.ilju,
    purchasedAt: new Date().toISOString(),
    birthtime: payload.birthtime || "",
    ...(payload.photoDataUrl &&
    typeof payload.photoDataUrl === "string" &&
    payload.photoDataUrl.startsWith("data:image/")
      ? { photoDataUrl: payload.photoDataUrl }
      : {}),
  };

  buyer.purchasedReports = [...buyer.purchasedReports, report];

  if (wasFirstPaidReport && buyer.referredBy) {
    const referrer = findUserByReferralCode(users, buyer.referredBy);
    if (referrer && referrer.email !== buyer.email) {
      referrer.referralSuccessCount += 1;
      referrer.referralRewardBalance += REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW;
      users[referrer.email] = referrer;
    }
  }

  users[buyer.email] = buyer;
  writeUsers(users);
  notifyAuthChanged();
  return { ok: true, report };
}

export function updatePurchasedReportPhoto(
  buyerEmail: string,
  reportId: string,
  photoDataUrl: string | null,
): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 처리할 수 있습니다." };
  }
  const users = readUsers();
  const buyer = users[buyerEmail.trim().toLowerCase()];
  if (!buyer) {
    return { ok: false, error: "로그인이 필요합니다." };
  }
  const idx = buyer.purchasedReports.findIndex((r) => r.id === reportId);
  if (idx === -1) {
    return { ok: false, error: "리포트를 찾을 수 없습니다." };
  }
  const prev = buyer.purchasedReports[idx];
  if (!photoDataUrl) {
    const { photoDataUrl: _drop, ...rest } = prev;
    buyer.purchasedReports = buyer.purchasedReports.map((r, i) =>
      i === idx ? (rest as PurchasedReport) : r,
    );
  } else if (
    typeof photoDataUrl === "string" &&
    photoDataUrl.startsWith("data:image/")
  ) {
    buyer.purchasedReports = buyer.purchasedReports.map((r, i) =>
      i === idx ? { ...prev, photoDataUrl } : r,
    );
  } else {
    return { ok: false, error: "유효하지 않은 이미지 데이터입니다." };
  }
  users[buyer.email] = buyer;
  writeUsers(users);
  notifyAuthChanged();
  return { ok: true };
}
