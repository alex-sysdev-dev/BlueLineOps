import { NextRequest, NextResponse } from 'next/server'
import { getAgentRequestContext } from '@/lib/agents/auth'
import { getAgentControlCenterData, getDefaultFacilityId } from '@/lib/agents/repository'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const access = await getAgentRequestContext()
  if (!access) {
    return NextResponse.json({ error: 'unauthorized', message: 'Sign in to view agent recommendations.' }, { status: 401 })
  }

  const facilityId = request.nextUrl.searchParams.get('facilityId')?.trim() || getDefaultFacilityId()
  const data = await getAgentControlCenterData(facilityId)

  return NextResponse.json({ ...data, accessRole: access.role }, { status: data.error ? 503 : 200 })
}
