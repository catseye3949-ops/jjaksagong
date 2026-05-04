/** `YYYY-MM-DD` / `YYYY.M.D` / `YYYYMMDD` 등 → DB `target_birth_date` 비교용 `YYYY-MM-DD` */
export function normalizeTargetBirthDateForPurchase(raw: string): string | null {
  const t0 = raw.trim();
  if (!t0) return null;
  const digitOnly = t0.replace(/\D/g, "");
  if (digitOnly.length === 8 && /^\d{8}$/.test(digitOnly)) {
    const y = digitOnly.slice(0, 4);
    const mo = digitOnly.slice(4, 6);
    const d = digitOnly.slice(6, 8);
    return `${y}-${mo}-${d}`;
  }
  const t = t0.replace(/\./g, "-").replace(/\//g, "-");
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = m[1];
  const mo = m[2].padStart(2, "0");
  const d = m[3].padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/** Supabase `date` / `timestamptz` 문자열 등 저장값 → `YYYY-MM-DD` */
export function normalizeTargetBirthDateFromStorage(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const head = raw.includes("T") ? raw.split("T")[0]!.trim() : raw.trim();
    return normalizeTargetBirthDateForPurchase(head);
  }
  return null;
}

/** 일주(한글 2글자 등) 비교용 — 공백·호환 문자만 정리 */
export function normalizeDayPillarForPurchase(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const s = String(raw);
  if (!s.trim()) return null;
  try {
    return s.normalize("NFC").trim();
  } catch {
    return s.trim();
  }
}
