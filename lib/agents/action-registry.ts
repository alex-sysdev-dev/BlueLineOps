import type { AgentExecutionMode, AgentKey } from '@/types/agents'

export type ReversibleActionDefinition = {
  actionType: string
  agentKey: AgentKey
  label: string
  description: string
  supportedModes: AgentExecutionMode[]
  reversible: true
}
const ACTIONS: ReversibleActionDefinition[] = [
  {
    actionType: 'wave.stage_release_hold',
    agentKey: 'wave-risk',
    label: 'Stage wave release hold',
    description: 'Creates a simulated control-plane hold for supervisor review. It does not change a live wave.',
    supportedModes: ['simulation'],
    reversible: true,
  },
  {
    actionType: 'dock.stage_dispatch_hold',
    agentKey: 'dock-exception',
    label: 'Stage dock dispatch hold',
    description: 'Creates a simulated dispatch hold for supervisor review. It does not dispatch or redirect equipment.',
    supportedModes: ['simulation'],
    reversible: true,
  },
  {
    actionType: 'labor.stage_reallocation',
    agentKey: 'labor-reallocation',
    label: 'Stage labor reallocation',
    description: 'Creates a simulated labor move plan. It does not reassign an associate.',
    supportedModes: ['simulation'],
    reversible: true,
  },
  {
    actionType: 'inventory.stage_cycle_count',
    agentKey: 'inventory-discrepancy',
    label: 'Stage cycle count',
    description: 'Creates a simulated cycle-count request. It does not adjust inventory.',
    supportedModes: ['simulation'],
    reversible: true,
  },
]

export function getReversibleAction(actionType: string | null): ReversibleActionDefinition | null {
  if (!actionType) {
    return null
  }

  return ACTIONS.find((action) => action.actionType === actionType) ?? null
}

export function getActionsForAgent(agentKey: AgentKey): ReversibleActionDefinition[] {
  return ACTIONS.filter((action) => action.agentKey === agentKey)
}
