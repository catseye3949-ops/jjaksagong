/**
 * Admin dashboard (client). Stats source is swappable: today `mapUserRecordToPurchaseReportRows(readUsers())`,
 * later a server API returning the same `ServiceStatsPurchaseRow[]` shape.
 *
 * 운영: 반드시 서버 세션(역할) + Supabase/DB에서 집계·접근 통제. 클라이언트 비밀번호·localStorage는 데모 전용.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserAccount } from "@/lib/domain/user";
import { aggregateServiceStats } from "@/lib/admin/aggregateServiceStats";
import { getExpectedAdminPassword } from "@/lib/admin/getExpectedAdminPassword";
import {
  isAdminSession,
  setAdminSession,
} from "@/lib/admin/adminSession";
import { mapUserRecordToPurchaseReportRows } from "@/lib/admin/sources/localStoragePurchaseRows";
import { DEMO_REPORT_PRICE_WON } from "@/lib/billing";
import { STORAGE_USERS_KEY } from "@/lib/storage/keys";
import { readUsers } from "@/lib/storage/userStore";
import type { AdminServiceStats } from "@/lib/admin/aggregateServiceStats";

export default function AdminPage() {
  const [gateChecked, setGateChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminServiceStats | null>(null);
  const [usersSnapshot, setUsersSnapshot] = useState<
    Record<string, UserAccount>
  >({});

  const refreshStats = useCallback(() => {
    const users = readUsers();
    setUsersSnapshot(users);
    const rows = mapUserRecordToPurchaseReportRows(users);
    setStats(
      aggregateServiceStats(rows, {
        pricePerReportWon: DEMO_REPORT_PRICE_WON,
      }),
    );
  }, []);

  useEffect(() => {
    setAuthed(isAdminSession());
    setGateChecked(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    refreshStats();
  }, [authed, refreshStats]);

  useEffect(() => {
    if (!authed) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_USERS_KEY || e.key === null) refreshStats();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("jjak-auth-changed", refreshStats);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jjak-auth-changed", refreshStats);
    };
  }, [authed, refreshStats]);

  const userCount = useMemo(
    () => Object.keys(usersSnapshot).length,
    [usersSnapshot],
  );

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const expected = getExpectedAdminPassword();
    if (!expected) {
      setLoginError("NEXT_PUBLIC_ADMIN_PASSWORD 가 설정되어 있지 않습니다.");
      return;
    }
    if (passwordInput !== expected) {
      setLoginError("비밀번호가 올바르지 않습니다.");
      return;
    }
    setAdminSession(true);
    setAuthed(true);
    setPasswordInput("");
  };

  const onLogout = () => {
    setAdminSession(false);
    setAuthed(false);
    setStats(null);
  };

  if (!gateChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p className="text-sm text-slate-500">로딩 중…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="text-lg font-semibold tracking-tight">관리자 로그인</h1>
          <p className="mt-2 text-xs text-white/50">
            데모 저장소(localStorage) 기준 통계입니다.
          </p>
          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-pw"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                비밀번호
              </label>
              <input
                id="admin-pw"
                type="password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none ring-violet-500/40 focus:ring-2"
              />
            </div>
            {loginError ? (
              <p className="text-sm text-rose-300" role="alert">
                {loginError}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              들어가기
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">짝사공 관리자</h1>
            <p className="mt-0.5 text-[11px] text-amber-200/80">
              현재 localStorage 데모 데이터 기준
            </p>
            <p className="mt-1 text-xs text-white/45">
              등록 사용자 {userCount}명 · 리포트 단가{" "}
              {DEMO_REPORT_PRICE_WON.toLocaleString("ko-KR")}원 (데모)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshStats}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-950/40"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        {!stats ? (
          <p className="text-sm text-white/50">통계를 불러오는 중…</p>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="총 결제 수"
                value={stats.totalPaymentCount.toLocaleString("ko-KR")}
              />
              <KpiCard
                label="총 결제 금액"
                value={`${stats.totalRevenueWon.toLocaleString("ko-KR")}원`}
              />
              <KpiCard
                label="오늘 결제 수"
                value={stats.todayPaymentCount.toLocaleString("ko-KR")}
              />
              <KpiCard
                label="저장된 공략 리포트"
                value={stats.savedReportCount.toLocaleString("ko-KR")}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-violet-200">
                  일주 TOP 5 (저장 건수)
                </h2>
                <ol className="mt-4 space-y-2">
                  {stats.topIlju.length === 0 ? (
                    <li className="text-sm text-white/45">데이터 없음</li>
                  ) : (
                    stats.topIlju.map((row, i) => (
                      <li
                        key={row.ilju}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                      >
                        <span className="text-white/55">{i + 1}</span>
                        <span className="font-medium text-white">{row.ilju}</span>
                        <span className="tabular-nums text-violet-200">
                          {row.count}건
                        </span>
                      </li>
                    ))
                  )}
                </ol>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h2 className="text-sm font-semibold text-violet-200">
                  성별 분포 (저장 리포트 상대 기준)
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {stats.dominantGenderCombinationLabel}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-4">
                    <p className="text-xs text-white/50">남성 상대</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-sky-100">
                      {stats.genderBreakdown.male}
                    </p>
                  </div>
                  <div className="rounded-xl border border-pink-500/20 bg-pink-500/10 px-3 py-4">
                    <p className="text-xs text-white/50">여성 상대</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-pink-100">
                      {stats.genderBreakdown.female}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold text-violet-200">
                최근 구매·저장 내역
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-white/45">
                      <th className="pb-2 pr-4 font-medium">일시</th>
                      <th className="pb-2 pr-4 font-medium">구매자</th>
                      <th className="pb-2 pr-4 font-medium">상대 이름</th>
                      <th className="pb-2 pr-4 font-medium">일주</th>
                      <th className="pb-2 pr-4 font-medium">상대 성별</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPurchases.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-white/45"
                        >
                          저장된 리포트가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      stats.recentPurchases.map((row) => (
                        <tr
                          key={`${row.buyerEmail}-${row.reportId}`}
                          className="border-b border-white/5 text-white/85"
                        >
                          <td className="py-2 pr-4 align-top tabular-nums text-xs text-white/65">
                            {new Date(row.purchasedAt).toLocaleString("ko-KR")}
                          </td>
                          <td className="py-2 pr-4 align-top">
                            <span className="break-all">{row.buyerEmail}</span>
                            <span className="mt-0.5 block text-xs text-white/45">
                              {row.buyerNickname}
                            </span>
                          </td>
                          <td className="py-2 pr-4 align-top">{row.partnerName}</td>
                          <td className="py-2 pr-4 align-top font-medium text-violet-200">
                            {row.ilju}
                          </td>
                          <td className="py-2 pr-4 align-top">
                            {row.gender === "female" ? "여성" : "남성"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-sm font-semibold text-violet-200">
                일주별 저장·구매 건수
              </h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-white/45">
                      <th className="pb-2 pr-4 font-medium">일주</th>
                      <th className="pb-2 font-medium">건수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.iljuCountsSorted.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-white/45">
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      stats.iljuCountsSorted.map((row) => (
                        <tr
                          key={row.ilju}
                          className="border-b border-white/5 text-white/85"
                        >
                          <td className="py-2 pr-4 font-medium text-white">
                            {row.ilju}
                          </td>
                          <td className="py-2 tabular-nums text-violet-200">
                            {row.count}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="pb-8 text-center text-xs text-white/35">
              일반 메뉴에 링크되지 않습니다. 프로덕션에서는 비밀번호·경로를 서버에서
              검증하세요.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 to-slate-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
