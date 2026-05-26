import { NextResponse, type NextRequest } from 'next/server'
import { serverSupabase } from '@/lib/supabase-server'

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null
  const email = normalizeEmail(body?.email)

  if (!email) {
    return NextResponse.json({ exists: false, message: 'Email is required.' }, { status: 400 })
  }

  let page = 1
  const perPage = 1000

  while (page <= 20) {
    const { data, error } = await serverSupabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      return NextResponse.json({ exists: false, message: error.message }, { status: 500 })
    }

    const users = data.users ?? []
    const exists = users.some((user) => user.email?.trim().toLowerCase() === email)

    if (exists) {
      return NextResponse.json({ exists: true })
    }

    if (users.length < perPage) {
      break
    }

    page += 1
  }

  return NextResponse.json({ exists: false })
}
