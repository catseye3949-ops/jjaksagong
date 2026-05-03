"use client";

import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Gender } from "../lib/domain/user";
import { getManAgeFromIsoDate } from "../lib/formatBirth";
import { compressPartnerPhotoFile } from "../lib/image/compressPartnerPhoto";
import { updatePurchasedReportPhoto } from "../lib/storage/userStore";

type PurchasedReportPhotoEditorProps = {
  reportId: string;
  gender: Gender;
  partnerName: string;
  /** YYYY-MM-DD — 만 나이 계산용 */
  birthIso: string;
  birthLabel: string;
};

function reportGenderShort(g: Gender): string {
  if (g === "male") return "남";
  if (g === "female") return "여";
  return "-";
}

export default function PurchasedReportPhotoEditor({
  reportId,
  gender,
  partnerName,
  birthIso,
  birthLabel,
}: PurchasedReportPhotoEditorProps) {
  const { user, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl =
    user?.purchasedReports.find((r) => r.id === reportId)?.photoDataUrl ??
    null;
  const placeholder =
    gender === "female"
      ? "/images/front/female.png"
      : "/images/front/male.png";

  const flashSaved = useCallback(() => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2200);
  }, []);

  const manAge = getManAgeFromIsoDate(birthIso);
  const genderShort = reportGenderShort(gender);
  const ageGenderLine = (() => {
    const parts: string[] = [];
    if (manAge !== null) parts.push(`${manAge}살`);
    if (genderShort !== "-") parts.push(genderShort);
    return parts.join(" · ");
  })();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setError(null);
    setBusy(true);
    const result = await compressPartnerPhotoFile(file);
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    const updated = updatePurchasedReportPhoto(
      user.email,
      reportId,
      result.dataUrl,
    );
    if (!updated.ok) {
      setBusy(false);
      setError(updated.error);
      return;
    }
    refresh();
    setBusy(false);
    flashSaved();
  };

  return (
    <div className="flex min-w-0 flex-1 items-start gap-4">
      <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-fuchsia-300/30 bg-white/5">
          <img
            src={previewUrl || placeholder}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id={`report-photo-${reportId}`}
          onChange={onPick}
        />
        <label
          htmlFor={`report-photo-${reportId}`}
          className="cursor-pointer text-center text-xs text-white/90 opacity-70 transition hover:opacity-100"
        >
          사진 변경
        </label>
        {busy || savedFlash ? (
          <p className="text-center text-[10px] leading-snug text-white/45">
            {busy ? "압축·저장 중…" : "저장했어요."}
          </p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1 pt-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="min-w-0 text-sm font-semibold text-white [overflow-wrap:anywhere]">
            {partnerName}
          </span>
          {ageGenderLine ? (
            <span className="text-xs text-white/70">{ageGenderLine}</span>
          ) : null}
        </div>
        <p className="text-xs text-white/55">({birthLabel})</p>
        {error ? (
          <p className="pt-1 text-[11px] text-rose-300/90" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
