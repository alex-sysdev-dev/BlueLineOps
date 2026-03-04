import Link from 'next/link'
import KpiTile from '@/components/kpi/KpiTile'
import type { NormalizedYardSpot, YardSpotStatus } from '@/types/yms'
import { normalizeYardSpots, summarizeYard } from '@/lib/calculations/yms'
import { getYmsDashboardData } from '@/lib/queries/yms'

type DockGroupKey = 'outbound' | 'inbound' | 'open' | 'flex'

const CLOSED_ORDER_TOKENS = ['cancel', 'close', 'complete', 'ship', 'deliver']
const DOCK_GROUP_ORDER: DockGroupKey[] = ['outbound', 'inbound', 'open', 'flex']
const DOCK_GROUP_LABEL: Record<DockGroupKey, string> = {
  outbound: 'Outbound',
  inbound: 'Inbound',
  open: 'Open',
  flex: 'Flex',
}

function isClosedOrder(status: string | null | undefined): boolean {
  const value = status?.trim().toLowerCase()
  if (!value) {
    return false
  }

  return CLOSED_ORDER_TOKENS.some((token) => value.includes(token))
}

function statusStyle(status: YardSpotStatus): string {
  switch (status) {
    case 'available':
      return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
    case 'occupied':
      return 'border-rose-400/40 bg-rose-500/15 text-rose-100'
    case 'reserved':
      return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
    case 'blocked':
      return 'border-zinc-500/60 bg-zinc-600/20 text-zinc-100'
    case 'maintenance':
      return 'border-orange-500/50 bg-orange-500/15 text-orange-100'
    default:
      return 'border-sky-400/40 bg-sky-500/10 text-sky-100'
  }
}

