import { describe, expect, it } from 'vitest'
import { evaluateSafeguards, evaluateTransition } from '@/lib/agents/governance'
import type { AgentFacilityConfig, AgentRecommendation } from '@/types/agents'

const NOW = new Date('2026-08-04T18:00:00.000Z')

const adminActor = {
  id: 'supervisor-1',
  email: 'supervisor@example.com',
  role: 'admin' as const,
  type: 'user' as const,
}

const config: AgentFacilityConfig = {
  facilityId: 'default',
  agentKey: 'wave-risk',
  enabled: true,
  autonomyLevel: 4,
  minimumConfidence: 0.75,
  staleAfterMinutes: 30,
  approverRoles: ['admin'],
  allowedReversibleActions: ['wave.stage_release_hold'],
  executionMode: 'simulation',
}

function recommendation(overrides: Partial<AgentRecommendation> = {}): AgentRecommendation {
  return {
    id: 'recommendation-1',
    facilityId: 'default',
    agentKey: 'wave-risk',
    agentIdentity: 'Wave Risk Agent',
    agentVersion: '1.0.0',
    recommendedAction: 'Stage a release hold for supervisor review.',
    actionType: 'wave.stage_release_hold',
    evidence: [
      {
        source: 'order_cpt_risk',
        summary: 'Two orders are inside the configured review window.',
        observedAt: '2026-08-04T17:50:00.000Z',
      },
    ],
    affectedEntities: [{ type: 'wave', id: 'wave-1', label: 'Wave 1' }],
    affectedEntityKeys: ['wave:wave-1'],
    expectedKpiImpact: [
      {
        metric: 'on_time_ship_pct',
        direction: 'hold',
        expectedChange: 'Protect the current service level.',
        basis: 'Orders inside the configured review window.',
      },
    ],
    confidenceScore: 0.88,
    riskLevel: 'medium',
    requiredApprovalLevel: 3,
    rollbackInstructions: 'Remove the staged release hold.',
    executionMode: 'simulation',
    safeguardFlags: [],
    status: 'proposed',
    dataObservedAt: '2026-08-04T17:50:00.000Z',
    expiresAt: '2026-08-04T18:20:00.000Z',
    createdAt: '2026-08-04T17:50:00.000Z',
    updatedAt: '2026-08-04T17:50:00.000Z',
    ...overrides,
  }
}

describe('graduated agent governance', () => {
  it('enforces supervisor permission', () => {
    const decision = evaluateTransition({
      recommendation: recommendation(),
      config,
      action: 'approve',
      actor: { ...adminActor, role: 'viewer' },
      now: NOW,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.reasons).toContain('Supervisor access is required.')
  })

  it('requires approval before execution', () => {
    const decision = evaluateTransition({
      recommendation: recommendation(),
      config,
      action: 'execute',
      actor: adminActor,
      now: NOW,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.reasons).toContain('Supervisor approval is required before execution.')
  })

  it('blocks approval below the facility confidence threshold', () => {
    const rec = recommendation({ confidenceScore: 0.6 })
    const decision = evaluateTransition({ recommendation: rec, config, action: 'approve', actor: adminActor, now: NOW })

    expect(decision.allowed).toBe(false)
    expect(decision.safeguardFlags).toContain('low_confidence')
  })

  it('executes only a configured reversible action at autonomy level 4', () => {
    const rec = recommendation({ status: 'approved' })
    const decision = evaluateTransition({ recommendation: rec, config, action: 'execute', actor: adminActor, now: NOW })

    expect(decision.allowed).toBe(true)
    expect(decision.nextStatus).toBe('executed')
    expect(decision.auditEvent.eventType).toBe('action_executed')
  })

  it('supports rollback only after execution and creates an audit event', () => {
    const rec = recommendation({ status: 'executed' })
    const decision = evaluateTransition({ recommendation: rec, config, action: 'rollback', actor: adminActor, now: NOW })

    expect(decision.allowed).toBe(true)
    expect(decision.nextStatus).toBe('rolled_back')
    expect(decision.auditEvent).toMatchObject({
      eventType: 'action_rolled_back',
      fromStatus: 'executed',
      toStatus: 'rolled_back',
      recommendationId: rec.id,
    })
  })

  it('rejects stale and unsupported recommendations', () => {
    const rec = recommendation({
      actionType: 'wave.release_live_work',
      dataObservedAt: '2026-08-04T16:00:00.000Z',
    })
    const flags = evaluateSafeguards(rec, config, NOW)

    expect(flags).toContain('stale_data')
    expect(flags).toContain('unsupported_action')
  })

  it('rejects recommendations with missing evidence or an active conflict', () => {
    const rec = recommendation({ evidence: [] })
    const decision = evaluateTransition({
      recommendation: rec,
      config,
      action: 'approve',
      actor: adminActor,
      now: NOW,
      conflictingRecommendationIds: ['recommendation-2'],
    })

    expect(decision.allowed).toBe(false)
    expect(decision.safeguardFlags).toEqual(
      expect.arrayContaining(['missing_evidence', 'conflicting_recommendation'])
    )
  })
})
