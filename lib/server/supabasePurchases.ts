import "server-only";

import { normalizeTargetBirthDateForPurchase } from "@/lib/purchaseBirthNormalize";
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
      return [];
    }
    return (data ?? []) as PurchaseRow[];
  } catch (e) {
    console.error("[fetchPurchasesForEmail] exception:", e);
    return [];
  }
}

/**
 * 상대 생일·일주 기준으로 해당 리포트 구매 여부를 확인합니다.
 */
export async function hasPurchasedReportForBirthAndPillar(
  email: string,
  targetBirthDate: string,
  dayPillar: string,
): Promise<boolean> {
  if (!supabase || !email.trim() || !dayPillar.trim()) return false;
  const birth = normalizeTargetBirthDateForPurchase(targetBirthDate);
  if (!birth) return false;
  const key = email.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from("purchases")
      .select("id")
      .eq("email", key)
      .eq("target_birth_date", birth)
      .eq("day_pillar", dayPillar.trim())
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(
        "[hasPurchasedReportForBirthAndPillar] Supabase error:",
        error,
      );
      return false;
    }
    return data != null;
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
  if (!opts.sessionEmail || !opts.dayPillar) return false;
  return hasPurchasedReportForBirthAndPillar(
    opts.sessionEmail,
    opts.targetBirthDate,
    opts.dayPillar,
  );
}
