import PickPackFloorView from '@/components/outbound/PickPackFloorView'
import { getAppAccessRoleForEmail, isLocalDevPlatformAccessEnabled } from '@/lib/enterprise-access'
import { createSupabaseAuthServerClient } from '@/lib/supabase-auth-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createSupabaseAuthServerClient(
    () => cookieStore.getAll(),
    () => {}
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const accessRole = isLocalDevPlatformAccessEnabled() ? 'admin' : getAppAccessRoleForEmail(user?.email) ?? 'viewer'

  return <PickPackFloorView readOnly={accessRole === 'viewer'} />
}
