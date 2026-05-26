import LoginForm from '@/components/auth/LoginForm'

type LoginMode = 'enterprise' | 'login' | 'signup' | 'reset' | 'update-password'

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function resolveMode(value: string | undefined): LoginMode {
  if (value === 'signup' || value === 'reset' || value === 'update-password') {
    return value
  }

  if (value === 'enterprise') {
    return 'enterprise'
  }

  return 'login'
}

function resolveMessage(status: string | undefined, error: string | undefined): string | null {
  if (status === 'complete') {
    return 'Signup complete. You can log in now.'
  }

  if (status === 'recovery') {
    return 'Enter a new password to finish resetting your account.'
  }

  if (error === 'enterprise') {
    return 'That account is signed in, but Enterprise access is owner-only.'
  }

  if (error === 'callback') {
    return 'That magic link could not be confirmed. Request a fresh link.'
  }

  return null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {}
  const mode = resolveMode(firstParam(params.mode))
  const nextPath = firstParam(params.next) ?? '/dashboard'
  const message = resolveMessage(firstParam(params.status), firstParam(params.error))

  return <LoginForm initialMode={mode} initialNextPath={nextPath} initialMessage={message} />
}
