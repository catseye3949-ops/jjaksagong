"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AuthShell from "../../components/AuthShell";
import { useAuth } from "../../contexts/AuthContext";
import { DEMO_REPORT_PRICE_WON } from "../../lib/billing";
import { calculateIlju } from "../../lib/calculateIlju";
import type { Gender } from "../../lib/domain/user";
import { STORAGE_PENDING_PARTNER_PHOTO_KEY } from "../../lib/storage/keys";
import { refreshServerSessionUsers } from "../../lib/client/serverSessionSync";
import { completeMockPurchase } from "../../lib/storage/userStore";

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isReady } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const name = searchParams.get("name")?.trim() || "";
  const birthdate = searchParams.get("birthdate") || "";
  const birthtime = searchParams.get("birthtime") || "";
  const genderParam = searchParams.get("gender");
  const gender: Gender = genderParam === "female" ? "female" : "male";

  const nextLogin = useMemo(
    () => `/login?next=${encodeURIComponent(`/checkout?${searchParams.toString()}`)}`,
    [searchParams],
  );

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(nextLogin);
    }
  }, [isReady, user, router, nextLogin]);

  const ilju = useMemo(
    () => calculateIlju(birthdate, birthtime) || "",
    [birthdate, birthtime],
  );

  const canPurchase = Boolean(birthdate && ilju && user);

  const onConfirm = async () => {
    if (!user) return;
    setError(null);
    if (!birthdate || !ilju) {
      setError("생년월일 정보가 올바르지 않습니다. 다시 입력해 주세요.");
      return;
    }
    let pendingPhoto: string | undefined;
    try {
      const raw = sessionStorage.getItem(STORAGE_PENDING_PARTNER_PHOTO_KEY);
      pendingPhoto =
        raw && raw.startsWith("data:image/") ? raw : undefined;
    } catch {
      pendingPhoto = undefined;
    }

    const result = await completeMockPurchase(user.email, {
      name: name || "이 사람",
      birth: birthdate,
      birthtime,
      gender,
      ilju,
      ...(pendingPhoto ? { photoDataUrl: pendingPhoto } : {}),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      await refreshServerSessionUsers();
    } catch {
      /* 세션 쿠키 갱신 실패해도 결제·리다이렉트는 진행 */
    }
    try {
      sessionStorage.removeItem(STORAGE_PENDING_PARTNER_PHOTO_KEY);
    } catch {
      /* ignore */
    }
    const q = new URLSearchParams();
    if (name) q.set("name", name);
    q.set("birthdate", birthdate);
    if (birthtime) q.set("birthtime", birthtime);
    q.set("gender", gender);
    q.set("reportId", result.report.id);
    router.push(`/result?${q.toString()}`);
  };

  if (!isReady || !user) {
    return (
      <AuthShell title="결제" subtitle="로그인 확인 중…">
        <p className="text-sm text-white/55">잠시만 기다려주세요.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="유료 리포트 (데모 결제)"
      subtitle="실제 PG 연동 전까지는 아래 버튼으로 결제 완료를 시뮬레이션합니다. 완료 후 리포트가 컬렉션에 저장됩니다."
    >
      <Link
        href="/mypage"
        className="text-sm text-fuchsia-200/90 underline-offset-4 hover:underline"
      >
        ← 마이페이지
      </Link>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/50">리포트 금액 (데모)</span>
          <span className="text-lg font-semibold text-white">
            {DEMO_REPORT_PRICE_WON.toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div>
          <p className="text-xs text-white/45">상대 정보</p>
          <p className="mt-1 font-medium text-white/90">
            {name || "이름 미입력"} · {birthdate || "—"}
          </p>
          <p className="mt-1 text-xs text-white/45">
            성별: {gender === "female" ? "여성" : "남성"}
            {birthtime ? ` · 출생시간: ${birthtime}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-3 text-xs leading-5 text-fuchsia-100/90">
          사용 가능 추천 보상:{" "}
          <span className="font-semibold text-white">
            {user.referralRewardBalance.toLocaleString("ko-KR")}원
          </span>
          <br />
          PG 연동 시 할인 차감 로직을 여기에 연결하면 됩니다.
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose-200/90" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canPurchase}
        onClick={onConfirm}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition enabled:hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
      >
        결제 완료 (데모)
      </button>

      <p className="mt-4 text-center text-xs text-white/45">
        <Link href={`/result?${searchParams.toString()}`} className="underline-offset-4 hover:underline">
          결과 페이지로 돌아가기
        </Link>
      </p>
    </AuthShell>
  );
}
