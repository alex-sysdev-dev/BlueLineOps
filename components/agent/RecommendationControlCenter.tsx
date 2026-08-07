"use client"

import { useMemo, useState } from 'react'
import type {
  AgentControlCenterData,
  AgentFacilityConfig,
  AgentRecommendation,
  RecommendationAction,
  RecommendationStatus,
  RecommendationWithAudit,
  SafeguardFlag,
} from '@/types/agents'

type Props = {
  initialData: AgentControlCenterData
  accessRole: 'admin' | 'viewer'
}
const AUTONOMY_LABELS: Record<number, string> = {
  1: 'Observe and explain',
  2: 'Recommend only',
  3: 'Supervisor approval required',
  4: 'Approved reversible actions',
}

const STATUS_LABELS: Record<RecommendationStatus, string> = {
  proposed: 'Proposed',
  approved: 'Approved',
  rejected: 'Rejected',
  executed: 'Executed',
  rolled_back: 'Rolled back',
  expired: 'Expired',
}

const SAFEGUARD_LABELS: Record<SafeguardFlag, string> = {
  low_confidence: 'Below confidence threshold',
  conflicting_recommendation: 'Conflicts with another recommendation',
  stale_data: 'Evidence is stale or expired',
  missing_evidence: 'Evidence is missing',
  unsupported_action: 'Action is not configured',
  clarification_requested: 'Clarification requested',
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value || 'Not available'
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusTone(status: RecommendationStatus): string {
  switch (status) {
    case 'approved':
      return 'border-blue-400/40 bg-blue-500/10 text-blue-100'
    case 'executed':
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
    case 'rejected':
      return 'border-rose-400/40 bg-rose-500/10 text-rose-100'
    case 'rolled_back':
      return 'border-violet-400/40 bg-violet-500/10 text-violet-100'
    case 'expired':
      return 'border-zinc-600 bg-zinc-800 text-zinc-300'
    default:
      return 'border-amber-400/40 bg-amber-500/10 text-amber-100'
  }
}

function riskTone(risk: AgentRecommendation['riskLevel']): string {
  if (risk === 'critical') return 'text-rose-200'
  if (risk === 'high') return 'text-orange-200'
  if (risk === 'medium') return 'text-amber-200'
  return 'text-emerald-200'
}

function ActionButton({
  label,
  onClick,
  disabled,
  tone = 'primary',
}: {
  label: string
  onClick: () => void
  disabled: boolean
  tone?: 'primary' | 'danger' | 'neutral'
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-500/50 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25'
      : tone === 'neutral'
        ? 'border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
        : 'border-blue-500/50 bg-blue-600 text-white hover:bg-blue-500'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 ${toneClass}`}
    >
      {label}
    </button>
  )
}

function RecommendationListItem({
  recommendation,
  agentName,
  selected,
  onSelect,
}: {
  recommendation: RecommendationWithAudit
  agentName: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-blue-400/60 bg-blue-500/10'
          : 'border-zinc-700/70 bg-zinc-950/40 hover:border-zinc-600 hover:bg-zinc-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">{agentName}</div>
          <div className="mt-2 line-clamp-2 text-sm font-medium text-zinc-100">{recommendation.recommendedAction}</div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(recommendation.status)}`}>
          {STATUS_LABELS[recommendation.status]}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span>{Math.round(recommendation.confidenceScore * 100)}% confidence</span>
        <span>{formatTimestamp(recommendation.createdAt)}</span>
      </div>
      {recommendation.safeguardFlags.length > 0 ? (
        <div className="mt-3 text-xs font-medium text-amber-200">
          {recommendation.safeguardFlags.length} safeguard warning
          {recommendation.safeguardFlags.length === 1 ? '' : 's'}
        </div>
      ) : null}
    </button>
  )
}

function AgentConfigCard({
  name,
  config,
}: {
  name: string
  config: AgentFacilityConfig
}) {
  return (
    <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-100">{name}</h3>
          <p className="mt-1 text-xs text-zinc-400">Facility: {config.facilityId}</p>
        </div>
        <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100">
          Level {config.autonomyLevel}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-200">{AUTONOMY_LABELS[config.autonomyLevel]}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-zinc-500">Minimum confidence</div>
          <div className="mt-1 font-semibold text-zinc-200">{Math.round(config.minimumConfidence * 100)}%</div>
        </div>
        <div>
          <div className="text-zinc-500">Evidence age limit</div>
          <div className="mt-1 font-semibold text-zinc-200">{config.staleAfterMinutes} minutes</div>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100">
        {config.executionMode === 'simulation'
          ? 'Simulation mode. No live operational records are changed.'
          : 'Production mode. Only configured reversible adapters may run.'}
      </div>
    </div>
  )
}

