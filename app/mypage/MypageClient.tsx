"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import PurchasedReportPhotoEditor from "../../components/PurchasedReportPhotoEditor";
import { formatBirthDisplay } from "../../lib/formatBirth";

export default function MypageClient() {
  const router = useRouter();
  const { user, isReady, logout } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/mypage")}`);
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <main className="relative min-h-screen bg-[#0b1020] px-4 py-24 text-center text-sm text-white/50">
        마이페이지를 불러오는 중…
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] px-4 py-16 pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[20%] h-[320px] w-[320px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">마이페이지</h1>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-fuchsia-300/40"
            >
              홈
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:border-fuchsia-300/40"
            >
              로그아웃
            </button>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <h2 className="text-lg font-semibold text-fuchsia-200">내 정보</h2>
          <p className="mt-1 text-xs text-white/45">
            브라우저에 저장되는 데모 계정입니다. 추후 DB·서버 세션으로 교체하면
            됩니다.
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-white/50">닉네임</dt>
              <dd className="text-base font-semibold text-white">
                {user.nickname}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-white/50">이메일</dt>
              <dd className="break-all text-base font-medium text-white/90">
                {user.email}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-white/50">내 추천 코드</dt>
              <dd className="font-mono text-base font-semibold tracking-wide text-pink-100">
                {user.referralCode}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-white/50">사용 가능 추천 보상</dt>
              <dd className="text-lg font-semibold text-pink-200">
                {user.referralRewardBalance.toLocaleString("ko-KR")}원
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-white/40">
            추천 성공 {user.referralSuccessCount}명 · 친구의 첫 유료 결제 시
            보상이 쌓입니다.
          </p>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-pink-200">
              결제한 리포트
            </h2>
            <Link
              href="/main"
              className="text-xs font-medium text-fuchsia-200/90 underline-offset-4 hover:underline"
            >
              새 분석하기
            </Link>
          </div>

          {user.purchasedReports.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">
              아직 저장된 리포트가 없어요. 결과 페이지에서 유료 리포트를
              결제하면 여기에 쌓입니다.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {user.purchasedReports.map((r) => {
                const q = new URLSearchParams();
                q.set("name", r.name);
                q.set("birthdate", r.birth);
                if (r.birthtime) q.set("birthtime", r.birthtime);
                q.set("gender", r.gender);
                q.set("isPaid", "true");
                q.set("reportId", r.id);
                const href = `/result?${q.toString()}`;
                const label = `${r.name} (${formatBirthDisplay(r.birth)})`;
                return (
                  <li
                    key={r.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                  >
                    <Link
                      href={href}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10"
                    >
                      <span>{label}</span>
                      <span className="shrink-0 text-xs text-fuchsia-200/80">
                        열기 →
                      </span>
                    </Link>
                    <div className="border-t border-white/10 px-4 pb-4 pt-3">
                      <PurchasedReportPhotoEditor
                        reportId={r.id}
                        gender={r.gender}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
