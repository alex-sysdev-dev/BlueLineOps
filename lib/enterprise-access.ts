import 'server-only'

export function getEnterpriseAccessEmails(): Set<string> {
  const raw = process.env.ENTERPRISE_ACCESS_EMAILS ?? process.env.ENTERPRISE_OWNER_EMAIL ?? ''

  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isEnterpriseAccessEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  return getEnterpriseAccessEmails().has(email.trim().toLowerCase())
}
