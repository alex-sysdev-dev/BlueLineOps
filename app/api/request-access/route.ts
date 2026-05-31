import { NextResponse, type NextRequest } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'
import { buildRequestAccessEmail } from '@/lib/email/request-access-template'

type RequestAccessPayload = {
  name?: unknown
  email?: unknown
  company?: unknown
  role?: unknown
  accessNeed?: unknown
  teamSize?: unknown
  requestReason?: unknown
  newsletterOptIn?: unknown
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as RequestAccessPayload | null

  const name = clean(payload?.name)
  const email = clean(payload?.email).toLowerCase()
  const company = clean(payload?.company)
  const role = clean(payload?.role)
  const accessNeed = clean(payload?.accessNeed)
  const teamSize = clean(payload?.teamSize)
  const requestReason = clean(payload?.requestReason)
  const newsletterOptIn = typeof payload?.newsletterOptIn === 'boolean' ? payload.newsletterOptIn : true

  if (!name || !email || !company || !role || !accessNeed) {
    return NextResponse.json({ message: 'Name, email, company, role, and access need are required.' }, { status: 400 })
  }

  if (!isEmail(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_SALES_TO_EMAIL ?? 'xpertmarxman@gmail.com'
  const fromEmail = process.env.CONTACT_SALES_FROM_EMAIL ?? 'BlueLineOps <onboarding@resend.dev>'

  try {
    const { error: insertError } = await serverSupabase.from('request_access_requests').insert({
      name,
      email,
      company,
      role,
      access_need: accessNeed,
      team_size: teamSize,
      request_reason: requestReason,
      newsletter_opt_in: newsletterOptIn,
      source: 'request_access_form',
      status: 'new',
    })

    if (insertError) {
      return NextResponse.json({ message: 'Could not save access request.' }, { status: 502 })
    }
  } catch (insertError) {
    return NextResponse.json(
      {
        message:
          insertError instanceof Error
            ? insertError.message
            : 'Request access capture is not configured yet.',
      },
      { status: 503 }
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { message: 'Access request saved. Email notification is not configured yet.' },
      { status: 503 }
    )
  }

  const emailContent = buildRequestAccessEmail({
    name,
    email,
    company,
    role,
    accessNeed,
    teamSize,
    requestReason,
    newsletterOptIn,
  })

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    return NextResponse.json(
      { message: errorPayload?.message ?? 'Could not send access request.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ message: 'Access request sent.' })
}
