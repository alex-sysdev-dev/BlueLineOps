import { NextResponse, type NextRequest } from 'next/server'
import { getEnterpriseAccessEmails, isEnterpriseAccessEmail } from '@/lib/enterprise-access'

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null
  const email = typeof body?.email === 'string' ? body.email : ''
  const configuredEmails = getEnterpriseAccessEmails()

  if (configuredEmails.size === 0) {
    return NextResponse.json(
      { allowed: false, message: 'Enterprise access is not configured.' },
      { status: 503 }
    )
  }

  if (!isEnterpriseAccessEmail(email)) {
    return NextResponse.json(
      { allowed: false, message: 'This email is not authorized for Enterprise Login.' },
      { status: 403 }
    )
  }

  return NextResponse.json({ allowed: true })
}
