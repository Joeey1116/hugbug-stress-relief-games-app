import { supabase } from './supabase';

/**
 * Hugbug profile — one row per account in the `profiles` table
 * (id uuid PK, email text). Best-effort: when Supabase is not configured
 * (placeholder values in eas.json) this is a no-op and the app still works
 * fully offline with local progress.
 *
 * TODO (Joey step): create a dedicated Supabase project for Hugbug and run
 * the SQL in supabase/schema.sql, then put the real URL + anon key in
 * eas.json. Never reuse the Rewards project's credentials.
 */
export async function ensureProfile(userId: string, email: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('profiles').upsert({ id: userId, email }, { onConflict: 'id' });
  } catch {
    // Non-fatal: the profile self-heals on the next call.
  }
}
