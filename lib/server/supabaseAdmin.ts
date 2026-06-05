import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

let adminClient: SupabaseClient | null | undefined;

/** Server-side Supabase client. Prefers service role for writes that anon RLS may block. */
export function supabaseServer(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey) {
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return adminClient;
  }

  adminClient = supabase;
  return adminClient;
}

export function supabaseServerAuthMode(): "service_role" | "anon" | "none" {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey) return "service_role";
  if (supabase) return "anon";
  return "none";
}

export function hasSupabaseServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
