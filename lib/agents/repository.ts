import 'server-only'

import { AGENT_CATALOG, getDefaultAgentConfigs } from '@/lib/agents/catalog'
import { evaluateSafeguards } from '@/lib/agents/governance'
import { serverSupabase } from '@/lib/supabase-server'
import type {
  AffectedEntity,
  AgentControlCenterData,
  AgentDefinition,
  AgentFacilityConfig,
  AgentKey,
  AgentRecommendation,
  AgentRecommendationAuditRow,
  AutonomyLevel,
  ExpectedKpiImpact,
  RecommendationAction,
  RecommendationEvidence,
  RecommendationWithAudit,
  SafeguardFlag,
} from '@/types/agents'

type RecordRow = Record<string, unknown>

export type RecommendationDraft = Omit<
  AgentRecommendation,
  'id' | 'status' | 'safeguardFlags' | 'createdAt' | 'updatedAt'
>

export type RecommendationContext = {
  recommendation: RecommendationWithAudit
  config: AgentFacilityConfig
  conflictingRecommendationIds: string[]
}

export function getDefaultFacilityId(): string {
  return process.env.BLUE_LINEOPS_FACILITY_ID?.trim() || 'default'
}

function asRecord(value: unknown): RecordRow {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as RecordRow) : {}
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function mapDefinition(row: RecordRow): AgentDefinition {
  return {
    agentKey: row.agent_key as AgentKey,
    displayName: String(row.display_name ?? ''),
    purpose: String(row.purpose ?? ''),
    defaultAutonomyLevel: Number(row.default_autonomy_level) as AutonomyLevel,
    defaultActionType: typeof row.default_action_type === 'string' ? row.default_action_type : null,
    active: row.active !== false,
  }
}

function mapConfig(row: RecordRow): AgentFacilityConfig {
  return {
    facilityId: String(row.facility_id ?? ''),
    agentKey: row.agent_key as AgentKey,
    enabled: row.enabled !== false,
    autonomyLevel: Number(row.autonomy_level) as AutonomyLevel,
    minimumConfidence: Number(row.minimum_confidence),
    staleAfterMinutes: Number(row.stale_after_minutes),
    approverRoles: asArray<'admin'>(row.approver_roles),
    allowedReversibleActions: asArray<string>(row.allowed_reversible_actions),
    executionMode: row.execution_mode === 'production' ? 'production' : 'simulation',
  }
}

