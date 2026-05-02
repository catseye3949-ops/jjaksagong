/**
 * Admin gate password. Prefer `NEXT_PUBLIC_ADMIN_PASSWORD` in `.env.local`.
 * Fallback only for local dev — override in production.
 */
const FALLBACK_ADMIN_PASSWORD = "jjak-admin-local";

export function getExpectedAdminPassword(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim()
      : undefined;
  return fromEnv || FALLBACK_ADMIN_PASSWORD;
}
