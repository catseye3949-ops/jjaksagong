import { digestPassword } from "./digestPassword";
import type { UserAccount } from "../domain/user";

/**
 * Mirrors client `loginWithCredentials` rules for use on API routes.
 */
export async function verifyUserCredentials(
  users: Record<string, UserAccount>,
  email: string,
  password: string,
): Promise<UserAccount | null> {
  const key = email.trim().toLowerCase();
  const acc = users[key];
  if (!acc) return null;

  if (acc.passwordDigest) {
    const d = await digestPassword(key, password);
    if (d !== acc.passwordDigest) return null;
  } else if (password.trim() !== "") {
    return null;
  }

  return acc;
}
