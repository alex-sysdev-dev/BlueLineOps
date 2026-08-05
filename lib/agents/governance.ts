import { getReversibleAction } from '@/lib/agents/action-registry'
import type {
  AgentAuditEvent,
  AgentAuditEventType,
  AgentFacilityConfig,
  AgentRecommendation,
  RecommendationAction,
  RecommendationStatus,
  SafeguardFlag,
} from '@/types/agents'

export type GovernanceActor = {
  id: string | null
  email: string | null
  role: 'admin' | 'viewer' | 'agent' | 'system'
  type: 'user' | 'agent' | 'system'
}

export type GovernanceDecision = {
  allowed: boolean
  nextStatus: RecommendationStatus
  safeguardFlags: SafeguardFlag[]
  reasons: string[]
  auditEvent: AgentAuditEvent
}

const ACTION_EVENT: Record<RecommendationAction, AgentAuditEventType> = {
  approve: 'recommendation_approved',
  reject: 'recommendation_rejected',
  request_clarification: 'clarification_requested',
  execute: 'action_executed',
  rollback: 'action_rolled_back',
  expire: 'recommendation_expired',
}

const ACTION_STATUS: Record<RecommendationAction, RecommendationStatus> = {
  approve: 'approved',
  reject: 'rejected',
  request_clarification: 'proposed',
  execute: 'executed',
  rollback: 'rolled_back',
  expire: 'expired',
}

const BLOCKING_APPROVAL_FLAGS = new Set<SafeguardFlag>([
  'low_confidence',
  'conflicting_recommendation',
  'stale_data',
  'missing_evidence',
  'unsupported_action',
  'clarification_requested',
])

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime())
}

function minutesBetween(earlier: string, later: Date): number {
  return (later.getTime() - new Date(earlier).getTime()) / 60_000
}

export function evaluateSafeguards(
  recommendation: AgentRecommendation,
  config: AgentFacilityConfig,
  now: Date,
  conflictingRecommendationIds: string[] = []
): SafeguardFlag[] {
  const flags = new Set<SafeguardFlag>(
    recommendation.safeguardFlags.filter((flag) => flag === 'clarification_requested')
  )

  if (recommendation.evidence.length === 0 || recommendation.evidence.some((item) => !item.source || !item.summary)) {
    flags.add('missing_evidence')
  }

  if (recommendation.confidenceScore < config.minimumConfidence) {
    flags.add('low_confidence')
  }

  const observedAtIsValid = isValidDate(recommendation.dataObservedAt)
  const expiresAtIsValid = isValidDate(recommendation.expiresAt)
  if (
    !observedAtIsValid ||
    !expiresAtIsValid ||
    (observedAtIsValid && minutesBetween(recommendation.dataObservedAt, now) > config.staleAfterMinutes) ||
    (expiresAtIsValid && new Date(recommendation.expiresAt).getTime() <= now.getTime())
  ) {
    flags.add('stale_data')
  }

  if (conflictingRecommendationIds.length > 0) {
    flags.add('conflicting_recommendation')
  }

  const action = getReversibleAction(recommendation.actionType)
  if (
    recommendation.actionType &&
    (!action ||
      action.agentKey !== recommendation.agentKey ||
      !config.allowedReversibleActions.includes(recommendation.actionType) ||
      !action.supportedModes.includes(recommendation.executionMode))
  ) {
    flags.add('unsupported_action')
  }

  return [...flags]
}

function baseTransitionReasons(
  recommendation: AgentRecommendation,
  config: AgentFacilityConfig,
  action: RecommendationAction,
  actor: GovernanceActor,
  flags: SafeguardFlag[]
): string[] {
  const reasons: string[] = []

  if (!config.enabled) {
    reasons.push('This agent is disabled for the facility.')
  }

  if (actor.role !== 'admin' && action !== 'expire') {
    reasons.push('Supervisor access is required.')
  }

  if (!config.approverRoles.includes('admin') && action !== 'expire') {
    reasons.push('The facility configuration does not allow this supervisor role.')
  }

  if (recommendation.facilityId !== config.facilityId || recommendation.agentKey !== config.agentKey) {
    reasons.push('Recommendation and facility configuration do not match.')
  }

  if ((action === 'approve' || action === 'execute') && flags.some((flag) => BLOCKING_APPROVAL_FLAGS.has(flag))) {
    reasons.push('Resolve all safeguard warnings before approval or execution.')
  }

  return reasons
}

export function evaluateTransition(input: {
  recommendation: AgentRecommendation
  config: AgentFacilityConfig
  action: RecommendationAction
  actor: GovernanceActor
  now: Date
  conflictingRecommendationIds?: string[]
  detail?: Record<string, unknown>
}): GovernanceDecision {
  const { recommendation, config, action, actor, now, detail = {} } = input
  const flags = evaluateSafeguards(
    recommendation,
    config,
    now,
    input.conflictingRecommendationIds ?? []
  )
  const reasons = baseTransitionReasons(recommendation, config, action, actor, flags)

  if (action === 'approve' && recommendation.status !== 'proposed') {
    reasons.push('Only proposed recommendations can be approved.')
  }

  if (action === 'reject' && !['proposed', 'approved'].includes(recommendation.status)) {
    reasons.push('Only proposed or approved recommendations can be rejected.')
  }

  if (action === 'request_clarification' && recommendation.status !== 'proposed') {
    reasons.push('Clarification can be requested only while a recommendation is proposed.')
  }

  if (action === 'execute') {
    if (recommendation.status !== 'approved') {
      reasons.push('Supervisor approval is required before execution.')
    }
    if (config.autonomyLevel !== 4) {
      reasons.push('Execution requires autonomy level 4 for this agent and facility.')
    }
    if (!recommendation.actionType || !getReversibleAction(recommendation.actionType)) {
      reasons.push('Execution requires a predefined reversible action.')
    }
    if (!recommendation.rollbackInstructions.trim()) {
      reasons.push('Rollback instructions are required before execution.')
    }
  }

  if (action === 'rollback' && recommendation.status !== 'executed') {
    reasons.push('Only an executed action can be rolled back.')
  }

  if (action === 'expire' && recommendation.status !== 'proposed') {
    reasons.push('Only proposed recommendations can expire.')
  }

  const nextStatus = reasons.length === 0 ? ACTION_STATUS[action] : recommendation.status
  const nextFlags =
    action === 'request_clarification' && reasons.length === 0
      ? [...new Set<SafeguardFlag>([...flags, 'clarification_requested'])]
      : flags

  return {
    allowed: reasons.length === 0,
    nextStatus,
    safeguardFlags: nextFlags,
    reasons,
    auditEvent: {
      recommendationId: recommendation.id,
      eventType: ACTION_EVENT[action],
      fromStatus: recommendation.status,
      toStatus: nextStatus,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      actorType: actor.type,
      detail: {
        ...detail,
        allowed: reasons.length === 0,
        reasons,
        safeguardFlags: nextFlags,
      },
      createdAt: now.toISOString(),
    },
  }
}
