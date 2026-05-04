"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { PurchasedReport } from "../lib/domain/user";
import { buildPurchasedReportResultHref } from "../lib/buildPurchasedReportResultHref";
import { formatBirthDisplay } from "../lib/formatBirth";
import PurchasedReportPhotoEditor from "./PurchasedReportPhotoEditor";
import ReportEmailReceiveButton from "./ReportEmailReceiveButton";

type PurchasedReportsListProps = {
  reports: PurchasedReport[];
  /** 리포트가 없을 때만 렌더 */
  emptyContent: ReactNode;
  variant?: "mypage" | "collection";
  /** 컬렉션 전용: 로그인 이메일 기본값(버튼 표시 시) */
  recipientEmail?: string;
};

export default function PurchasedReportsList({
  reports,
  emptyContent,
  variant = "mypage",
  recipientEmail,
}: PurchasedReportsListProps) {
  if (!reports.length) {
    return <>{emptyContent}</>;
  }

  const sorted = [...reports].sort(
    (a, b) =>
      new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
  );

  const liClass =
    variant === "collection"
      ? "overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.22)] backdrop-blur-sm"
      : "overflow-hidden rounded-2xl border border-white/10 bg-white/5";

  const ulClass = variant === "collection" ? "mt-4 space-y-4" : "mt-4 space-y-2";

  return (
    <ul className={ulClass}>
      {sorted.map((r) => {
        const href = buildPurchasedReportResultHref(r);
        const purchasedLabel = new Date(r.purchasedAt).toLocaleString("ko-KR", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        return (
          <li key={r.id} className={liClass}>
            <div className="flex items-start justify-between gap-3 px-4 py-4">
              <PurchasedReportPhotoEditor
                reportId={r.id}
                gender={r.gender}
                partnerName={r.name}
                birthIso={r.birth}
                birthLabel={formatBirthDisplay(r.birth)}
              />
              <Link
                href={href}
                className="shrink-0 self-center rounded-lg px-2 py-2 text-xs font-medium text-fuchsia-200/90 transition hover:bg-white/10 hover:text-fuchsia-100 sm:py-1.5"
              >
                열기 →
              </Link>
            </div>
            {variant === "collection" ? (
              <>
                <p className="border-t border-white/10 px-4 py-2.5 text-[11px] text-white/45">
                  구매 {purchasedLabel}
                </p>
                {typeof recipientEmail === "string" ? (
                  <ReportEmailReceiveButton
                    reportId={r.id}
                    defaultEmail={recipientEmail}
                  />
                ) : null}
              </>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
