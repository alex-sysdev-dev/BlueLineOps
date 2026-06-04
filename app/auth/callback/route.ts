import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseAuthServerClient } from '@/lib/supabase-auth-server'

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
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
  const code = requestUrl.searchParams.get('code')
  const next = safeNextPath(requestUrl.searchParams.get('next'))
  const redirectUrl = request.nextUrl.clone()

  if (code) {
    applyNextPath(redirectUrl, next)
  } else {
    redirectUrl.pathname = '/login'
    redirectUrl.search = '?error=callback'
  }

  let response = NextResponse.redirect(redirectUrl)

  if (!code) {
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const failureUrl = request.nextUrl.clone()
    failureUrl.pathname = next.startsWith('/update-password') ? '/update-password' : '/login'
    failureUrl.search = '?error=callback'
    response = NextResponse.redirect(failureUrl)
  }

  return response
}
