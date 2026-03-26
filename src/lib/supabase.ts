import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { storageAdapter } from './storage'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config'

/**
 * Supabase client — returns a real client when env vars are set,
 * or a dummy placeholder in dev mode so the app doesn't crash.
 */
function createSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — running in offline/dev mode')
    // Return a client pointed at a dummy URL so imports don't crash.
    // All real network calls will fail gracefully.
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { storage: storageAdapter, autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
}

export const supabase = createSupabaseClient()
