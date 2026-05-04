"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  normalizeDayPillarForPurchase,
  normalizeTargetBirthDateForPurchase,
  normalizeTargetBirthDateFromStorage,
} from "@/lib/purchaseBirthNormalize";
import { supabase } from "@/lib/supabaseClient";

type ResultIsPaidGateProps = {
  /** HttpOnly 세션 기준 서버 판정(쿠키 없으면 보통 false) */
  serverIsPaid: boolean;
  birthdate: string;
  birthtime: string;
  dayPillar: string | null;
  children: (isPaid: boolean) => React.ReactNode;
};

export default function ResultIsPaidGate({
  serverIsPaid,
  birthdate,
  birthtime,
  dayPillar,
  children,
}: ResultIsPaidGateProps) {
  const { user, isReady } = useAuth();
  const [paid, setPaid] = useState(serverIsPaid);

  useEffect(() => {
    const wantBirth = normalizeTargetBirthDateForPurchase(birthdate);
    const wantPillar =
      typeof dayPillar === "string"
        ? normalizeDayPillarForPurchase(dayPillar)
        : null;

    console.log("[result:isPaid:client] input", {
      serverIsPaid,
      isReady,
      userEmail: user?.email ?? null,
      birthdateQuery: birthdate,
      birthtimeQuery: birthtime,
      normalizedBirthdate: wantBirth,
      calculatedDayPillar: dayPillar,
      normalizedDayPillar: wantPillar,
    });

    if (!wantBirth || !wantPillar) {
      console.log("[result:isPaid:client] skip: normalize failed → server only", {
        serverIsPaid,
      });
      setPaid(serverIsPaid);
      return;
    }

    if (!isReady) return;

    if (!user?.email) {
      console.log(
        "[result:isPaid:client] no Auth user → server only (jjak_session과 불일치 가능)",
        { serverIsPaid },
      );
      setPaid(serverIsPaid);
      return;
    }

    const emailKey = user.email.trim().toLowerCase();

    const localMatch = user.purchasedReports.some((r) => {
      const rb = normalizeTargetBirthDateForPurchase(r.birth);
      const rp = normalizeDayPillarForPurchase(r.ilju);
      return rb === wantBirth && rp === wantPillar;
    });

    console.log("[result:isPaid:client] purchasedReports (/reports 동일 기준)", {
      reportCount: user.purchasedReports.length,
      localMatch,
    });

    if (localMatch) {
      console.log("[result:isPaid:client] match: local purchasedReports");
      setPaid(true);
      return;
    }

    if (!supabase) {
      console.log("[result:isPaid:client] supabase 미설정 → server only");
      setPaid(serverIsPaid);
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("email", emailKey);

      if (cancelled) return;

      if (error) {
        console.error("[result:isPaid:client] purchases select error", error);
        console.log("[result:isPaid:client] select error detail", {
          message: error.message,
          code: error.code,
        });
        setPaid(serverIsPaid);
        return;
      }

      const rows = data ?? [];
      console.log("[result:isPaid:client] purchases rows", rows);

      let hit = false;
      for (const row of rows) {
        const rowBirth = normalizeTargetBirthDateFromStorage(
          (row as { target_birth_date?: unknown }).target_birth_date,
        );
        const rowPillar = normalizeDayPillarForPurchase(
          String((row as { day_pillar?: unknown }).day_pillar ?? ""),
        );
        console.log("[result:isPaid:client] row compare", {
          rowBirth,
          rowPillar,
          wantBirth,
          wantPillar,
          birthMatch: rowBirth === wantBirth,
          pillarMatch: rowPillar === wantPillar,
        });
        if (rowBirth === wantBirth && rowPillar === wantPillar) {
          hit = true;
          break;
        }
      }

      const merged = hit || serverIsPaid;
      console.log("[result:isPaid:client] match result", { hit, serverIsPaid, merged });
      setPaid(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [serverIsPaid, birthdate, birthtime, dayPillar, user, isReady]);

  return <>{children(paid)}</>;
}
