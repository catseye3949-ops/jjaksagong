"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";

const pill =
  "rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-fuchsia-300/40 hover:bg-white/14";

export default function AuthLandingBar() {
  const { user, isReady, logout } = useAuth();

  return (
    <header className="pointer-events-auto fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b1020]/65 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          <img
            src="/images/logo/logo%201.png"
            alt="짝사공 로고"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </Link>
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {!isReady ? (
            <span className="text-xs text-white/40">불러오는 중…</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-white/60 sm:inline">
                <span className="text-pink-200/90">{user.name || user.nickname}</span> 님
              </span>
              <Link href="/mypage" className={pill}>
                마이페이지
              </Link>
              <button type="button" className={pill} onClick={() => logout()}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={pill}>
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border border-fuchsia-400/35 bg-gradient-to-r from-pink-500/25 via-fuchsia-500/25 to-violet-500/25 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(217,70,239,0.25)] backdrop-blur-md transition hover:border-fuchsia-300/55"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
