import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseAuthServerClient } from '@/lib/supabase-auth-server'
import { getAppAccessRoleForEmail, isEnterpriseAccessEmail, isLocalDevPlatformAccessEnabled } from '@/lib/enterprise-access'

const PROTECTED_PREFIXES = [
  '/associates',
  '/dashboard',
  '/forecasting',
  '/inbound',
  '/outbound',
  '/qa',
  '/suppliers',
  '/yms',
]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function redirectToLogin(request: NextRequest, reason?: string): NextResponse {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/login'
  redirectUrl.searchParams.set('mode', 'enterprise')
  redirectUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  if (reason) {
    redirectUrl.searchParams.set('error', reason)
  }

  return NextResponse.redirect(redirectUrl)
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  if (isLocalDevPlatformAccessEnabled() && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  if (isLocalDevPlatformAccessEnabled() && isProtectedPath(pathname)) {
    return response
  }

  const supabase = createSupabaseAuthServerClient(
    () => request.cookies.getAll(),
    (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value)
      })

      response = NextResponse.next({ request })

      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedPath(pathname)) {
    if (!user) {
      return redirectToLogin(request)
    }

    if (!getAppAccessRoleForEmail(user.email)) {
      return redirectToLogin(request, 'enterprise')
    }
  }

  if (pathname === '/login' && user && isEnterpriseAccessEmail(user.email)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
