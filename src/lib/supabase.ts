import { createClient } from '@supabase/supabase-js'
import { storageAdapter } from './storage'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
