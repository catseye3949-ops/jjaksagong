import { STORAGE_ADMIN_SESSION_KEY } from "../storage/keys";

export function isAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY) === "1";
}

export function setAdminSession(authed: boolean): void {
  if (typeof window === "undefined") return;
  if (authed) sessionStorage.setItem(STORAGE_ADMIN_SESSION_KEY, "1");
  else sessionStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
}
