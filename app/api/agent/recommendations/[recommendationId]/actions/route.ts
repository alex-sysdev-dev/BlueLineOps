import { NextRequest, NextResponse } from 'next/server'
import { getAgentRequestContext } from '@/lib/agents/auth'
import { evaluateTransition } from '@/lib/agents/governance'
import { getRecommendationContext, transitionRecommendation } from '@/lib/agents/repository'
import type { RecommendationAction } from '@/types/agents'

export const runtime = 'nodejs'

type SupervisorAction = Exclude<RecommendationAction, 'expire'>

const SUPERVISOR_ACTIONS = new Set<string>([
  'approve',
  'reject',
  'request_clarification',
  'execute',
  'rollback',
])

function isSupervisorAction(value: string): value is SupervisorAction {
  return SUPERVISOR_ACTIONS.has(value)
}

type ActionBody = {
  action?: string
  reason?: string
  expectedUpdatedAt?: string
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ recommendationId: string }> }
) {
  const access = await getAgentRequestContext()
  if (!access) {
    return NextResponse.json({ error: 'unauthorized', message: 'Sign in to manage agent recommendations.' }, { status: 401 })
  }
  if (access.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden', message: 'Supervisor access is required.' }, { status: 403 })
  }

  let body: ActionBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'bad_request', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const action = body.action ?? ''
  if (!isSupervisorAction(action)) {
    return NextResponse.json({ error: 'bad_request', message: 'Unsupported recommendation action.' }, { status: 400 })
  }

  const reason = body.reason?.trim() || null
  if (['reject', 'request_clarification', 'rollback'].includes(action) && !reason) {
    return NextResponse.json({ error: 'bad_request', message: 'Add a short reason for this action.' }, { status: 400 })
  }

  const { recommendationId } = await context.params
  const recommendationContext = await getRecommendationContext(recommendationId)
  if (!recommendationContext) {
    return NextResponse.json({ error: 'not_found', message: 'Recommendation was not found.' }, { status: 404 })
  }

  const decision = evaluateTransition({
    recommendation: recommendationContext.recommendation,
    config: recommendationContext.config,
    action,
    actor: {
      id: access.actorId,
      email: access.actorEmail,
      role: access.role,
      type: 'user',
    },
    now: new Date(),
    conflictingRecommendationIds: recommendationContext.conflictingRecommendationIds,
    detail: { reason },
  })

  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: 'governance_blocked',
        message: decision.reasons[0] ?? 'The requested action is blocked.',
        reasons: decision.reasons,
        safeguardFlags: decision.safeguardFlags,
      },
      { status: 409 }
    )
  }

  try {
    const recommendation = await transitionRecommendation({
      recommendationId,
      action,
      actorId: access.actorId,
      actorEmail: access.actorEmail,
      actorRole: 'admin',
      reason,
      expectedUpdatedAt: body.expectedUpdatedAt ?? null,
    })

    return NextResponse.json({ recommendation })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recommendation action failed.'
    return NextResponse.json({ error: 'transition_failed', message }, { status: 409 })
  }
}
