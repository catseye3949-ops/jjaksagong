/**
 * Client-side demo credential digest. Replace with server-side Argon2id when going live.
 */
export async function digestPassword(
  email: string,
  password: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const data = new TextEncoder().encode(`${normalizedEmail}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