function statusLabel(status: YardSpotStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatDate(value?: string): string {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

function sortByGridPosition(a: NormalizedYardSpot, b: NormalizedYardSpot): number {
  if (a.row === b.row) {
    return a.column - b.column
  }

  return a.row - b.row
}

function normalizeDockGroup(type: string | null | undefined): DockGroupKey {
  const value = type?.trim().toLowerCase()
  if (!value) {
    return 'open'
  }

  if (value.includes('outbound') || value.includes('ship')) {
    return 'outbound'
  }

  if (value.includes('inbound') || value.includes('receiv') || value.includes('unload')) {
    return 'inbound'
  }

  if (value.includes('flex')) {
    return 'flex'
  }

  if (value.includes('open') || value.includes('yard')) {
    return 'open'
  }

  return 'open'
}

export default async function YmsYardPage() {
  const { yardSpots: yardSpotRows, orders } = await getYmsDashboardData()
  const yardSpots = normalizeYardSpots(yardSpotRows).sort(sortByGridPosition)
  const summary = summarizeYard(yardSpots)
  const openOrders = orders.filter((order) => !isClosedOrder(order.status)).length

  const spotMetaById = new Map(
    yardSpotRows.map((spot) => [
      String(spot.id ?? ''),
      {
        activeOrders: typeof spot.active_orders === 'number' ? spot.active_orders : 0,
      },
    ])
  )
  const dockTypeBySpotId = new Map(yardSpotRows.map((spot) => [String(spot.id ?? ''), spot.type ?? null]))

  const groupedSpots = DOCK_GROUP_ORDER.map((dockGroup) => ({
    dockGroup,
    spots: yardSpots.filter((spot) => normalizeDockGroup(dockTypeBySpotId.get(spot.id)) === dockGroup),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-blue-500">YMS</span>{' '}
            <span className="text-[var(--foreground)]">Yard</span>
          </h1>
        </div>

        <Link
          href="/yms"
          className="rounded-xl border border-zinc-600/70 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700/70 transition-colors"
        >
          Back to Overview
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiTile title="Total" value={summary.total} />
        <KpiTile title="Occupied" value={summary.occupied} accent="text-rose-100 group-hover:text-rose-50" />
        <KpiTile title="Available" value={summary.available} accent="text-emerald-100 group-hover:text-emerald-50" />
        <KpiTile title="Reserved" value={summary.reserved} accent="text-amber-100 group-hover:text-amber-50" />
        <KpiTile title="Blocked" value={summary.blocked} accent="text-zinc-100 group-hover:text-zinc-50" />
        <KpiTile title="Maintenance" value={summary.maintenance} accent="text-orange-100 group-hover:text-orange-50" />
        <KpiTile title="Unknown" value={summary.unknown} accent="text-sky-100 group-hover:text-sky-50" />
        <KpiTile title="Open Orders" value={openOrders} accent="text-amber-100 group-hover:text-amber-50" />
      </div>

      {groupedSpots.map(({ dockGroup, spots }) => {
        const title = DOCK_GROUP_LABEL[dockGroup]
        const groupSummary = summarizeYard(spots)
        const maxColumn = Math.max(...spots.map((spot) => spot.column), 4)
        const maxRow = Math.max(...spots.map((spot) => spot.row), 1)
        const columnCount = Math.min(Math.max(maxColumn, 4), 12)

        return (
          <div key={dockGroup} className="space-y-4">
            <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.96),rgba(15,23,42,0.9))] p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-100">{title} Yard Layout</h2>
                <div className="text-sm text-zinc-400">
                  Rows: {maxRow} | Columns: {columnCount} | Spots: {groupSummary.total}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
                {spots.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-zinc-400">
                    No {title.toLowerCase()} docks found in `yard_spots`.
                  </div>
                ) : (
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {spots.map((spot) => (
                      <article
                        key={`${dockGroup}-${spot.id}`}
                        className={`min-h-20 rounded-lg border p-3 shadow-sm ${statusStyle(spot.status)}`}
                        style={{
                          gridColumnStart: Math.max(spot.column, 1),
                          gridRowStart: Math.max(spot.row, 1),
                        }}
                      >
                        <div className="text-[11px] uppercase tracking-wide opacity-80">{spot.zone}</div>
                        <div className="text-sm font-semibold mt-1">{spot.label}</div>
                        <div className="text-xs mt-1 opacity-90">{statusLabel(spot.status)}</div>
                        {spot.trailerId ? (
                          <div className="text-[11px] mt-2 opacity-85">Trailer: {spot.trailerId}</div>
                        ) : null}
                        {(spotMetaById.get(spot.id)?.activeOrders ?? 0) > 0 ? (
                          <div className="text-[11px] mt-1 opacity-85">Open Orders: {spotMetaById.get(spot.id)?.activeOrders}</div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.96),rgba(15,23,42,0.9))] p-6">
              <h3 className="text-xl font-semibold text-zinc-100">{title} Dock Details</h3>
              <div className="mt-4 overflow-x-auto">
                {spots.length === 0 ? (
                  <div className="text-sm text-zinc-400">No {title.toLowerCase()} dock details available.</div>
                ) : (
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-zinc-300 border-b border-white/10">
                        <th className="px-4 py-3 font-semibold">Dock</th>
                        <th className="px-4 py-3 font-semibold">Zone</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Trailer</th>
                        <th className="px-4 py-3 font-semibold">Open Orders</th>
                        <th className="px-4 py-3 font-semibold">Carrier</th>
                        <th className="px-4 py-3 font-semibold">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spots.map((spot) => (
                        <tr key={`${dockGroup}-${spot.id}-table`} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                          <td className="px-4 py-3">{spot.label}</td>
                          <td className="px-4 py-3">{spot.zone}</td>
                          <td className="px-4 py-3">{statusLabel(spot.status)}</td>
                          <td className="px-4 py-3">{spot.trailerId ?? 'N/A'}</td>
                          <td className="px-4 py-3">{spotMetaById.get(spot.id)?.activeOrders ?? 0}</td>
                          <td className="px-4 py-3">{spot.carrier ?? 'N/A'}</td>
                          <td className="px-4 py-3">{formatDate(spot.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )
      })}
    </div>
  )
}
