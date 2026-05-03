"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserAccount } from "../lib/domain/user";
import { STORAGE_SESSION_KEY, STORAGE_USERS_KEY } from "../lib/storage/keys";
import {
  loginWithCredentials,
  logout as logoutStore,
  readSessionEmail,
  readUsers,
  signupUser,
  updateUserDisplayName,
  type SignupInput,
} from "../lib/storage/userStore";

type AuthContextValue = {
  user: UserAccount | null;
  isReady: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  signup: (
    input: SignupInput,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  updateDisplayName: (
    nextName: string,
  ) => { ok: true } | { ok: false; error: string };
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthState(): { user: UserAccount | null; isReady: boolean } {
  if (typeof window === "undefined") {
    return { user: null, isReady: false };
  }
  const email = readSessionEmail();
  const users = readUsers();
  return { user: email ? users[email] ?? null : null, isReady: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(() => {
    setUser(readAuthState().user);
    setIsReady(true);
  }, []);

  useEffect(() => {
    const sync = () => {
      const next = readAuthState();
      setUser(next.user);
      setIsReady(next.isReady);
    };
    sync();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STORAGE_USERS_KEY ||
        e.key === STORAGE_SESSION_KEY ||
        e.key === null
      ) {
        sync();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("jjak-auth-changed", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("jjak-auth-changed", sync);
    };
  }, []);

  const login = useCallback(
    (email: string, password: string) => loginWithCredentials(email, password),
    [],
  );

  const logout = useCallback(() => {
    logoutStore();
  }, []);

  const signup = useCallback((input: SignupInput) => signupUser(input), []);

  const updateDisplayName = useCallback(
    (nextName: string) => {
      const email = readSessionEmail();
      if (!email) {
        return { ok: false as const, error: "로그인이 필요합니다." };
      }
      const result = updateUserDisplayName(email, nextName);
      if (result.ok) refresh();
      return result;
    },
    [refresh],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login,
      logout,
      signup,
      updateDisplayName,
      refresh,
    }),
    [user, isReady, login, logout, signup, updateDisplayName, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
