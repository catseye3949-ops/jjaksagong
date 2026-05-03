"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import AuthShell from "../../components/AuthShell";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = searchParams.get("next") || "/mypage";
  const safeNext = next.startsWith("/") ? next : "/mypage";

  const signupHref = useMemo(
    () => `/signup?next=${encodeURIComponent(safeNext)}`,
    [safeNext],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await login(email.trim(), password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(safeNext);
  };

  return (
    <AuthShell
      title="로그인"
      subtitle="이메일과 비밀번호로 로그인합니다."
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

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-white/75">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-400/50"
            placeholder="가입 시 설정한 비밀번호"
          />
        </div>

        {error ? (
          <p className="text-sm text-rose-200/90" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
        >
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/55">
        아직 계정이 없나요?{" "}
        <Link href={signupHref} className="font-medium text-fuchsia-200 hover:underline">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}
