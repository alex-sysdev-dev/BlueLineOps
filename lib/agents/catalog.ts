import type { AgentDefinition, AgentFacilityConfig, AgentKey } from '@/types/agents'

export const AGENT_CATALOG: AgentDefinition[] = [
  {
    agentKey: 'wave-risk',
    displayName: 'Wave Risk Agent',
    purpose: 'Identify waves at risk and explain the evidence before work is released.',
    defaultAutonomyLevel: 2,
    defaultActionType: 'wave.stage_release_hold',
    active: true,
  },
  {
    agentKey: 'dock-exception',
    displayName: 'Dock Exception Agent',
    purpose: 'Identify dock exceptions without dispatching or redirecting equipment.',
    defaultAutonomyLevel: 2,
    defaultActionType: 'dock.stage_dispatch_hold',
    active: true,
  },
  {
    agentKey: 'labor-reallocation',
    displayName: 'Labor Reallocation Agent',
    purpose: 'Recommend labor moves without reassigning associates.',
    defaultAutonomyLevel: 2,
    defaultActionType: 'labor.stage_reallocation',
    active: true,
  },
  {
    agentKey: 'inventory-discrepancy',
    displayName: 'Inventory Discrepancy Agent',
    purpose: 'Identify inventory discrepancies without changing on-hand balances.',
    defaultAutonomyLevel: 2,
    defaultActionType: 'inventory.stage_cycle_count',
    active: true,
  },
]

const CONFIDENCE_THRESHOLDS: Record<AgentKey, number> = {
  'wave-risk': 0.75,
  'dock-exception': 0.8,
  'labor-reallocation': 0.85,
  'inventory-discrepancy': 0.9,
}
const STALE_AFTER_MINUTES: Record<AgentKey, number> = {
  'wave-risk': 30,
  'dock-exception': 20,
  'labor-reallocation': 15,
  'inventory-discrepancy': 60,
}

export function getDefaultAgentConfigs(facilityId: string): AgentFacilityConfig[] {
  return AGENT_CATALOG.map((agent) => ({
    facilityId,
    agentKey: agent.agentKey,
    enabled: true,
    autonomyLevel: 2,
    minimumConfidence: CONFIDENCE_THRESHOLDS[agent.agentKey],
    staleAfterMinutes: STALE_AFTER_MINUTES[agent.agentKey],
    approverRoles: ['admin'],
    allowedReversibleActions: agent.defaultActionType ? [agent.defaultActionType] : [],
    executionMode: 'simulation',
  }))
}

export function getAgentDefinition(agentKey: AgentKey): AgentDefinition {
  return AGENT_CATALOG.find((agent) => agent.agentKey === agentKey) ?? AGENT_CATALOG[0]
}
