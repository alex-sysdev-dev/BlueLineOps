import Link from 'next/link'
import SignalPulseBoard from '@/components/dashboard/SignalPulseBoard'
import KpiTile from '@/components/kpi/KpiTile'
import { normalizeYardSpots, summarizeYard } from '@/lib/calculations/yms'
import { getYmsDashboardData } from '@/lib/queries/yms'

const CLOSED_ORDER_TOKENS = ['cancel', 'close', 'complete', 'ship', 'deliver']

function isClosedOrder(status: string | null | undefined): boolean {
  const value = status?.trim().toLowerCase()
  if (!value) {
    return false
  }

  return CLOSED_ORDER_TOKENS.some((token) => value.includes(token))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export default async function YmsOverviewPage() {
  const { yardSpots: yardSpotRows, warehouses, trailers, orders } = await getYmsDashboardData()
  const yardSpots = normalizeYardSpots(yardSpotRows)
  const summary = summarizeYard(yardSpots)
  const occupancyRate = summary.total > 0 ? Number(((summary.occupied / summary.total) * 100).toFixed(1)) : 0
  const availabilityRate = summary.total > 0 ? Number(((summary.available / summary.total) * 100).toFixed(1)) : 0
  const openOrders = orders.filter((order) => !isClosedOrder(order.status)).length
  const trailersInYard = trailers.filter((trailer) => Boolean(trailer.current_spot_id)).length
  const pressureRate = clamp(openOrders * 6, 8, 96)
  const reservationRate = summary.total > 0 ? Number((((summary.reserved + summary.blocked + summary.maintenance) / summary.total) * 100).toFixed(1)) : 0

  const zoneCounts = Array.from(
    yardSpots.reduce((map, spot) => {
      map.set(spot.zone, (map.get(spot.zone) ?? 0) + 1)
      return map
    }, new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-blue-500">YMS</span>{' '}
            <span className="text-[var(--foreground)]">Overview</span>
          </h1>
          <p className="text-zinc-400 mt-2">Live yard health, utilization, and spot availability.</p>
        </div>

        <Link
          href="/yms/yard"
          className="rounded-xl border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/20 transition-colors"
        >
          Open Yard View
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiTile title="Total Spots" value={summary.total} />
        <KpiTile title="Occupied Spots" value={summary.occupied} accent="text-red-200 group-hover:text-red-100" />
        <KpiTile title="Available Spots" value={summary.available} accent="text-emerald-200 group-hover:text-emerald-100" />
        <KpiTile title="Yard Occupancy" value={occupancyRate} suffix="%" accent="text-blue-100 group-hover:text-blue-50" />
        <KpiTile title="Warehouses" value={warehouses.length} accent="text-violet-100 group-hover:text-violet-50" />
        <KpiTile title="Trailers In Yard" value={trailersInYard} accent="text-cyan-100 group-hover:text-cyan-50" />
        <KpiTile title="Open Orders" value={openOrders} accent="text-amber-100 group-hover:text-amber-50" />
      </div>

      <SignalPulseBoard
        title="Yard Traffic Pulse"
        description="Continuous motion view of how spot occupancy, availability, trailer presence, and order pressure are interacting across the yard."
        summary="This live layer keeps the YMS page active between data refreshes so visitors see a traffic system, not a static yard inventory."
        signals={[
          {
            label: 'Occupancy Load',
            color: '#38bdf8',
            level: occupancyRate,
            displayValue: `${occupancyRate.toFixed(1)}%`,
            note: 'Occupied yard footprint relative to total spot capacity.',
          },
          {
            label: 'Available Buffer',
            color: '#34d399',
            level: availabilityRate,
            displayValue: `${availabilityRate.toFixed(1)}%`,
            note: 'Remaining space available for inbound, outbound, and flex positioning.',
          },
          {
            label: 'Trailer Presence',
            color: '#f59e0b',
            level: summary.total > 0 ? Number(((trailersInYard / summary.total) * 100).toFixed(1)) : 0,
            displayValue: `${trailersInYard}`,
            note: 'Trailers currently sitting in assigned yard spots.',
          },
          {
            label: 'Order Pressure',
            color: '#fb7185',
            level: pressureRate,
            displayValue: `${openOrders}`,
            note: 'Open order demand currently leaning on yard and dock activity.',
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Spot Status Snapshot</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3">
              <div className="text-zinc-400">Reserved</div>
              <div className="text-zinc-100 text-lg font-semibold">{summary.reserved}</div>
            </div>
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3">
              <div className="text-zinc-400">Blocked</div>
              <div className="text-zinc-100 text-lg font-semibold">{summary.blocked}</div>
            </div>
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3">
              <div className="text-zinc-400">Maintenance</div>
              <div className="text-zinc-100 text-lg font-semibold">{summary.maintenance}</div>
            </div>
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3">
              <div className="text-zinc-400">Unknown</div>
              <div className="text-zinc-100 text-lg font-semibold">{summary.unknown}</div>
            </div>
            <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/40 p-3 sm:col-span-2">
              <div className="text-zinc-400">Reserved / Blocked Pressure</div>
              <div className="text-zinc-100 text-lg font-semibold">{reservationRate.toFixed(1)}%</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Top Warehouses / Zones</h2>
          <div className="mt-4 space-y-3">
            {zoneCounts.length === 0 ? (
              <p className="text-sm text-zinc-400">No yard spots found in `yard_spots`.</p>
            ) : (
              zoneCounts.map(([zone, count]) => (
                <div key={zone} className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-900/40 px-3 py-2">
                  <span className="text-zinc-300">{zone}</span>
                  <span className="text-zinc-100 font-semibold">{count}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
