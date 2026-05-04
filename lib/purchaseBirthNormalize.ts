/** `YYYY-MM-DD` / `YYYY.M.D` 등 → DB `target_birth_date` 비교용 `YYYY-MM-DD` */
export function normalizeTargetBirthDateForPurchase(raw: string): string | null {
  const t = raw.trim().replace(/\./g, "-").replace(/\//g, "-");
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = m[1];
  const mo = m[2].padStart(2, "0");
  const d = m[3].padStart(2, "0");
  return `${y}-${mo}-${d}`;
}
