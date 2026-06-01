import { NextResponse, type NextRequest } from 'next/server'
import { getEnterpriseAccessEmails, getViewOnlyAccessEmails, isEnterpriseAccessEmail } from '@/lib/enterprise-access'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email : ''
  const configuredEmails = getEnterpriseAccessEmails()
  const configuredViewerEmails = getViewOnlyAccessEmails()

  if (configuredEmails.size === 0) {
    return NextResponse.json(
      { allowed: false, message: 'Enterprise access is not configured.' },
      { status: 503 }
    )
  }

  if (!isEnterpriseAccessEmail(email)) {
    if (configuredViewerEmails.has(email.trim().toLowerCase())) {
      return NextResponse.json(
        { allowed: false, message: 'This email has view-only access. Use Log In instead of Enterprise Login.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { allowed: false, message: 'This email is not authorized for Enterprise Login.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ allowed: true })
}
