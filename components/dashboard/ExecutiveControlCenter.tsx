import OperationalPulsePanel, { type OperationalPulsePoint } from '@/components/dashboard/OperationalPulsePanel'
import KpiTile from '@/components/kpi/KpiTile'
import { getExecutiveCptRiskOrders, getExecutiveKpiHistoryHourly, getExecutiveKpiSnapshot } from '@/lib/queries/executive'
import type { ExecutiveCptRiskOrder, ExecutiveKpiHistoryRow, ExecutiveKpiSnapshot } from '@/types/executive'

function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return 'No live snapshot yet'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? 'N/A' : value.toLocaleString()
}

function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? 'N/A' : `${value.toFixed(1)}%`
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatHours(value: number | null | undefined): string {
  return value === null || value === undefined ? 'N/A' : `${value.toFixed(1)}h`
}

function formatMinutesToCpt(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Unknown'
  }

  if (value < 0) {
    return `Overdue ${Math.abs(value)}m`
  }

  return `${value}m left`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeSignal(values: Array<number | null | undefined>, fallback: number): number[] {
  const clean = values.map((value) => (value === null || value === undefined || Number.isNaN(value) ? fallback : value))

  if (clean.length === 0) {
    return []
  }

  const min = Math.min(...clean)
  const max = Math.max(...clean)

  if (Math.abs(max - min) < 0.001) {
    const midpoint = clamp(42 + clean[clean.length - 1] * 0.08, 34, 72)
    return clean.map(() => midpoint)
  }

  return clean.map((value) => clamp(14 + ((value - min) / (max - min)) * 78, 8, 96))
}

function signalRange(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return Math.max(...values) - Math.min(...values)
}

function buildPulseBase(snapshot: ExecutiveKpiSnapshot | null): OperationalPulsePoint {
  const throughput = snapshot?.throughput_per_hour ?? 22
  const productivity = snapshot?.productivity_per_labor_hour ?? 0.92
  const activeOrders = snapshot?.active_orders ?? 118
  const cptRisk = snapshot?.cpt_risk_orders ?? 6
  const yard = snapshot?.yard_occupancy_pct ?? 78
  const dock = snapshot?.dock_utilization_pct ?? 64

  return {
    backlog: clamp(26 + activeOrders * 0.15, 22, 84),
    cpt: clamp(18 + cptRisk * 8, 12, 88),
    flow: clamp(28 + throughput * 1.6 + productivity * 12, 24, 92),
    capacity: clamp((yard + dock) / 2, 18, 92),
  }
}

function buildSimulatedPulseSeed(base: OperationalPulsePoint, length = 24): OperationalPulsePoint[] {
  return Array.from({ length }, (_, index) => ({
    backlog: clamp(base.backlog + Math.sin(index / 2.2) * 9 + Math.cos(index / 5.1) * 4, 10, 96),
    cpt: clamp(base.cpt + Math.sin((index + 2) / 3) * 7 + Math.cos(index / 4.7) * 3, 8, 94),
    flow: clamp(base.flow + Math.sin((index + 1) / 2.7) * 8 - Math.cos(index / 4.2) * 4, 12, 96),
    capacity: clamp(base.capacity + Math.sin((index + 3) / 3.3) * 6 + Math.cos(index / 6.1) * 5, 10, 94),
  }))
}