function mapRecommendation(row: RecordRow): AgentRecommendation {
  return {
    id: String(row.id ?? ''),
    facilityId: String(row.facility_id ?? ''),
    agentKey: row.agent_key as AgentKey,
    agentIdentity: String(row.agent_identity ?? ''),
    agentVersion: String(row.agent_version ?? ''),
    recommendedAction: String(row.recommended_action ?? ''),
    actionType: typeof row.action_type === 'string' ? row.action_type : null,
    evidence: asArray<RecommendationEvidence>(row.evidence),
    affectedEntities: asArray<AffectedEntity>(row.affected_entities),
    affectedEntityKeys: asArray<string>(row.affected_entity_keys),
    expectedKpiImpact: asArray<ExpectedKpiImpact>(row.expected_kpi_impact),
    confidenceScore: Number(row.confidence_score),
    riskLevel: row.risk_level as AgentRecommendation['riskLevel'],
    requiredApprovalLevel: Number(row.required_approval_level) as AutonomyLevel,
    rollbackInstructions: String(row.rollback_instructions ?? ''),
    executionMode: row.execution_mode === 'production' ? 'production' : 'simulation',
    safeguardFlags: asArray<SafeguardFlag>(row.safeguard_flags),
    status: row.status as AgentRecommendation['status'],
    dataObservedAt: String(row.data_observed_at ?? ''),
    expiresAt: String(row.expires_at ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }
}

function mapAudit(row: RecordRow): AgentRecommendationAuditRow {
  return {
    id: String(row.id ?? ''),
    recommendationId: String(row.recommendation_id ?? ''),
    eventType: row.event_type as AgentRecommendationAuditRow['eventType'],
    fromStatus: (row.from_status ?? null) as AgentRecommendationAuditRow['fromStatus'],
    toStatus: row.to_status as AgentRecommendationAuditRow['toStatus'],
    actorId: typeof row.actor_id === 'string' ? row.actor_id : null,
    actorEmail: typeof row.actor_email === 'string' ? row.actor_email : null,
    actorRole: row.actor_role as AgentRecommendationAuditRow['actorRole'],
    actorType: row.actor_type as AgentRecommendationAuditRow['actorType'],
    detail: asRecord(row.detail),
    createdAt: String(row.created_at ?? ''),
  }
}

function conflictIdsFor(
  recommendation: AgentRecommendation,
  recommendations: AgentRecommendation[]
): string[] {
  if (recommendation.affectedEntityKeys.length === 0) {
    return []
  }

  const affected = new Set(recommendation.affectedEntityKeys)
  return recommendations
    .filter(
      (candidate) =>
        candidate.id !== recommendation.id &&
        candidate.facilityId === recommendation.facilityId &&
        ['proposed', 'approved', 'executed'].includes(candidate.status) &&
        candidate.affectedEntityKeys.some((key) => affected.has(key))
    )
    .map((candidate) => candidate.id)
}

function attachAuditAndSafeguards(input: {
  recommendations: AgentRecommendation[]
  audits: AgentRecommendationAuditRow[]
  configs: AgentFacilityConfig[]
}): RecommendationWithAudit[] {
  return input.recommendations.map((recommendation) => {
    const config = input.configs.find(
      (candidate) =>
        candidate.facilityId === recommendation.facilityId && candidate.agentKey === recommendation.agentKey
    )
    const safeguardFlags = config
      ? evaluateSafeguards(
          recommendation,
          config,
          new Date(),
          conflictIdsFor(recommendation, input.recommendations)
        )
      : [...new Set<SafeguardFlag>([...recommendation.safeguardFlags, 'unsupported_action'])]

    return {
      ...recommendation,
      safeguardFlags,
      auditHistory: input.audits.filter((audit) => audit.recommendationId === recommendation.id),
    }
  })
}

export async function getAgentControlCenterData(
  facilityId = getDefaultFacilityId()
): Promise<AgentControlCenterData> {
  const expirationResult = await serverSupabase.rpc('expire_agent_recommendations', {
    p_facility_id: facilityId,
  })
  if (expirationResult.error) {
    console.error('Agent recommendation expiration check error:', expirationResult.error)
  }

  const [definitionsResult, configsResult, recommendationsResult] = await Promise.all([
    serverSupabase.from('agent_definitions').select('*').order('display_name'),
    serverSupabase.from('agent_facility_configs').select('*').eq('facility_id', facilityId).order('agent_key'),
    serverSupabase
      .from('agent_recommendations')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const firstError = definitionsResult.error ?? configsResult.error ?? recommendationsResult.error
  if (firstError) {
    console.error('Agent control center fetch error:', firstError)
    return {
      facilityId,
      definitions: AGENT_CATALOG,
      configs: getDefaultAgentConfigs(facilityId),
      recommendations: [],
      error: 'Agent control-plane tables are not available yet. Apply the graduated-autonomy migration.',
    }
  }

  const definitions = asArray<RecordRow>(definitionsResult.data).map(mapDefinition)
  const configs = asArray<RecordRow>(configsResult.data).map(mapConfig)
  const recommendations = asArray<RecordRow>(recommendationsResult.data).map(mapRecommendation)
  let audits: AgentRecommendationAuditRow[] = []

  if (recommendations.length > 0) {
    const auditResult = await serverSupabase
      .from('agent_recommendation_audit')
      .select('*')
      .in(
        'recommendation_id',
        recommendations.map((recommendation) => recommendation.id)
      )
      .order('created_at', { ascending: true })

    if (auditResult.error) {
      console.error('Agent audit history fetch error:', auditResult.error)
    } else {
      audits = asArray<RecordRow>(auditResult.data).map(mapAudit)
    }
  }

  return {
    facilityId,
    definitions,
    configs,
    recommendations: attachAuditAndSafeguards({ recommendations, audits, configs }),
    error: null,
  }
}

export async function getRecommendationContext(
  recommendationId: string
): Promise<RecommendationContext | null> {
  const recommendationResult = await serverSupabase
    .from('agent_recommendations')
    .select('*')
    .eq('id', recommendationId)
    .maybeSingle()

  if (recommendationResult.error || !recommendationResult.data) {
    if (recommendationResult.error) {
      console.error('Agent recommendation fetch error:', recommendationResult.error)
    }
    return null
  }

  const recommendation = mapRecommendation(asRecord(recommendationResult.data))
  const [configResult, auditResult] = await Promise.all([
    serverSupabase
      .from('agent_facility_configs')
      .select('*')
      .eq('facility_id', recommendation.facilityId)
      .eq('agent_key', recommendation.agentKey)
      .maybeSingle(),
    serverSupabase
      .from('agent_recommendation_audit')
      .select('*')
      .eq('recommendation_id', recommendation.id)
      .order('created_at', { ascending: true }),
  ])

  if (configResult.error || !configResult.data) {
    if (configResult.error) {
      console.error('Agent facility config fetch error:', configResult.error)
    }
    return null
  }

  const config = mapConfig(asRecord(configResult.data))
  let conflictingRecommendationIds: string[] = []
  if (recommendation.affectedEntityKeys.length > 0) {
    const conflictResult = await serverSupabase
      .from('agent_recommendations')
      .select('id')
      .eq('facility_id', recommendation.facilityId)
      .neq('id', recommendation.id)
      .in('status', ['proposed', 'approved', 'executed'])
      .overlaps('affected_entity_keys', recommendation.affectedEntityKeys)

    if (!conflictResult.error) {
      conflictingRecommendationIds = asArray<RecordRow>(conflictResult.data).map((row) => String(row.id))
    }
  }

  const safeguards = evaluateSafeguards(recommendation, config, new Date(), conflictingRecommendationIds)
  return {
    recommendation: {
      ...recommendation,
      safeguardFlags: safeguards,
      auditHistory: auditResult.error ? [] : asArray<RecordRow>(auditResult.data).map(mapAudit),
    },
    config,
    conflictingRecommendationIds,
  }
}

export async function createRecommendation(draft: RecommendationDraft): Promise<RecommendationWithAudit> {
  const { data, error } = await serverSupabase.rpc('create_agent_recommendation', {
    p_facility_id: draft.facilityId,
    p_agent_key: draft.agentKey,
    p_agent_identity: draft.agentIdentity,
    p_agent_version: draft.agentVersion,
    p_recommended_action: draft.recommendedAction,
    p_action_type: draft.actionType,
    p_evidence: draft.evidence,
    p_affected_entities: draft.affectedEntities,
    p_affected_entity_keys: draft.affectedEntityKeys,
    p_expected_kpi_impact: draft.expectedKpiImpact,
    p_confidence_score: draft.confidenceScore,
    p_risk_level: draft.riskLevel,
    p_required_approval_level: draft.requiredApprovalLevel,
    p_rollback_instructions: draft.rollbackInstructions,
    p_execution_mode: draft.executionMode,
    p_data_observed_at: draft.dataObservedAt,
    p_expires_at: draft.expiresAt,
  })

  if (error) {
    throw new Error(error.message)
  }

  const created = mapRecommendation(asRecord(data))
  const context = await getRecommendationContext(created.id)
  if (!context) {
    throw new Error('Recommendation was created but could not be reloaded.')
  }

  return context.recommendation
}

export async function transitionRecommendation(input: {
  recommendationId: string
  action: Exclude<RecommendationAction, 'expire'>
  actorId: string | null
  actorEmail: string | null
  actorRole: 'admin'
  reason: string | null
  expectedUpdatedAt: string | null
}): Promise<RecommendationWithAudit> {
  const { error } = await serverSupabase.rpc('transition_agent_recommendation', {
    p_recommendation_id: input.recommendationId,
    p_action: input.action,
    p_actor_id: input.actorId,
    p_actor_email: input.actorEmail,
    p_actor_role: input.actorRole,
    p_reason: input.reason,
    p_expected_updated_at: input.expectedUpdatedAt,
  })

  if (error) {
    throw new Error(error.message)
  }

  const context = await getRecommendationContext(input.recommendationId)
  if (!context) {
    throw new Error('Recommendation was updated but could not be reloaded.')
  }

  return context.recommendation
}
