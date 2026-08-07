import { redirect } from 'next/navigation'
import RecommendationControlCenter from '@/components/agent/RecommendationControlCenter'
import { getAgentRequestContext } from '@/lib/agents/auth'
import { getAgentControlCenterData } from '@/lib/agents/repository'

export const dynamic = 'force-dynamic'

export default async function AgentControlCenterPage() {
  const access = await getAgentRequestContext()

  if (!access) {
    redirect('/login?mode=enterprise')
  }

  const data = await getAgentControlCenterData()

  return <RecommendationControlCenter initialData={data} accessRole={access.role} />
}
