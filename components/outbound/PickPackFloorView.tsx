import KpiTile from '@/components/kpi/KpiTile'
import PickPackFloorPlan from '@/components/outbound/PickPackFloorPlan'
import PickPackMap from '@/components/floor/PickPackMap'
import {
  buildPickStationBoard,
  buildStationHeatmap,
  calculateOutboundFloorKpis,
  calculateThroughputUph,
} from '@/lib/calculations/outbound'
import { getOutboundFloorData } from '@/lib/queries/outbound'
import { getFacilityLayoutData } from '@/lib/queries/layouts'
import type { PackStationStatus } from '@/types/outbound'

function stationStatusBadge(status: PackStationStatus): string {
  if (status === 'active') {
    return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
  }
  if (status === 'idle') {
    return 'bg-sky-500/20 text-sky-200 border-sky-400/40'
  }
  if (status === 'blocked') {
    return 'bg-rose-500/20 text-rose-200 border-rose-400/40'
  }
  if (status === 'maintenance') {
    return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
  }
  if (status === 'offline') {
    return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
  }

  return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
}

function capLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function PickPackFloorView() {
  const [data, layoutData] = await Promise.all([
    getOutboundFloorData(),
    getFacilityLayoutData('pick_pack_main'),
  ])
  const floorKpis = calculateOutboundFloorKpis(data)
  const throughputUph = calculateThroughputUph(data.tasks)
  const heatCells = buildStationHeatmap(data.stations, data.tasks)
  const pickStations = buildPickStationBoard(data.tasks, 20)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-blue-500">Pick/Pack</span>{' '}
          <span className="text-[var(--foreground)]">Floor</span>
        </h1>
        <p className="text-zinc-400">Live floor-level visibility for pick and pack stations with branded bird&apos;s-eye heat mapping.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <KpiTile title="Throughput (UPH)" value={throughputUph} accent="text-cyan-100 group-hover:text-cyan-50" />
        <KpiTile title="Open Pick Tasks" value={floorKpis.openTasks} />
        <KpiTile title="Late Tasks" value={floorKpis.lateTasks} accent="text-rose-100 group-hover:text-rose-50" />
        <KpiTile title="Active Stations" value={floorKpis.activeStations} accent="text-emerald-100 group-hover:text-emerald-50" />
        <KpiTile title="Avg. Utilization" value={floorKpis.avgUtilization} suffix="%" accent="text-blue-100 group-hover:text-blue-50" />
      </div>

      {layoutData.layout && layoutData.items.length > 0 ? (
        <PickPackFloorPlan layoutData={layoutData} data={data} />
      ) : (
        <PickPackMap
          cells={heatCells}
          title="BlueLineOps Pick/Pack Floor"
          description="Bird's-eye floor heat map for pack-station load balancing and live execution control."
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Pack Station Board</h2>
          <p className="mt-1 text-sm text-zinc-400">Source: `pick_pack_stations`</p>

          {data.stations.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No rows found in `pick_pack_stations`.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.stations.slice(0, 24).map((station) => (
                <article key={station.id} className="rounded-xl border border-zinc-700/70 bg-zinc-900/45 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-zinc-100">{station.label}</h3>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${stationStatusBadge(station.status)}`}>
                      {capLabel(station.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-zinc-400">Operator</span>
                    <span className="text-right text-zinc-200">{station.operator ?? 'Unassigned'}</span>
                    <span className="text-zinc-400">Queue Depth</span>
                    <span className="text-right text-zinc-200">{station.queueDepth}</span>
                    <span className="text-zinc-400">Utilization</span>
                    <span className="text-right text-zinc-200">{station.utilization.toFixed(0)}%</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Pick Station Board</h2>
          <p className="mt-1 text-sm text-zinc-400">Derived from `pick_tasks` station/zone assignments.</p>

          {pickStations.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No open pick station workloads found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-300">
                    <th className="px-3 py-2 font-semibold">Pick Station</th>
                    <th className="px-3 py-2 font-semibold">Zone</th>
                    <th className="px-3 py-2 font-semibold">Open Tasks</th>
                    <th className="px-3 py-2 font-semibold">Units Remaining</th>
                    <th className="px-3 py-2 font-semibold">Avg Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {pickStations.map((station) => (
                    <tr key={station.station} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                      <td className="px-3 py-2">{station.station}</td>
                      <td className="px-3 py-2">{station.zone}</td>
                      <td className="px-3 py-2">{station.openTasks}</td>
                      <td className="px-3 py-2">{station.unitsRemaining}</td>
                      <td className="px-3 py-2">{station.avgPriority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
