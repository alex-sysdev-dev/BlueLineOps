import { NextResponse, type NextRequest } from 'next/server'
import { buildResetPasswordEmail } from '@/lib/email/reset-password-template'
import { serverSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

type ResetPasswordPayload = {
  email?: unknown
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function buildRecoveryRedirectUrl(request: NextRequest): string {
  const origin = new URL(request.url).origin
  const callbackUrl = new URL('/auth/callback', origin)
  callbackUrl.searchParams.set('next', '/update-password?status=recovery')
  return callbackUrl.toString()
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as ResetPasswordPayload | null
  const email = clean(payload?.email).toLowerCase()

  if (!email) {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
  }

  if (!isEmail(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail =
    process.env.PASSWORD_RESET_FROM_EMAIL ??
    process.env.CONTACT_SALES_FROM_EMAIL ??
    'BlueLineOps <onboarding@resend.dev>'

  if (!apiKey) {
    return NextResponse.json({ message: 'Password reset email is not configured yet.' }, { status: 503 })
  }

  const { data, error } = await serverSupabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: buildRecoveryRedirectUrl(request),
    },
  })

  if (error) {
    return NextResponse.json({ message: 'Could not create password reset link.' }, { status: 502 })
  }

  const resetUrl = data.properties.action_link
  if (!resetUrl) {
    return NextResponse.json({ message: 'Password reset link was not returned.' }, { status: 502 })
  }

  const emailContent = buildResetPasswordEmail(resetUrl)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    return NextResponse.json(
      { message: errorPayload?.message ?? 'Could not send password reset email.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ message: 'Password reset link sent. Check your email.' })
}
