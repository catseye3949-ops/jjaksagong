"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AuthShell from "../../components/AuthShell";
import { useAuth } from "../../contexts/AuthContext";
import { STORAGE_SIGNUP_FORM_KEY } from "../../lib/storage/keys";
const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

type SignupFormDraft = {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  gender: "" | "male" | "female";
  birthTime: string;
  mbti: string;
  marketingConsent: boolean;
  termsAgreed: boolean;
  privacyAgreed: boolean;
};

function parseGender(v: unknown): "" | "male" | "female" {
  if (v === "male" || v === "female") return v;
  return "";
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [mbti, setMbti] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [referredBy, setReferredBy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_SIGNUP_FORM_KEY);
      if (!raw) {
        setFormHydrated(true);
        return;
      }
      const d = JSON.parse(raw) as Partial<SignupFormDraft>;
      if (typeof d.name === "string") setName(d.name);
      if (typeof d.email === "string") setEmail(d.email);
      if (typeof d.password === "string") setPassword(d.password);
      if (typeof d.birthDate === "string") setBirthDate(d.birthDate);
      setGender(parseGender(d.gender));
      if (typeof d.birthTime === "string") setBirthTime(d.birthTime);
      if (typeof d.mbti === "string") setMbti(d.mbti);
      if (typeof d.marketingConsent === "boolean")
        setMarketingConsent(d.marketingConsent);
      if (typeof d.termsAgreed === "boolean") setTermsAgreed(d.termsAgreed);
      if (typeof d.privacyAgreed === "boolean") setPrivacyAgreed(d.privacyAgreed);
    } catch {
      /* ignore corrupt draft */
    }
    setFormHydrated(true);
  }, []);

  useEffect(() => {
    if (!formHydrated || typeof window === "undefined") return;
    const draft: SignupFormDraft = {
      name,
      email,
      password,
      birthDate,
      gender,
      birthTime,
      mbti,
      marketingConsent,
      termsAgreed,
      privacyAgreed,
    };
    try {
      localStorage.setItem(STORAGE_SIGNUP_FORM_KEY, JSON.stringify(draft));
    } catch {
      /* ignore quota */
    }
  }, [
    formHydrated,
    name,
    email,
    password,
    birthDate,
    gender,
    birthTime,
    mbti,
    marketingConsent,
    termsAgreed,
    privacyAgreed,
  ]);

  const next = searchParams.get("next") || "/mypage";
  const safeNext = next.startsWith("/") ? next : "/mypage";

  const consentOk = termsAgreed && privacyAgreed;
  const requiredFilled = Boolean(
    name.trim() &&
      email.trim() &&
      password.length >= 6 &&
      birthDate &&
      gender,
  );
  const canSubmit = consentOk && requiredFilled && !busy;

  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(safeNext)}`,
    [safeNext],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!termsAgreed || !privacyAgreed) {
      setError("이용약관 및 개인정보 처리방침에 동의해 주세요.");
      return;
    }
    if (!gender) {
      setError("성별을 선택해 주세요.");
      return;
    }
    setBusy(true);
    const result = await signup({
      name: name.trim(),
      email: email.trim(),
      password,
      birthDate,
      gender,
      termsAgreed,
      privacyAgreed,
      birthTime: birthTimeUnknown ? undefined : birthTime.trim() || undefined,
      birthTimeUnknown,
      mbti: mbti || undefined,
      marketingConsent,
      referredBy: referredBy.trim() || null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      localStorage.removeItem(STORAGE_SIGNUP_FORM_KEY);
    } catch {
      /* ignore */
    }
    router.push(safeNext);
  };

  return (
    <AuthShell
      title="회원가입"
      subtitle="필수 정보를 입력하면 바로 로그인된 채로 이어집니다."
    >
      <Link
        href="/"
        className="text-sm text-fuchsia-200/90 underline-offset-4 hover:underline"
      >
        ← 짝사공 홈
      </Link>

      <form className="mt-6 max-h-[min(70vh,720px)] space-y-4 overflow-y-auto pr-1" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-white/75">
            이름 또는 별명 <span className="text-pink-300">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-400/50"
            placeholder="프로필에 쓸 이름"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-white/75">
            이메일 <span className="text-pink-300">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-400/50"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-white/75">
            비밀번호 <span className="text-pink-300">*</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-400/50"
            placeholder="6자 이상"
          />
        </div>

        <div>
          <label htmlFor="birthDate" className="mb-2 block text-sm text-white/75">
            생년월일 <span className="text-pink-300">*</span>
          </label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/50"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-white/75">
            성별 <span className="text-pink-300">*</span>
          </legend>
          <div className="flex flex-wrap gap-4 text-sm text-white/90">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === "male"}
                onChange={() => setGender("male")}
                className="accent-fuchsia-500"
              />
              남성
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={() => setGender("female")}
                className="accent-fuchsia-500"
              />
              여성
            </label>
          </div>
        </fieldset>

        <div>
          <label htmlFor="birthTime" className="mb-2 block text-sm text-white/75">
            출생 시간 <span className="text-white/40">(선택)</span>
          </label>
          <input
            id="birthTime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={birthTimeUnknown}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/50 disabled:cursor-not-allowed disabled:opacity-40"
          />
          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={birthTimeUnknown}
              onChange={(e) => {
                setBirthTimeUnknown(e.target.checked);
                if (e.target.checked) setBirthTime("");
              }}
              className="rounded border-white/25 bg-white/10 accent-fuchsia-500"
            />
            출생 시간을 모름
          </label>
        </div>

        <div>
          <label htmlFor="mbti" className="mb-2 block text-sm text-white/75">
            MBTI <span className="text-white/40">(선택)</span>
          </label>
          <select
            id="mbti"
            value={mbti}
            onChange={(e) => setMbti(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-black outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-400/40"
          >
            <option value="" className="bg-white text-black">
              선택 안 함
            </option>
            {MBTI_TYPES.map((t) => (
              <option key={t} value={t} className="bg-white text-black">
                {t}
              </option>
            ))}
          </select>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/80">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 rounded border-white/25 bg-white/10 accent-fuchsia-500"
          />
          <span>마케팅 정보 수신에 동의합니다. (선택)</span>
        </label>

        <div>
          <label htmlFor="referral" className="mb-2 block text-sm text-white/75">
            추천인 코드 <span className="text-white/40">(선택)</span>
          </label>
          <input
            id="referral"
            type="text"
            value={referredBy}
            onChange={(e) => setReferredBy(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-400/50"
            placeholder="친구가 공유한 코드"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/85">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-1 rounded border-white/25 bg-white/10 accent-fuchsia-500"
            />
            <span>
              <Link
                href="/legal/terms"
                className="font-medium text-fuchsia-200 underline-offset-4 hover:underline"
              >
                이용약관
              </Link>
              을 확인하였으며 동의합니다.{" "}
              <span className="text-pink-300">*</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/85">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="mt-1 rounded border-white/25 bg-white/10 accent-fuchsia-500"
            />
            <span>
              <Link
                href="/legal/privacy"
                className="font-medium text-fuchsia-200 underline-offset-4 hover:underline"
              >
                개인정보 처리방침
              </Link>
              을 확인하였으며 동의합니다.{" "}
              <span className="text-pink-300">*</span>
            </span>
          </label>
          {!consentOk ? (
            <p className="text-xs text-amber-200/90">
              이용약관과 개인정보 처리방침에 모두 동의해야 가입할 수 있어요.
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-rose-200/90" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
        >
          {busy ? "처리 중…" : "가입하고 계속하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/55">
        이미 계정이 있나요?{" "}
        <Link href={loginHref} className="font-medium text-fuchsia-200 hover:underline">
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
