"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import PurchasedReportsList from "../../components/PurchasedReportsList";

export default function ReportsClient() {
  const { user, isReady } = useAuth();

  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent("/reports")}`,
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] px-4 py-16 pt-20 text-white md:pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[20%] h-[320px] w-[320px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            내 공략 컬렉션
          </h1>
          <Link
            href="/"
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-fuchsia-300/40"
          >
            홈
          </Link>
        </div>

        {!isReady ? (
          <p className="text-center text-sm text-white/50">불러오는 중…</p>
        ) : !user ? (
          <section className="rounded-[28px] border border-white/10 bg-white/8 p-8 text-center backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <p className="text-base font-medium text-white/90">
              로그인이 필요합니다
            </p>
            <Link
              href={loginHref}
              className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition hover:scale-[1.02]"
            >
              로그인
            </Link>
          </section>
        ) : (
          <section className="rounded-[28px] border border-fuchsia-400/20 bg-gradient-to-br from-white/[0.07] via-fuchsia-500/5 to-violet-500/10 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(90,24,154,0.25)] md:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <h2 className="text-lg font-semibold text-pink-200">
                내 공략 리포트
              </h2>
              <Link
                href="/main"
                className="text-xs font-medium text-fuchsia-200/90 underline-offset-4 hover:underline"
              >
                새 분석하기
              </Link>
            </div>

            <PurchasedReportsList
              reports={user.purchasedReports}
              variant="collection"
              emptyContent={
                <div className="mt-8 space-y-6 text-center">
                  <p className="text-sm font-medium text-white/80">
                    아직 내 공략 리스트가 없습니다.
                  </p>
                  <Link
                    href="/main"
                    className="inline-flex rounded-2xl border border-fuchsia-400/35 bg-gradient-to-r from-pink-500/25 via-fuchsia-500/30 to-violet-500/25 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(217,70,239,0.25)] transition hover:border-fuchsia-300/55"
                  >
                    새 분석하기
                  </Link>
                </div>
              }
            />
          </section>
        )}
      </div>
    </main>
  );
}
