import { NextResponse, type NextRequest } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'

type ContactSalesPayload = {
  name?: unknown
  email?: unknown
  company?: unknown
  phone?: unknown
  role?: unknown
  useCase?: unknown
  newsletterOptIn?: unknown
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as ContactSalesPayload | null

  const name = clean(payload?.name)
  const email = clean(payload?.email).toLowerCase()
  const company = clean(payload?.company)
  const phone = clean(payload?.phone)
  const role = clean(payload?.role)
  const useCase = clean(payload?.useCase)
  const newsletterOptIn = typeof payload?.newsletterOptIn === 'boolean' ? payload.newsletterOptIn : true

  if (!name || !email || !company || !phone || !role || !useCase) {
    return NextResponse.json({ message: 'All fields are required.' }, { status: 400 })
  }

  if (!isEmail(email)) {
    return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.CONTACT_SALES_TO_EMAIL ?? 'xpertmarxman@gmail.com'
  const fromEmail = process.env.CONTACT_SALES_FROM_EMAIL ?? 'BlueLineOps <onboarding@resend.dev>'

  try {
    const { error: insertError } = await serverSupabase.from('contact_sales_requests').insert({
      name,
      email,
      company,
      phone,
      role,
      use_case: useCase,
      newsletter_opt_in: newsletterOptIn,
      source: 'contact_sales_form',
      status: 'new',
    })

    if (insertError) {
      return NextResponse.json({ message: 'Could not save contact request.' }, { status: 502 })
    }
  } catch (insertError) {
    return NextResponse.json(
      {
        message:
          insertError instanceof Error
            ? insertError.message
            : 'Contact lead capture is not configured yet.',
      },
      { status: 503 }
    )
  }

  if (!apiKey) {
    return NextResponse.json(
      { message: 'Contact request saved. Email notification is not configured yet.' },
      { status: 503 }
    )
  }

  const text = [
    'New BlueLineOps contact sales request',
    '',
    `Name: ${name}`,
    `Company: ${company}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Role: ${role}`,
    `Newsletter opt-in: ${newsletterOptIn ? 'Yes' : 'No'}`,
    '',
    'Use case:',
    useCase,
  ].join('\n')

  const html = `
    <h2>New BlueLineOps contact sales request</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Company:</strong> ${escapeHtml(company)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Role:</strong> ${escapeHtml(role)}</p>
    <p><strong>Newsletter opt-in:</strong> ${newsletterOptIn ? 'Yes' : 'No'}</p>
    <p><strong>Use case:</strong></p>
    <p>${escapeHtml(useCase).replaceAll('\n', '<br />')}</p>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `BlueLineOps Contact Sales - ${company}`,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null
    return NextResponse.json(
      { message: errorPayload?.message ?? 'Could not send contact request.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ message: 'Contact request sent.' })
}
