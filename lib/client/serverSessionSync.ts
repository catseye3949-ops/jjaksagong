"use client";

import type { UserAccount } from "@/lib/domain/user";
import { readUsers } from "@/lib/storage/userStore";

export async function establishServerSession(
  email: string,
  password: string,
): Promise<void> {
  const users = readUsers();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, users }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[establishServerSession] jjak_session not set:",
      res.status,
      text.slice(0, 300),
    );
  }
}

export async function clearServerSession(): Promise<void> {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });
}

export async function refreshServerSessionUsers(): Promise<void> {
  const users: Record<string, UserAccount> = readUsers();
  const res = await fetch("/api/auth/session/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[refreshServerSessionUsers] session refresh failed:",
      res.status,
      text.slice(0, 300),
    );
  }
}
