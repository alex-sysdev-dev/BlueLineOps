import 'server-only'

export type AppAccessRole = 'admin' | 'viewer'

export function isLocalDevPlatformAccessEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.LOCAL_DEV_PLATFORM_ACCESS === 'true'
}

function parseEmailList(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function getEnterpriseAccessEmails(): Set<string> {
  const raw = process.env.ENTERPRISE_ACCESS_EMAILS ?? process.env.ENTERPRISE_OWNER_EMAIL ?? ''

  return parseEmailList(raw)
}

export function getViewOnlyAccessEmails(): Set<string> {
  const raw = process.env.VIEW_ONLY_ACCESS_EMAILS ?? ''

  return parseEmailList(raw)
}

export function isEnterpriseAccessEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  return getEnterpriseAccessEmails().has(email.trim().toLowerCase())
}

export function isViewOnlyAccessEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  return getViewOnlyAccessEmails().has(email.trim().toLowerCase())
}

export function getAppAccessRoleForEmail(email: string | null | undefined): AppAccessRole | null {
  if (isEnterpriseAccessEmail(email)) {
    return 'admin'
  }

  if (isViewOnlyAccessEmail(email)) {
    return 'viewer'
  }

  return null
}

export function hasProtectedAppAccess(email: string | null | undefined): boolean {
  return getAppAccessRoleForEmail(email) !== null
}
