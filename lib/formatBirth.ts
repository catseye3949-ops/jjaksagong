/**
 * Compat / mobile date field: digits only, max 8 → `YYYY-MM-DD` (or partial while typing).
 * e.g. `19951224` → `1995-12-24`
 */
export function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** `YYYY-MM-DD` → `1995.12.06` */
export function formatBirthDisplay(iso: string) {
  const parts = iso.split("-").map((s) => s.trim());
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  if (!y || !m || !d) return iso;
  return `${y}.${m}.${d}`;
}
