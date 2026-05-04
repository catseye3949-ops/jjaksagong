import { digestPassword } from "../auth/digestPassword";
import type {
  Gender,
  ProfileGender,
  PurchasedReport,
  UserAccount,
} from "../domain/user";
import {
  REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW,
} from "../domain/user";
import {
  normalizeDayPillarForPurchase,
  normalizeTargetBirthDateForPurchase,
} from "../purchaseBirthNormalize";
import { generateReferralCodeSegment } from "../referralCode";
import { supabase } from "../supabaseClient";
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

  const displayName =
    typeof u.name === "string" && u.name.trim()
      ? u.name.trim()
      : typeof u.nickname === "string" && u.nickname.trim()
        ? u.nickname.trim()
        : "사용자";
  const name = displayName;
  const nickname = displayName;
  if (typeof u.name !== "string" && typeof u.nickname === "string" && u.nickname) {
    changed = true;
  }

  const passwordDigest =
    typeof u.passwordDigest === "string" && u.passwordDigest
      ? u.passwordDigest
      : undefined;
  if (
    (passwordDigest ?? "") !==
    (typeof u.passwordDigest === "string" ? u.passwordDigest : "")
  ) {
    changed = true;
  }

  const birthDate =
    typeof u.birthDate === "string" && u.birthDate.trim()
      ? u.birthDate.trim()
      : undefined;
  if (birthDate !== u.birthDate) changed = true;

  const profileGenderRaw = u.profileGender;
  let profileGender: ProfileGender | undefined;
  if (
    profileGenderRaw === "male" ||
    profileGenderRaw === "female" ||
    profileGenderRaw === "none"
  ) {
    profileGender = profileGenderRaw;
  } else {
    profileGender = undefined;
  }
  if (profileGender !== profileGenderRaw) changed = true;

  const birthTime =
    typeof u.birthTime === "string" && u.birthTime.trim()
      ? u.birthTime.trim()
      : undefined;
  if (birthTime !== u.birthTime) changed = true;

  const mbti =
    typeof u.mbti === "string" && u.mbti.trim() ? u.mbti.trim() : undefined;
  if (mbti !== u.mbti) changed = true;

  const marketingConsent =
    typeof u.marketingConsent === "boolean" ? u.marketingConsent : undefined;
  if (marketingConsent !== u.marketingConsent) changed = true;

  const termsAgreed =
    typeof u.termsAgreed === "boolean" ? u.termsAgreed : undefined;
  if (termsAgreed !== u.termsAgreed) changed = true;

  const privacyAgreed =
    typeof u.privacyAgreed === "boolean" ? u.privacyAgreed : undefined;
  if (privacyAgreed !== u.privacyAgreed) changed = true;

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
    name,
    nickname,
    referralCode,
    referredBy,
    referralRewardBalance,
    referralSuccessCount,
    purchasedReports,
    ...(passwordDigest ? { passwordDigest } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(profileGender ? { profileGender } : {}),
    ...(birthTime ? { birthTime } : {}),
    ...(mbti ? { mbti } : {}),
    ...(marketingConsent !== undefined ? { marketingConsent } : {}),
    ...(termsAgreed !== undefined ? { termsAgreed } : {}),
    ...(privacyAgreed !== undefined ? { privacyAgreed } : {}),
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

export function updateUserDisplayName(
  email: string,
  nextDisplayName: string,
): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 변경할 수 있습니다." };
  }
  const trimmed = nextDisplayName.trim();
  if (!trimmed) {
    return { ok: false, error: "이름 또는 별명을 입력해 주세요." };
  }
  const key = email.trim().toLowerCase();
  const users = readUsers();
  const prev = users[key];
  if (!prev) {
    return { ok: false, error: "사용자를 찾을 수 없습니다." };
  }
  users[key] = { ...prev, name: trimmed, nickname: trimmed };
  writeUsers(users);
  notifyAuthChanged();
  return { ok: true };
}

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  gender: Extract<ProfileGender, "male" | "female">;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  birthTime?: string;
  birthTimeUnknown?: boolean;
  mbti?: string;
  marketingConsent?: boolean;
  referredBy?: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function signupUser(
  input: SignupInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 가입할 수 있습니다." };
  }
  if (!input.termsAgreed || !input.privacyAgreed) {
    return {
      ok: false,
      error: "이용약관 및 개인정보 처리방침에 동의해 주세요.",
    };
  }

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;
  const birthDate = input.birthDate.trim();

  if (!name) {
    return { ok: false, error: "이름 또는 별명을 입력해 주세요." };
  }
  if (!email) {
    return { ok: false, error: "이메일을 입력해 주세요." };
  }
  if (password.length < 6) {
    return { ok: false, error: "비밀번호는 6자 이상으로 설정해 주세요." };
  }
  if (!DATE_RE.test(birthDate)) {
    return { ok: false, error: "생년월일은 YYYY-MM-DD 형식으로 입력해 주세요." };
  }
  if (input.gender !== "male" && input.gender !== "female") {
    return { ok: false, error: "성별을 선택해 주세요." };
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

  const passwordDigest = await digestPassword(email, password);
  const birthTime =
    input.birthTimeUnknown || !input.birthTime?.trim()
      ? undefined
      : input.birthTime.trim();
  const mbti = input.mbti?.trim() || undefined;

  const account: UserAccount = {
    email,
    name,
    nickname: name,
    referralCode: uniqueReferralCode(users),
    referredBy,
    referralRewardBalance: 0,
    referralSuccessCount: 0,
    purchasedReports: [],
    passwordDigest,
    birthDate,
    profileGender: input.gender,
    ...(birthTime ? { birthTime } : {}),
    ...(mbti ? { mbti } : {}),
    marketingConsent: Boolean(input.marketingConsent),
    termsAgreed: true,
    privacyAgreed: true,
  };

  users[email] = account;
  writeUsers(users);

  if (supabase) {
    const { error } = await supabase.from("users").insert({
      email,
      name,
      birth_date: birthDate,
      gender: input.gender,
      password_digest: passwordDigest,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[signupUser] Supabase insert failed:", error);
      delete users[email];
      writeUsers(users);
      return {
        ok: false,
        error: "회원가입 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      };
    }
  }

  writeSessionEmail(email);
  notifyAuthChanged();
  return { ok: true };
}

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "브라우저에서만 로그인할 수 있습니다." };
  }
  const key = email.trim().toLowerCase();
  const users = readUsers();
  const acc = users[key];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email,name,birth_date,gender,password_digest")
        .eq("email", key)
        .maybeSingle();

      if (error) {
        console.error("[loginWithCredentials] Supabase query failed:", error);
      } else if (data && typeof (data as { email?: unknown }).email === "string") {
        const row = data as {
          email: string;
          name: string | null;
          birth_date: string | null;
          gender: string | null;
          password_digest: string | null;
        };

        const remoteDigest =
          typeof row.password_digest === "string"
            ? row.password_digest.trim()
            : "";

        if (remoteDigest) {
          const d = await digestPassword(key, password);
          if (d !== remoteDigest) {
            return { ok: false, error: "비밀번호가 일치하지 않습니다." };
          }

          if (!users[key]) {
            const profileGender: ProfileGender =
              row.gender === "female"
                ? "female"
                : row.gender === "male"
                  ? "male"
                  : "male";
            const displayName = row.name?.trim() || "사용자";
            users[key] = {
              email: key,
              name: displayName,
              nickname: displayName,
              referralCode: uniqueReferralCode(users),
              referredBy: null,
              referralRewardBalance: 0,
              referralSuccessCount: 0,
              purchasedReports: [],
              passwordDigest: d,
              ...(row.birth_date?.trim()
                ? { birthDate: row.birth_date.trim() }
                : {}),
              profileGender,
              termsAgreed: true,
              privacyAgreed: true,
            };
            writeUsers(users);
          } else {
            const prev = users[key];
            users[key] = { ...prev, passwordDigest: d };
            writeUsers(users);
          }

          writeSessionEmail(key);
          notifyAuthChanged();
          return { ok: true };
        }
        // password_digest 없음: Supabase 레거시 행 → 아래 localStorage 로직으로 진행
      }
    } catch (e) {
      console.error("[loginWithCredentials] Supabase exception:", e);
    }
  }

  if (!acc) {
    return { ok: false, error: "가입되지 않은 이메일입니다." };
  }

  if (acc.passwordDigest) {
    const d = await digestPassword(key, password);
    if (d !== acc.passwordDigest) {
      return { ok: false, error: "비밀번호가 일치하지 않습니다." };
    }
  } else if (password.trim() !== "") {
    return {
      ok: false,
      error: "비밀번호를 비우고 다시 시도해 주세요.",
    };
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
export async function completeMockPurchase(
  buyerEmail: string,
  payload: PurchasePayload,
): Promise<{ ok: true; report: PurchasedReport } | { ok: false; error: string }> {
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

  let referrerEmailForRollback: string | null = null;
  if (wasFirstPaidReport && buyer.referredBy) {
    const referrer = findUserByReferralCode(users, buyer.referredBy);
    if (referrer && referrer.email !== buyer.email) {
      referrer.referralSuccessCount += 1;
      referrer.referralRewardBalance += REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW;
      users[referrer.email] = referrer;
      referrerEmailForRollback = referrer.email;
    }
  }

  users[buyer.email] = buyer;
  writeUsers(users);

  if (supabase) {
    const birthNorm = normalizeTargetBirthDateForPurchase(payload.birth);
    const pillarNorm = normalizeDayPillarForPurchase(payload.ilju);
    if (!birthNorm || !pillarNorm) {
      console.error(
        "[completeMockPurchase] purchases insert skipped: normalize failed",
        { birthNorm, pillarNorm },
      );
      buyer.purchasedReports = buyer.purchasedReports.filter((r) => r.id !== report.id);
      if (referrerEmailForRollback) {
        const ref = users[referrerEmailForRollback];
        if (ref) {
          ref.referralSuccessCount = Math.max(0, ref.referralSuccessCount - 1);
          ref.referralRewardBalance = Math.max(
            0,
            ref.referralRewardBalance -
              REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW,
          );
          users[referrerEmailForRollback] = ref;
        }
      }
      users[buyer.email] = buyer;
      writeUsers(users);
      return {
        ok: false,
        error: "생년월일 또는 일주 정보를 저장할 수 없어요. 입력 형식을 확인해 주세요.",
      };
    }
    const insertPayload = {
      email: buyer.email.trim().toLowerCase(),
      target_birth_date: birthNorm,
      day_pillar: pillarNorm,
      created_at: new Date().toISOString(),
    };
    console.log("[completeMockPurchase] purchases insert payload", insertPayload, {
      rawBirth: payload.birth,
      rawIlju: payload.ilju,
    });
    const { error } = await supabase.from("purchases").insert(insertPayload);
    if (error) {
      console.error("[completeMockPurchase] Supabase purchases insert failed:", error);
      buyer.purchasedReports = buyer.purchasedReports.filter((r) => r.id !== report.id);
      if (referrerEmailForRollback) {
        const ref = users[referrerEmailForRollback];
        if (ref) {
          ref.referralSuccessCount = Math.max(0, ref.referralSuccessCount - 1);
          ref.referralRewardBalance = Math.max(
            0,
            ref.referralRewardBalance -
              REFERRAL_REWARD_ON_REFEREE_FIRST_PURCHASE_KRW,
          );
          users[referrerEmailForRollback] = ref;
        }
      }
      users[buyer.email] = buyer;
      writeUsers(users);
      return {
        ok: false,
        error: "결제 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      };
    }
  }

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
