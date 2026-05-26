import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedServerSupabase: SupabaseClient | null = null

export function getServerSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing server Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.'
    )
  }

  cachedServerSupabase ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedServerSupabase
}

export const serverSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getServerSupabaseClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
