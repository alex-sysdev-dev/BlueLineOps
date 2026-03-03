import Link from 'next/link'
import KpiTile from '@/components/kpi/KpiTile'
import type { NormalizedYardSpot, YardSpotStatus } from '@/types/yms'
import { normalizeYardSpots, summarizeYard } from '@/lib/calculations/yms'
import { getYardSpots } from '@/lib/queries/yms'

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

export default async function YmsYardPage() {
  const yardSpots = normalizeYardSpots(await getYardSpots()).sort(sortByGridPosition)
  const summary = summarizeYard(yardSpots)

  const maxColumn = Math.max(...yardSpots.map((spot) => spot.column), 8)
  const maxRow = Math.max(...yardSpots.map((spot) => spot.row), 1)
  const columnCount = Math.min(Math.max(maxColumn, 8), 12)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">YMS Yard</h1>
          <p className="text-zinc-400 mt-2">Bird&apos;s-eye yard layout generated from `yard_spots`.</p>
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
      </div>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.96),rgba(15,23,42,0.9))] p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-zinc-100">Yard Layout</h2>
          <div className="text-sm text-zinc-400">Rows: {maxRow} | Columns: {columnCount}</div>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/70 p-4">
          {yardSpots.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-zinc-400">
              No rows found in `yard_spots`.
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              }}
            >
              {yardSpots.map((spot) => (
                <article
                  key={spot.id}
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
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.96),rgba(15,23,42,0.9))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100">Spot Details</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-zinc-300 border-b border-white/10">
                <th className="px-4 py-3 font-semibold">Spot</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Trailer</th>
                <th className="px-4 py-3 font-semibold">Carrier</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {yardSpots.map((spot) => (
                <tr key={`${spot.id}-table`} className="border-b border-white/5 text-zinc-200 hover:bg-white/5">
                  <td className="px-4 py-3">{spot.label}</td>
                  <td className="px-4 py-3">{spot.zone}</td>
                  <td className="px-4 py-3">{statusLabel(spot.status)}</td>
                  <td className="px-4 py-3">{spot.trailerId ?? 'N/A'}</td>
                  <td className="px-4 py-3">{spot.carrier ?? 'N/A'}</td>
                  <td className="px-4 py-3">{formatDate(spot.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
