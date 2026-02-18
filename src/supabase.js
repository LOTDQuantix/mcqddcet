import { createClient } from "@supabase/supabase-js";

/**
 * Create an authenticated Supabase client using service_role key.
 * This bypasses RLS so the worker can insert MCQs.
 *
 * @param {object} env - Cloudflare Worker env bindings
 * @returns {import("@supabase/supabase-js").SupabaseClient}
 */
export function createSupabaseClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}
