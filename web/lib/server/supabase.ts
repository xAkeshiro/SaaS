import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * A server-only Supabase client with the secret key, which bypasses row-level
 * security. Only route handlers use it, and only for writes the public may not
 * make directly (the tables it touches have RLS on and no policies). Null until
 * the project's env vars are set, so the site keeps working without a database.
 */
let cached: SupabaseClient | null | undefined;

export function serviceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  // The newer secret key first; the legacy service-role key is what Vercel's Supabase integration sets.
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  cached = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return cached;
}
