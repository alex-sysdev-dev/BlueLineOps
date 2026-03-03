import Link from 'next/link'
import KpiTile from '@/components/kpi/KpiTile'
import { normalizeYardSpots, summarizeYard } from '@/lib/calculations/yms'
import { getYardSpots } from '@/lib/queries/yms'

export default async function YmsOverviewPage() {
  const yardSpots = normalizeYardSpots(await getYardSpots())
  const summary = summarizeYard(yardSpots)
  const occupancyRate = summary.total > 0 ? Number(((summary.occupied / summary.total) * 100).toFixed(1)) : 0

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
          <h1 className="text-3xl font-semibold tracking-tight">YMS Overview</h1>
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
      </div>

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
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Top Zones</h2>
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
