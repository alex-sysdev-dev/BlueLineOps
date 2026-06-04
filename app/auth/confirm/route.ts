import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseAuthServerClient } from '@/lib/supabase-auth-server'

const EMAIL_OTP_TYPES = new Set(['email', 'signup', 'magiclink', 'invite', 'recovery', 'email_change'])

function safeNextPath(value: string | null, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  return value
}

function applyNextPath(targetUrl: URL, nextPath: string) {
  const parsedNext = new URL(nextPath, targetUrl.origin)
  targetUrl.pathname = parsedNext.pathname
  targetUrl.search = parsedNext.search
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const rawType = requestUrl.searchParams.get('type')
  const type = rawType && EMAIL_OTP_TYPES.has(rawType) ? rawType : 'email'
  const next = safeNextPath(
    requestUrl.searchParams.get('next'),
    type === 'recovery' ? '/update-password?status=recovery' : '/dashboard'
  )
  const failureUrl = request.nextUrl.clone()
  failureUrl.pathname = type === 'recovery' ? '/update-password' : '/login'
  failureUrl.search = '?error=callback'

  let response = NextResponse.redirect(failureUrl)

  if (!tokenHash) {
    return response
  }

  const supabase = createSupabaseAuthServerClient(
    () => request.cookies.getAll(),
    (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
    }
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as 'email',
  })

  if (!error) {
    const successUrl = request.nextUrl.clone()
    applyNextPath(successUrl, next)
    response = NextResponse.redirect(successUrl)
  }

  return response
}
