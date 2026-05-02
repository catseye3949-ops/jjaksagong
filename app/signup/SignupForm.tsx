"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthShell from "../../components/AuthShell";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/mypage";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = signup({
      email,
      nickname,
      referredBy: referredBy.trim() || null,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(next.startsWith("/") ? next : "/mypage");
  };

  return (
    <AuthShell
      title="회원가입"
      subtitle="이메일과 닉네임만으로 시작합니다. 추천 코드는 있을 때만 입력해 주세요."
    >
      <Link
        href="/"
        className="text-sm text-fuchsia-200/90 underline-offset-4 hover:underline"
      >
        ← 짝사공 홈
      </Link>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
          <label htmlFor="nickname" className="mb-2 block text-sm text-white/75">
            닉네임 <span className="text-pink-300">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            autoComplete="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-400/50"
            placeholder="짝사공에서 쓸 이름"
          />
        </div>

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
          <p className="mt-1.5 text-xs leading-5 text-white/45">
            추천 보상은 추천받은 분이 첫 유료 결제를 완료했을 때 추천인에게 쌓입니다.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-rose-200/90" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition hover:scale-[1.01]"
        >
          가입하고 계속하기
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/55">
        이미 계정이 있나요?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-fuchsia-200 hover:underline"
        >
          로그인
        </Link>
      </p>
    </AuthShell>
  );
}