function buildOperationalPulse(
  snapshot: ExecutiveKpiSnapshot | null,
  hourlyHistory: ExecutiveKpiHistoryRow[]
): { seed: OperationalPulsePoint[]; modeLabel: string; modeSummary: string } {
  const base = buildPulseBase(snapshot)

  if (hourlyHistory.length === 0) {
    return {
      seed: buildSimulatedPulseSeed(base),
      modeLabel: 'Deterministic Demo Pulse',
      modeSummary:
        'No hourly executive history was returned from Supabase, so this panel is running a deterministic control-tower pulse from the current KPI baseline.',
    }
  }

  const backlog = normalizeSignal(
    hourlyHistory.map((row) => row.active_orders_max ?? row.pending_pick_orders_max ?? row.active_orders_avg),
    snapshot?.active_orders ?? 118
  )
  const cpt = normalizeSignal(
    hourlyHistory.map((row) => row.cpt_risk_orders_max ?? row.cpt_risk_orders_avg),
    snapshot?.cpt_risk_orders ?? 6
  )
  const flow = normalizeSignal(
    hourlyHistory.map((row) => {
      const throughput = row.throughput_per_hour_avg ?? snapshot?.throughput_per_hour ?? 22
      const productivity = row.productivity_per_labor_hour_avg ?? snapshot?.productivity_per_labor_hour ?? 0.92
      return throughput * 3 + productivity * 28
    }),
    (snapshot?.throughput_per_hour ?? 22) * 3 + (snapshot?.productivity_per_labor_hour ?? 0.92) * 28
  )
  const capacity = normalizeSignal(
    hourlyHistory.map((row) => {
      const yard = row.yard_occupancy_pct_avg ?? snapshot?.yard_occupancy_pct ?? 78
      const dock = row.dock_utilization_pct_avg ?? snapshot?.dock_utilization_pct ?? 64
      return (yard + dock) / 2
    }),
    ((snapshot?.yard_occupancy_pct ?? 78) + (snapshot?.dock_utilization_pct ?? 64)) / 2
  )

  const seed = backlog.map((backlogValue, index) => ({
    backlog: backlogValue,
    cpt: cpt[index] ?? cpt[cpt.length - 1] ?? base.cpt,
    flow: flow[index] ?? flow[flow.length - 1] ?? base.flow,
    capacity: capacity[index] ?? capacity[capacity.length - 1] ?? base.capacity,
  }))

  const flattened =
    signalRange(backlog) < 10 &&
    signalRange(cpt) < 10 &&
    signalRange(flow) < 10 &&
    signalRange(capacity) < 10

  if (flattened) {
    return {
      seed: buildSimulatedPulseSeed(seed[seed.length - 1] ?? base),
      modeLabel: 'History-Assisted Pulse',
      modeSummary:
        'The stored hourly rollups are nearly flat right now, so this panel is amplifying the real baseline with a deterministic pulse that shows backlog, CPT pressure, labor flow, and capacity behavior.',
    }
  }

  return {
    seed,
    modeLabel: 'History-Seeded Pulse',
    modeSummary:
      'This pulse is seeded from the latest hourly executive rollups and continues moving between refreshes so visitors can understand the operating rhythm instead of staring at a static line.',
  }
}

function riskTone(bucket: string | null | undefined, isDeadlined: boolean | null | undefined): string {
  if (isDeadlined || bucket === 'missed') {
    return 'border-rose-400/40 bg-rose-500/15 text-rose-100'
  }
  if (bucket === 'risk') {
    return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
  }
  if (bucket === 'watch') {
    return 'border-blue-400/40 bg-blue-500/15 text-blue-100'
  }

  return 'border-zinc-500/50 bg-zinc-700/30 text-zinc-100'
}

function lifecycleLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Open'
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildOperationalBrief(snapshot: ExecutiveKpiSnapshot | null): string[] {
  if (!snapshot) {
    return ['Executive snapshot is not available yet. Verify the Supabase views and row-level access.']
  }

  const brief: string[] = []
  brief.push(
    `${formatNumber(snapshot.active_orders)} active orders with ${formatNumber(snapshot.cpt_risk_orders)} currently inside the CPT risk window.`
  )
  brief.push(
    `${formatPercent(snapshot.on_time_ship_pct)} on-time ship performance, ${formatPercent(snapshot.quality_score_pct)} quality, and ${formatNumber(snapshot.deadlined_orders)} deadlined orders.`
  )
  brief.push(
    `${formatPercent(snapshot.yard_occupancy_pct)} yard occupancy and ${formatPercent(snapshot.dock_utilization_pct)} dock utilization are driving the current capacity picture.`
  )
  brief.push(
    `${formatNumber(snapshot.active_labor)} active labor delivering ${formatNumber(snapshot.productivity_per_labor_hour)} completed orders per labor hour.`
  )

  return brief
}

function buildWatchlistHeading(riskOrders: ExecutiveCptRiskOrder[]): string {
  const deadlined = riskOrders.filter((order) => order.is_deadlined).length
  if (deadlined > 0) {
    return `${deadlined} deadlined orders need immediate review.`
  }
  if (riskOrders.length > 0) {
    return `${riskOrders.length} CPT exceptions are currently in watch or risk state.`
  }

  return 'No current CPT watchlist rows returned from Supabase.'
}

