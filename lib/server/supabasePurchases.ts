import "server-only";

import {
  normalizeDayPillarForPurchase,
  normalizeTargetBirthDateForPurchase,
  normalizeTargetBirthDateFromStorage,
} from "@/lib/purchaseBirthNormalize";
import { supabase } from "@/lib/supabaseClient";

/** Supabase `purchases` 행 (필요 시 확장) */
export type PurchaseRow = Record<string, unknown>;

/**
 * 로그인 세션 이메일 기준으로 `purchases` 전체를 조회합니다.
 */
export async function fetchPurchasesForEmail(
  email: string,
): Promise<PurchaseRow[]> {
  if (!supabase || !email.trim()) return [];
  const key = email.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("email", key);
    if (error) {
      console.error("[fetchPurchasesForEmail] Supabase error:", error);
      console.log("[fetchPurchasesForEmail] query error detail", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return [];
    }
    console.log("[fetchPurchasesForEmail] rows", {
      email: key,
      count: (data ?? []).length,
      rows: (data ?? []).map((r) => ({
        target_birth_date: (r as PurchaseRow).target_birth_date,
        day_pillar: (r as PurchaseRow).day_pillar,
      })),
    });
    return (data ?? []) as PurchaseRow[];
  } catch (e) {
    console.error("[fetchPurchasesForEmail] exception:", e);
    return [];
  }
}

/**
 * 상대 생일·일주 기준으로 해당 리포트 구매 여부를 확인합니다.
 * (email으로 purchases 전부 조회 후, 생일·일주를 정규화해 클라이언트에서 비교)
 */
export async function hasPurchasedReportForBirthAndPillar(
  email: string,
  targetBirthDate: string,
  dayPillar: string,
): Promise<boolean> {
  if (!supabase || !email.trim() || !dayPillar.trim()) return false;
  const wantBirth = normalizeTargetBirthDateForPurchase(targetBirthDate);
  const wantPillar = normalizeDayPillarForPurchase(dayPillar);
  if (!wantBirth || !wantPillar) {
    console.log("[hasPurchasedReportForBirthAndPillar] normalize failed", {
      targetBirthDate,
      dayPillar,
      wantBirth,
      wantPillar,
    });
    return false;
  }
  const key = email.trim().toLowerCase();
  try {
    const rows = await fetchPurchasesForEmail(key);
    console.log("[hasPurchasedReportForBirthAndPillar] compare", {
      email: key,
      wantBirth,
      wantPillar,
      rowCount: rows.length,
    });
    for (const row of rows) {
      const rawBirth = (row as PurchaseRow).target_birth_date;
      const rawPillar = (row as PurchaseRow).day_pillar;
      const rowBirth = normalizeTargetBirthDateFromStorage(rawBirth);
      const rowPillar = normalizeDayPillarForPurchase(
        rawPillar == null ? null : String(rawPillar),
      );
      console.log("[hasPurchasedReportForBirthAndPillar] row", {
        rawBirth,
        rawPillar,
        rowBirth,
        rowPillar,
        birthMatch: rowBirth === wantBirth,
        pillarMatch: rowPillar === wantPillar,
      });
      if (rowBirth === wantBirth && rowPillar === wantPillar) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error("[hasPurchasedReportForBirthAndPillar] exception:", e);
    return false;
  }
}

export async function resolveResultPageIsPaid(opts: {
  sessionEmail: string | null;
  targetBirthDate: string;
  dayPillar: string | null;
}): Promise<boolean> {
  console.log("[resolveResultPageIsPaid] input", opts);
  if (!opts.sessionEmail || !opts.dayPillar) {
    console.log(
      "[resolveResultPageIsPaid] skip: missing sessionEmail or dayPillar (로그인 쿠키 없으면 false)",
    );
    return false;
  }
  const hit = await hasPurchasedReportForBirthAndPillar(
    opts.sessionEmail,
    opts.targetBirthDate,
    opts.dayPillar,
  );
  console.log("[resolveResultPageIsPaid] result", { hit });
  return hit;
}
