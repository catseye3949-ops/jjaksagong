"use client";

import type { UserAccount } from "@/lib/domain/user";
import { readUsers } from "@/lib/storage/userStore";

export async function establishServerSession(
  email: string,
  password: string,
): Promise<void> {
  const users = readUsers();
  await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, users }),
  });
}

export async function clearServerSession(): Promise<void> {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });
}

export async function refreshServerSessionUsers(): Promise<void> {
  const users: Record<string, UserAccount> = readUsers();
  await fetch("/api/auth/session/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users }),
  });
}
