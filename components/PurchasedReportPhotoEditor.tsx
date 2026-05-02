"use client";

import { useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Gender } from "../lib/domain/user";
import { compressPartnerPhotoFile } from "../lib/image/compressPartnerPhoto";
import { updatePurchasedReportPhoto } from "../lib/storage/userStore";

type PurchasedReportPhotoEditorProps = {
  reportId: string;
  gender: Gender;
};

export default function PurchasedReportPhotoEditor({
  reportId,
  gender,
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

  const onRemove = () => {
    if (!user) return;
    setError(null);
    const updated = updatePurchasedReportPhoto(user.email, reportId, null);
    if (!updated.ok) {
      setError(updated.error);
      return;
    }
    refresh();
    flashSaved();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-fuchsia-300/30 bg-white/5">
        <img
          src={previewUrl || placeholder}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id={`report-photo-${reportId}`}
            onChange={onPick}
          />
          <label
            htmlFor={`report-photo-${reportId}`}
            className="cursor-pointer rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:border-fuchsia-300/40"
          >
            사진 변경
          </label>
          {previewUrl ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/55 transition hover:text-white/85"
            >
              기본 이미지
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-white/40">
          {busy
            ? "압축·저장 중…"
            : savedFlash
              ? "저장했어요."
              : "선택 즉시 반영돼요."}
        </p>
        {error ? (
          <p className="text-[11px] text-rose-300/90" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