export default async function ExecutiveControlCenter() {
  const [snapshot, hourlyHistory, riskOrders] = await Promise.all([
    getExecutiveKpiSnapshot(),
    getExecutiveKpiHistoryHourly(24),
    getExecutiveCptRiskOrders(8),
  ])

  const tiles = [
    { title: 'Throughput', value: formatNumber(snapshot?.throughput_per_hour), accent: 'text-cyan-100 group-hover:text-cyan-50' },
    { title: 'Labor Cost', value: formatCurrency(snapshot?.labor_cost_per_unit), accent: 'text-amber-100 group-hover:text-amber-50' },
    { title: 'On-Time Ship', value: formatPercent(snapshot?.on_time_ship_pct), accent: 'text-emerald-100 group-hover:text-emerald-50' },
    { title: 'CPT Risk', value: formatNumber(snapshot?.cpt_risk_orders), accent: 'text-rose-100 group-hover:text-rose-50' },
    { title: 'Active Orders', value: formatNumber(snapshot?.active_orders) },
    { title: 'Pending Pick', value: formatNumber(snapshot?.pending_pick_orders), accent: 'text-blue-100 group-hover:text-blue-50' },
    { title: 'Pending Pack', value: formatNumber(snapshot?.pending_pack_orders), accent: 'text-violet-100 group-hover:text-violet-50' },
    { title: 'Order Age', value: formatHours(snapshot?.avg_order_age_hours), accent: 'text-zinc-100 group-hover:text-zinc-50' },
    { title: 'Yard Occupancy', value: formatPercent(snapshot?.yard_occupancy_pct), accent: 'text-sky-100 group-hover:text-sky-50' },
    { title: 'Dock Util', value: formatPercent(snapshot?.dock_utilization_pct), accent: 'text-blue-100 group-hover:text-blue-50' },
    { title: 'Trailer Dwell', value: formatHours(snapshot?.avg_trailer_dwell_hours), accent: 'text-orange-100 group-hover:text-orange-50' },
    { title: 'Deadlined', value: formatNumber(snapshot?.deadlined_orders), accent: 'text-rose-100 group-hover:text-rose-50' },
    { title: 'Active Labor', value: formatNumber(snapshot?.active_labor), accent: 'text-cyan-100 group-hover:text-cyan-50' },
    { title: 'Productivity', value: formatNumber(snapshot?.productivity_per_labor_hour), accent: 'text-emerald-100 group-hover:text-emerald-50' },
    { title: 'Quality', value: formatPercent(snapshot?.quality_score_pct), accent: 'text-emerald-100 group-hover:text-emerald-50' },
    { title: 'Safety', value: formatNumber(snapshot?.safety_incidents_30d), accent: 'text-amber-100 group-hover:text-amber-50' },
  ]

  const operationalBrief = buildOperationalBrief(snapshot)
  const operationalPulse = buildOperationalPulse(snapshot, hourlyHistory)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-blue-500">BlueLineOps</span>{' '}
            <span className="text-[var(--foreground)]">Facility Control Center</span>
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Live executive visibility across service, backlog, labor, capacity, quality, and trailer flow from the new Supabase intelligence views.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.92),rgba(15,23,42,0.84))] px-5 py-4 text-sm text-zinc-300">
          <div className="text-zinc-400">Latest snapshot</div>
          <div className="mt-1 font-semibold text-zinc-100">{formatTimestamp(snapshot?.snapshot_at)}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tiles.map((tile) => (
          <KpiTile key={tile.title} title={tile.title} value={tile.value} accent={tile.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        <OperationalPulsePanel
          title="Operational Pulse"
          description="A rolling control-tower signal for the four conversations visitors should immediately understand: order pressure, CPT exposure, labor flow, and facility capacity."
          seed={operationalPulse.seed}
          modeLabel={operationalPulse.modeLabel}
          modeSummary={operationalPulse.modeSummary}
        />

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Operational Brief</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Deterministic summary from the current executive snapshot. This is the same contract the agent will use later.
          </p>

          <div className="mt-5 space-y-3">
            {operationalBrief.map((entry, index) => (
              <div key={`brief-${index + 1}`} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4 text-sm text-zinc-200">
                {entry}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">CPT Risk Watchlist</h2>
            <p className="mt-1 text-sm text-zinc-400">{buildWatchlistHeading(riskOrders)}</p>
          </div>
          <div className="text-sm text-zinc-400">Source: `order_cpt_risk`</div>
        </div>

        {riskOrders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/30 p-6 text-sm text-zinc-400">
            No current watchlist data was returned. Verify `order_cpt_risk` has rows in `watch`, `risk`, or `missed`.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-300">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Window</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">CPT</th>
                  <th className="px-4 py-3 font-semibold">Time to CPT</th>
                </tr>
              </thead>
              <tbody>
                {riskOrders.map((order) => (
                  <tr key={order.order_id} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">{order.order_number ?? order.order_id}</div>
                      <div className="text-xs text-zinc-400">{order.status ?? 'Unknown status'}</div>
                    </td>
                    <td className="px-4 py-3">{order.cpt_window_label ?? 'Unmapped'}</td>
                    <td className="px-4 py-3">{lifecycleLabel(order.lifecycle_stage)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${riskTone(order.risk_bucket, order.is_deadlined)}`}>
                        {order.is_deadlined ? 'Deadlined' : lifecycleLabel(order.risk_bucket)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatTimestamp(order.cpt_at)}</td>
                    <td className="px-4 py-3">{formatMinutesToCpt(order.minutes_to_cpt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
