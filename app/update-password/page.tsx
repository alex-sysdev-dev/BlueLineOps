import LoginForm from '@/components/auth/LoginForm'

type UpdatePasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function resolveMessage(status: string | undefined, error: string | undefined): string | null {
  if (status === 'recovery') {
    return 'Enter a new password to finish resetting your account.'
  }

  if (error === 'callback') {
    return 'That reset link could not be confirmed. Request a fresh reset link.'
  }

  return null
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const params = (await searchParams) ?? {}
  const message = resolveMessage(firstParam(params.status), firstParam(params.error))

  return (
    <LoginForm
      initialMode="update-password"
      initialNextPath="/dashboard"
      initialMessage={message}
    />
  )
}
