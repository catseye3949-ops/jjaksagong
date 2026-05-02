"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Gender } from "../lib/domain/user";
import { STORAGE_PENDING_PARTNER_PHOTO_KEY } from "../lib/storage/keys";

type PartnerStrategyPhotoProps = {
  gender: Gender;
  /** Saved report id — when set, photo is read from the account copy */
  reportId?: string;
  /**
   * `pageHeader`: result page top title row (left of “OO님 연애공략”).
   * `centered`: standalone block, centered above content.
   */
  variant?: "centered" | "pageHeader";
};

export default function PartnerStrategyPhoto({
  gender,
  reportId,
  variant = "centered",
}: PartnerStrategyPhotoProps) {
  const { user } = useAuth();
  const [pending, setPending] = useState<string | null>(null);

  const placeholder = useMemo(
    () =>
      gender === "female"
        ? "/images/front/female.png"
        : "/images/front/male.png",
    [gender],
  );

  const savedPhoto = useMemo(() => {
    if (!reportId || !user) return null;
    return (
      user.purchasedReports.find((r) => r.id === reportId)?.photoDataUrl ?? null
    );
  }, [reportId, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reportId) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_PENDING_PARTNER_PHOTO_KEY);
      setPending(raw && raw.startsWith("data:image/") ? raw : null);
    } catch {
      setPending(null);
    }
  }, [reportId]);

  /** With a saved report id, never mix in session "pending" upload from another flow */
  const src = reportId ? savedPhoto : pending;

  const circle =
    variant === "pageHeader" ? (
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-fuchsia-300/35 bg-white/10 shadow-[0_8px_32px_rgba(217,70,239,0.25)] ring-1 ring-white/10 md:h-32 md:w-32">
        <img
          src={src || placeholder}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    ) : (
      <div className="relative h-36 w-36 overflow-hidden rounded-full border border-fuchsia-300/35 bg-white/10 shadow-[0_8px_32px_rgba(217,70,239,0.25)] ring-1 ring-white/10 md:h-48 md:w-48">
        <img
          src={src || placeholder}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );

  if (variant === "pageHeader") {
    return circle;
  }

  return <div className="mb-4 flex justify-center">{circle}</div>;
}
