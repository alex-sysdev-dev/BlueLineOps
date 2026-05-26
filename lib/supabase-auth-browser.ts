'use client'

import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

function getPublicSupabaseEnv(): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase auth environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    )
  }

  return { supabaseUrl, supabaseKey }
}

export function getSupabaseAuthBrowserClient() {
  const { supabaseUrl, supabaseKey } = getPublicSupabaseEnv()

  browserClient ??= createBrowserClient(supabaseUrl, supabaseKey)
  return browserClient
}
