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

/**
 * 생년월일(YYYY-MM-DD 등) 기준 만 나이. 생일이 아직 오지 않았으면 1살 차감.
 */
export function getManAgeFromIsoDate(iso: string): number | null {
  const normalized = iso.trim().replace(/\./g, "-").replace(/\//g, "-");
  const parts = normalized.split("-").map((s) => s.trim());
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  const birth = new Date(y, mo - 1, d);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}
