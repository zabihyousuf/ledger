import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export function createServerSupabase() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl || process.env.SUPABASE_URL || ''
  const serviceKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  })
}
