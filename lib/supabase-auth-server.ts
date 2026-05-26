import { createServerClient } from '@supabase/ssr'

type CookieToSet = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export function getPublicSupabaseAuthEnv(): { supabaseUrl: string; supabaseKey: string } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase auth environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    )
  }

  return { supabaseUrl, supabaseKey }
}

export function createSupabaseAuthServerClient(
  getAll: () => Array<{ name: string; value: string }>,
  setAll: (cookiesToSet: CookieToSet[]) => void
) {
  const { supabaseUrl, supabaseKey } = getPublicSupabaseAuthEnv()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll,
      setAll,
    },
  })
}
