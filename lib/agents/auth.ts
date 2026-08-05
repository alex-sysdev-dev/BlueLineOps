import 'server-only'

import { cookies } from 'next/headers'
import { getAppAccessRoleForEmail, isLocalDevPlatformAccessEnabled } from '@/lib/enterprise-access'
import { createSupabaseAuthServerClient } from '@/lib/supabase-auth-server'

export type AgentRequestContext = {
  actorId: string | null
  actorEmail: string | null
  role: 'admin' | 'viewer'
  localDeveloper: boolean
}
export async function getAgentRequestContext(): Promise<AgentRequestContext | null> {
  if (isLocalDevPlatformAccessEnabled()) {
    return {
      actorId: null,
      actorEmail: null,
      role: 'admin',
      localDeveloper: true,
    }
  }

  const cookieStore = await cookies()
  const supabase = createSupabaseAuthServerClient(
    () => cookieStore.getAll(),
    () => {}
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = getAppAccessRoleForEmail(user?.email)

  if (!user || !role) {
    return null
  }

  return {
    actorId: user.id,
    actorEmail: user.email ?? null,
    role,
    localDeveloper: false,
  }
}