export default function RecommendationControlCenter({ initialData, accessRole }: Props) {
  const [recommendations, setRecommendations] = useState(initialData.recommendations)
  const [selectedId, setSelectedId] = useState(initialData.recommendations[0]?.id ?? null)
  const [statusFilter, setStatusFilter] = useState<'all' | RecommendationStatus>('all')
  const [reason, setReason] = useState('')
  const [busyAction, setBusyAction] = useState<RecommendationAction | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const agentNames = useMemo(
    () => new Map(initialData.definitions.map((agent) => [agent.agentKey, agent.displayName])),
    [initialData.definitions]
  )
  const configs = useMemo(
    () => new Map(initialData.configs.map((config) => [`${config.facilityId}:${config.agentKey}`, config])),
    [initialData.configs]
  )
  const filteredRecommendations = recommendations.filter(
    (recommendation) => statusFilter === 'all' || recommendation.status === statusFilter
  )
  const selected = recommendations.find((recommendation) => recommendation.id === selectedId) ?? null
  const selectedConfig = selected ? configs.get(`${selected.facilityId}:${selected.agentKey}`) ?? null : null
  const approvalBlocked = (selected?.safeguardFlags.length ?? 0) > 0
  const canExecute =
    selected?.status === 'approved' &&
    selectedConfig?.autonomyLevel === 4 &&
    Boolean(selected.actionType) &&
    selectedConfig.allowedReversibleActions.includes(selected.actionType ?? '') &&
    !approvalBlocked

  async function runAction(action: Exclude<RecommendationAction, 'expire'>) {
    if (!selected || busyAction) return

    setBusyAction(action)
    setMessage(null)
    try {
      const response = await fetch(`/api/agent/recommendations/${selected.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason,
          expectedUpdatedAt: selected.updatedAt,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message ?? 'The requested action was blocked.')
        return
      }

      const updated = data.recommendation as RecommendationWithAudit
      setRecommendations((current) =>
        current.map((recommendation) => (recommendation.id === updated.id ? updated : recommendation))
      )
      setReason('')
      setMessage(`${STATUS_LABELS[updated.status]} and written to the audit history.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The recommendation action failed.')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Graduated autonomy</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">Agent Control Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Review operational intent before anything changes. Agents can explain and recommend. Supervisors control approval,
            simulated execution, and rollback.
          </p>
        </div>
        <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          <div className="font-semibold">Simulation is clearly separated from production</div>
          <div className="mt-1 text-xs text-violet-200/80">No production execution adapter is enabled in this framework.</div>
        </div>
      </header>

      {initialData.error ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="font-semibold">Agent database setup is pending</div>
          <div className="mt-1 text-amber-100/80">{initialData.error}</div>
        </div>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Agent permissions by facility</h2>
            <p className="mt-1 text-sm text-zinc-400">All four agents start at level 2: recommendation only.</p>
          </div>
          <div className="text-xs font-medium text-zinc-500">Facility: {initialData.facilityId}</div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {initialData.configs.map((config) => (
            <AgentConfigCard
              key={`${config.facilityId}:${config.agentKey}`}
              name={agentNames.get(config.agentKey) ?? config.agentKey}
              config={config}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Recommendations</h2>
              <p className="mt-1 text-xs text-zinc-500">No recommendation is executed automatically.</p>
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | RecommendationStatus)}
              aria-label="Filter recommendations by status"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-200"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {filteredRecommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/30 p-5 text-sm text-zinc-400">
                No operational recommendations are available. The interface does not create sample orders, labor moves,
                equipment dispatches, or inventory adjustments.
              </div>
            ) : (
              filteredRecommendations.map((recommendation) => (
                <RecommendationListItem
                  key={recommendation.id}
                  recommendation={recommendation}
                  agentName={agentNames.get(recommendation.agentKey) ?? recommendation.agentKey}
                  selected={selected?.id === recommendation.id}
                  onSelect={() => {
                    setSelectedId(recommendation.id)
                    setMessage(null)
                    setReason('')
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          {!selected ? (
            <div className="flex min-h-80 items-center justify-center text-center">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Select a recommendation</h2>
                <p className="mt-2 text-sm text-zinc-400">Evidence, affected work, KPI impact, actions, and audit history appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-zinc-700/70 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
                    {agentNames.get(selected.agentKey) ?? selected.agentKey}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-100">{selected.recommendedAction}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(selected.status)}`}>
                      {STATUS_LABELS[selected.status]}
                    </span>
                    <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                      {selected.executionMode === 'simulation' ? 'Simulation' : 'Production'}
                    </span>
                    <span className={`rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs font-semibold ${riskTone(selected.riskLevel)}`}>
                      {selected.riskLevel.toUpperCase()} risk
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-right">
                  <div className="text-2xl font-semibold text-zinc-100">{Math.round(selected.confidenceScore * 100)}%</div>
                  <div className="text-xs text-zinc-500">Confidence</div>
                </div>
              </div>

              {selected.safeguardFlags.length > 0 ? (
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4">
                  <div className="font-semibold text-amber-100">Supervisor action is blocked by safeguards</div>
                  <ul className="mt-2 space-y-1 text-sm text-amber-100/80">
                    {selected.safeguardFlags.map((flag) => (
                      <li key={flag}>• {SAFEGUARD_LABELS[flag]}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Required approval</div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100">
                    Level {selected.requiredApprovalLevel}: {AUTONOMY_LABELS[selected.requiredApprovalLevel]}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Evidence observed</div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100">{formatTimestamp(selected.dataObservedAt)}</div>
                </div>
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Expires</div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100">{formatTimestamp(selected.expiresAt)}</div>
                </div>
                <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                  <div className="text-xs text-zinc-500">Agent identity</div>
                  <div className="mt-2 text-sm font-semibold text-zinc-100">{selected.agentIdentity}</div>
                  <div className="mt-1 text-xs text-zinc-500">Version {selected.agentVersion}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section>
                  <h3 className="text-lg font-semibold text-zinc-100">Evidence used</h3>
                  <div className="mt-3 space-y-3">
                    {selected.evidence.map((item, index) => (
                      <div key={`${item.source}:${index}`} className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">{item.source}</div>
                        <p className="mt-2 text-sm leading-6 text-zinc-200">{item.summary}</p>
                        <div className="mt-2 text-xs text-zinc-500">Observed {formatTimestamp(item.observedAt)}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-zinc-100">Expected KPI impact</h3>
                  <div className="mt-3 space-y-3">
                    {selected.expectedKpiImpact.map((impact, index) => (
                      <div key={`${impact.metric}:${index}`} className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-zinc-100">{impact.metric}</div>
                          <div className="text-xs font-semibold uppercase text-blue-200">{impact.direction}</div>
                        </div>
                        <p className="mt-2 text-sm text-zinc-200">{impact.expectedChange}</p>
                        <p className="mt-2 text-xs leading-5 text-zinc-500">Basis: {impact.basis}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section>
                <h3 className="text-lg font-semibold text-zinc-100">Affected work and resources</h3>
                {selected.affectedEntities.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-400">
                    No affected orders, waves, labor, equipment, or inventory were identified.
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.affectedEntities.map((entity) => (
                      <span key={`${entity.type}:${entity.id}`} className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200">
                        <span className="font-semibold capitalize">{entity.type}</span>: {entity.label ?? entity.id}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-zinc-700/70 bg-zinc-950/40 p-4">
                <h3 className="font-semibold text-zinc-100">Rollback instructions</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{selected.rollbackInstructions}</p>
                <p className="mt-2 text-xs text-violet-200">
                  Initial actions are simulation-only control-plane records. They do not mutate operational tables.
                </p>
              </section>

              {accessRole === 'admin' ? (
                <section className="rounded-xl border border-zinc-700/70 bg-zinc-900/60 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex-1">
                      <label htmlFor="agent-action-reason" className="text-sm font-semibold text-zinc-100">
                        Supervisor note
                      </label>
                      <textarea
                        id="agent-action-reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={2}
                        placeholder="Required for rejection, clarification, and rollback."
                        className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.status === 'proposed' ? (
                        <>
                          <ActionButton
                            label="Approve"
                            onClick={() => runAction('approve')}
                            disabled={Boolean(busyAction) || approvalBlocked}
                          />
                          <ActionButton
                            label="Request clarification"
                            onClick={() => runAction('request_clarification')}
                            disabled={Boolean(busyAction) || !reason.trim()}
                            tone="neutral"
                          />
                          <ActionButton
                            label="Reject"
                            onClick={() => runAction('reject')}
                            disabled={Boolean(busyAction) || !reason.trim()}
                            tone="danger"
                          />
                        </>
                      ) : null}
                      {selected.status === 'approved' ? (
                        <>
                          <ActionButton
                            label={canExecute ? 'Execute simulated action' : 'Execution blocked'}
                            onClick={() => runAction('execute')}
                            disabled={Boolean(busyAction) || !canExecute}
                          />
                          <ActionButton
                            label="Reject approval"
                            onClick={() => runAction('reject')}
                            disabled={Boolean(busyAction) || !reason.trim()}
                            tone="danger"
                          />
                        </>
                      ) : null}
                      {selected.status === 'executed' ? (
                        <ActionButton
                          label="Roll back simulated action"
                          onClick={() => runAction('rollback')}
                          disabled={Boolean(busyAction) || !reason.trim()}
                          tone="neutral"
                        />
                      ) : null}
                    </div>
                  </div>
                  {message ? (
                    <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200" role="status">
                      {message}
                    </div>
                  ) : null}
                </section>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  View-only access. A supervisor must approve, reject, execute, or roll back recommendations.
                </div>
              )}

              <section>
                <h3 className="text-lg font-semibold text-zinc-100">Full audit history</h3>
                <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-700/70">
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-950/70 text-left text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Time</th>
                        <th className="px-4 py-3 font-semibold">Event</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Actor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.auditHistory.map((audit) => (
                        <tr key={audit.id} className="border-t border-zinc-800 text-zinc-200">
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{formatTimestamp(audit.createdAt)}</td>
                          <td className="px-4 py-3">{audit.eventType.replaceAll('_', ' ')}</td>
                          <td className="px-4 py-3">
                            {audit.fromStatus ? `${STATUS_LABELS[audit.fromStatus]} → ` : ''}
                            {STATUS_LABELS[audit.toStatus]}
                          </td>
                          <td className="px-4 py-3">{audit.actorEmail ?? audit.actorRole}</td>
                        </tr>
                      ))}
                      {selected.auditHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                            No audit history was returned.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
