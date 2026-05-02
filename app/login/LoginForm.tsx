"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import AuthShell from "../../components/AuthShell";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/mypage";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = login(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(next.startsWith("/") ? next : "/mypage");
  };

  return (
    <AuthShell
      title="로그인"
      subtitle="데모 환경에서는 가입한 이메일만으로 로그인됩니다. 실제 서비스에서는 비밀번호·소셜 로그인 등을 붙이면 됩니다."
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
            이메일
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

        {error ? (
          <p className="text-sm text-rose-200/90" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition hover:scale-[1.01]"
        >
          로그인
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/55">
        아직 계정이 없나요?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-medium text-fuchsia-200 hover:underline"
        >
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
