import KpiTile from '@/components/kpi/KpiTile'
import PickPackMap from '@/components/floor/PickPackMap'
import { buildStationHeatmap, calculateOutboundFloorKpis } from '@/lib/calculations/outbound'
import { getOutboundFloorData } from '@/lib/queries/outbound'
import type {
  InboundQueueState,
  InventoryRisk,
  PackStationStatus,
  PickTaskStatus,
} from '@/types/outbound'
import type { QaResult } from '@/types/qa'

type Props = {
  heading: string
  subheading: string
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) {
    return '-'
  }

  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) {
    return '-'
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function taskStatusBadge(status: PickTaskStatus): string {
  if (status === 'blocked') {
    return 'bg-rose-500/20 text-rose-200 border-rose-400/40'
  }
  if (status === 'picking') {
    return 'bg-blue-500/20 text-blue-200 border-blue-400/40'
  }
  if (status === 'queued') {
    return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
  }
  if (status === 'packed') {
    return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
  }
  if (status === 'completed') {
    return 'bg-zinc-500/20 text-zinc-200 border-zinc-400/40'
  }

  return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
}

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

function inventoryRiskBadge(risk: InventoryRisk): string {
  if (risk === 'critical') {
    return 'bg-rose-500/20 text-rose-200 border-rose-400/40'
  }
  if (risk === 'watch') {
    return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
  }

  return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
}

function qaResultBadge(result: QaResult): string {
  if (result === 'fail') {
    return 'bg-rose-500/20 text-rose-200 border-rose-400/40'
  }
  if (result === 'pass') {
    return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
  }
  if (result === 'pending') {
    return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
  }

  return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
}

function queueStateBadge(state: InboundQueueState): string {
  if (state === 'blocked') {
    return 'bg-rose-500/20 text-rose-200 border-rose-400/40'
  }
  if (state === 'qa_pending') {
    return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
  }
  if (state === 'released') {
    return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
  }
  if (state === 'arrived' || state === 'received') {
    return 'bg-sky-500/20 text-sky-200 border-sky-400/40'
  }

  return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
}

function capLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function PickPackControlTower({ heading, subheading }: Props) {
  const data = await getOutboundFloorData()
  const kpis = calculateOutboundFloorKpis(data)
  const heatCells = buildStationHeatmap(data.stations, data.tasks)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-blue-500">Outbound</span>{' '}
          <span className="text-[var(--foreground)]">{heading}</span>
        </h1>
        <p className="text-zinc-400">{subheading}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiTile title="Open Pick Tasks" value={kpis.openTasks} />
        <KpiTile title="Late Tasks" value={kpis.lateTasks} accent="text-rose-100 group-hover:text-rose-50" />
        <KpiTile title="Units Remaining" value={kpis.unitsRemaining} accent="text-amber-100 group-hover:text-amber-50" />
        <KpiTile title="Active Stations" value={kpis.activeStations} accent="text-emerald-100 group-hover:text-emerald-50" />
        <KpiTile title="Avg Utilization" value={kpis.avgUtilization} suffix="%" accent="text-cyan-100 group-hover:text-cyan-50" />
        <KpiTile title="Inventory Risk SKUs" value={kpis.inventoryRisk} accent="text-orange-100 group-hover:text-orange-50" />
        <KpiTile title="Inbound QA Pending" value={kpis.qaPending} accent="text-yellow-100 group-hover:text-yellow-50" />
        <KpiTile title="Inbound QA Blocked" value={kpis.qaBlocked} accent="text-rose-100 group-hover:text-rose-50" />
      </div>

      <PickPackMap cells={heatCells} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Outbound Task Board</h2>
          <p className="mt-1 text-sm text-zinc-400">Source: `pick_tasks`</p>

          {data.tasks.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No rows found in `pick_tasks`.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-300">
                    <th className="px-3 py-2 font-semibold">Task</th>
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold">Zone</th>
                    <th className="px-3 py-2 font-semibold">Station</th>
                    <th className="px-3 py-2 font-semibold">Remaining</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks.slice(0, 24).map((task) => (
                    <tr key={task.id} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                      <td className="px-3 py-2">
                        <div className="font-medium text-zinc-100">{task.taskNumber}</div>
                        <div className="text-xs text-zinc-400">P{task.priority}</div>
                      </td>
                      <td className="px-3 py-2">{task.sku}</td>
                      <td className="px-3 py-2">{task.zone}</td>
                      <td className="px-3 py-2">{task.assignedStation ?? '-'}</td>
                      <td className="px-3 py-2">{task.remainingQty}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${taskStatusBadge(task.status)}`}>
                          {capLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">{formatDateTime(task.dueAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Pack Station Board</h2>
          <p className="mt-1 text-sm text-zinc-400">Source: `pick_pack_stations`</p>

          {data.stations.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No rows found in `pick_pack_stations`.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.stations.slice(0, 20).map((station) => (
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
                    <span className="text-zinc-400">Active Task</span>
                    <span className="text-right text-zinc-200">{station.activeTaskNumber ?? '-'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Inventory View</h2>
          <p className="mt-1 text-sm text-zinc-400">Source: `inventory`</p>

          {data.inventory.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No rows found in `inventory`.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-300">
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold">Location</th>
                    <th className="px-3 py-2 font-semibold">Available</th>
                    <th className="px-3 py-2 font-semibold">Reserved</th>
                    <th className="px-3 py-2 font-semibold">Net</th>
                    <th className="px-3 py-2 font-semibold">ROP</th>
                    <th className="px-3 py-2 font-semibold">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventory.slice(0, 28).map((item) => (
                    <tr key={item.id} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                      <td className="px-3 py-2">{item.sku}</td>
                      <td className="px-3 py-2">{item.location}</td>
                      <td className="px-3 py-2">{item.availableQty}</td>
                      <td className="px-3 py-2">{item.reservedQty}</td>
                      <td className="px-3 py-2 font-medium">{item.netQty}</td>
                      <td className="px-3 py-2">{item.reorderPoint}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${inventoryRiskBadge(item.risk)}`}>
                          {capLabel(item.risk)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Inbound / QA Queue</h2>
          <p className="mt-1 text-sm text-zinc-400">Sources: `inbound_shipments`, `inbound_items`, `qa_inspections`</p>

          {data.inboundQaQueue.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No joined inbound/QA queue rows found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-300">
                    <th className="px-3 py-2 font-semibold">Shipment</th>
                    <th className="px-3 py-2 font-semibold">Supplier</th>
                    <th className="px-3 py-2 font-semibold">SKU</th>
                    <th className="px-3 py-2 font-semibold">Qty</th>
                    <th className="px-3 py-2 font-semibold">ETA</th>
                    <th className="px-3 py-2 font-semibold">QA</th>
                    <th className="px-3 py-2 font-semibold">Queue State</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inboundQaQueue.slice(0, 24).map((entry) => (
                    <tr key={entry.id} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                      <td className="px-3 py-2">{entry.shipmentId}</td>
                      <td className="px-3 py-2">{entry.supplier}</td>
                      <td className="px-3 py-2">{entry.productId}</td>
                      <td className="px-3 py-2">
                        {entry.receivedQty}/{entry.expectedQty}
                      </td>
                      <td className="px-3 py-2">{formatDate(entry.eta)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${qaResultBadge(entry.qaResult)}`}>
                          {capLabel(entry.qaResult)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${queueStateBadge(entry.queueState)}`}>
                          {capLabel(entry.queueState)}
                        </span>
                      </td>
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
