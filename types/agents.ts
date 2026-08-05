export const AGENT_KEYS = [
  'wave-risk',
  'dock-exception',
  'labor-reallocation',
  'inventory-discrepancy',
] as const

export type AgentKey = (typeof AGENT_KEYS)[number]
export type AutonomyLevel = 1 | 2 | 3 | 4
export type AgentExecutionMode = 'simulation' | 'production'
export type AgentRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type RecommendationStatus =
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'rolled_back'
  | 'expired'

export type RecommendationAction =
  | 'approve'
  | 'reject'
  | 'request_clarification'
  | 'execute'
  | 'rollback'
  | 'expire'

export type SafeguardFlag =
  | 'low_confidence'
  | 'conflicting_recommendation'
  | 'stale_data'
  | 'missing_evidence'
  | 'unsupported_action'
  | 'clarification_requested'

export type AffectedEntityType = 'order' | 'wave' | 'labor' | 'equipment' | 'inventory'

export type RecommendationEvidence = {
  source: string
  summary: string
  observedAt: string
  reference?: string
}

export type AffectedEntity = {
  type: AffectedEntityType
  id: string
  label?: string
}

export type ExpectedKpiImpact = {
  metric: string
  direction: 'increase' | 'decrease' | 'hold' | 'unknown'
  expectedChange: string
  basis: string
}

export type AgentFacilityConfig = {
  facilityId: string
  agentKey: AgentKey
  enabled: boolean
  autonomyLevel: AutonomyLevel
  minimumConfidence: number
  staleAfterMinutes: number
  approverRoles: Array<'admin'>
  allowedReversibleActions: string[]
  executionMode: AgentExecutionMode
}

export type AgentDefinition = {
  agentKey: AgentKey
  displayName: string
  purpose: string
  defaultAutonomyLevel: AutonomyLevel
  defaultActionType: string | null
  active: boolean
}

export type AgentRecommendation = {
  id: string
  facilityId: string
  agentKey: AgentKey
  agentIdentity: string
  agentVersion: string
  recommendedAction: string
  actionType: string | null
  evidence: RecommendationEvidence[]
  affectedEntities: AffectedEntity[]
  affectedEntityKeys: string[]
  expectedKpiImpact: ExpectedKpiImpact[]
  confidenceScore: number
  riskLevel: AgentRiskLevel
  requiredApprovalLevel: AutonomyLevel
  rollbackInstructions: string
  executionMode: AgentExecutionMode
  safeguardFlags: SafeguardFlag[]
  status: RecommendationStatus
  dataObservedAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export type AgentAuditEventType =
  | 'recommendation_created'
  | 'clarification_requested'
  | 'recommendation_approved'
  | 'recommendation_rejected'
  | 'action_executed'
  | 'action_rolled_back'
  | 'recommendation_expired'

export type AgentAuditEvent = {
  recommendationId: string
  eventType: AgentAuditEventType
  fromStatus: RecommendationStatus | null
  toStatus: RecommendationStatus
  actorId: string | null
  actorEmail: string | null
  actorRole: 'admin' | 'viewer' | 'agent' | 'system'
  actorType: 'user' | 'agent' | 'system'
  detail: Record<string, unknown>
  createdAt: string
}

export type AgentRecommendationAuditRow = AgentAuditEvent & {
  id: string
}

export type RecommendationWithAudit = AgentRecommendation & {
  auditHistory: AgentRecommendationAuditRow[]
}

export type AgentControlCenterData = {
  facilityId: string
  definitions: AgentDefinition[]
  configs: AgentFacilityConfig[]
  recommendations: RecommendationWithAudit[]
  error: string | null
}
