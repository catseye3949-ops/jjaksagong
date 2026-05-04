"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  normalizeDayPillarForPurchase,
  normalizeTargetBirthDateForPurchase,
  normalizeTargetBirthDateFromStorage,
} from "@/lib/purchaseBirthNormalize";
import { supabase } from "@/lib/supabaseClient";

const ResultIsPaidContext = createContext(false);

export function useResultIsPaid(): boolean {
  return useContext(ResultIsPaidContext);
}

type ResultIsPaidGateProps = {
  serverIsPaid: boolean;
  birthdate: string;
  birthtime: string;
  dayPillar: string | null;
  children: ReactNode;
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
    let cancelled = false;

    const run = async () => {
      try {
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
          if (!cancelled) setPaid(serverIsPaid);
          return;
        }

        if (!isReady) return;

        if (!user?.email) {
          if (!cancelled) setPaid(serverIsPaid);
          return;
        }

        const emailKey = user.email.trim().toLowerCase();

        const localMatch = (user.purchasedReports ?? []).some((r) => {
          const rb = normalizeTargetBirthDateForPurchase(r.birth);
          const rp = normalizeDayPillarForPurchase(r.ilju);
          return rb === wantBirth && rp === wantPillar;
        });

        if (localMatch) {
          if (!cancelled) setPaid(true);
          return;
        }

        if (!supabase) {
          if (!cancelled) setPaid(serverIsPaid);
          return;
        }

        const { data, error } = await supabase
          .from("purchases")
          .select("*")
          .eq("email", emailKey);

        if (cancelled) return;

        if (error) {
          console.error("[result:isPaid:client] purchases select error", error);
          if (!cancelled) setPaid(serverIsPaid);
          return;
        }

        const rows = data ?? [];
        let hit = false;
        for (const row of rows) {
          const rowBirth = normalizeTargetBirthDateFromStorage(
            (row as { target_birth_date?: unknown }).target_birth_date,
          );
          const rowPillar = normalizeDayPillarForPurchase(
            String((row as { day_pillar?: unknown }).day_pillar ?? ""),
          );
          if (rowBirth === wantBirth && rowPillar === wantPillar) {
            hit = true;
            break;
          }
        }
        if (!cancelled) setPaid(hit || serverIsPaid);
      } catch (e) {
        console.error("[result:isPaid:client] effect error", e);
        if (!cancelled) setPaid(serverIsPaid);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [serverIsPaid, birthdate, birthtime, dayPillar, user, isReady]);

  return (
    <ResultIsPaidContext.Provider value={paid}>
      {children}
    </ResultIsPaidContext.Provider>
  );
}
