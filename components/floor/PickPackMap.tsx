import type { StationHeatCell } from '@/types/outbound'

type Props = {
  cells: StationHeatCell[]
  title?: string
  description?: string
}

function statusTone(status: StationHeatCell['status']): string {
  if (status === 'active') {
    return 'border-emerald-400/60 text-emerald-200'
  }
  if (status === 'idle') {
    return 'border-sky-400/60 text-sky-200'
  }
  if (status === 'blocked') {
    return 'border-rose-400/70 text-rose-200'
  }
  if (status === 'maintenance') {
    return 'border-amber-400/70 text-amber-200'
  }
  if (status === 'offline') {
    return 'border-zinc-500/70 text-zinc-300'
  }

  return 'border-zinc-600/70 text-zinc-300'
}

function heatOpacity(intensity: number): number {
  const clamped = Math.max(0, Math.min(100, intensity))
  return Number((0.18 + (clamped / 100) * 0.58).toFixed(2))
}

export default function PickPackMap({
  cells,
  title = "BlueLineOps Pick/Pack Floor",
  description = 'Station heat is based on utilization, queue depth, and active task assignments.',
}: Props) {
  if (cells.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(140deg,rgba(3,7,18,0.96),rgba(15,23,42,0.9))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        <p className="mt-3 text-sm text-zinc-400">No station rows found in `pick_pack_stations` yet.</p>
      </section>
    )
  }

  const rowCount = Math.max(...cells.map((cell) => cell.row), 1)
  const columnCount = Math.max(...cells.map((cell) => cell.column), 1)
  const byCoordinate = new Map(cells.map((cell) => [`${cell.row}-${cell.column}`, cell]))

  const gridCells = Array.from({ length: rowCount * columnCount }, (_, index) => {
    const row = Math.floor(index / columnCount) + 1
    const column = (index % columnCount) + 1
    return byCoordinate.get(`${row}-${column}`) ?? null
  })

  return (
    <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(15,23,42,0.86))] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span className="text-zinc-400">Heat</span>
          <div className="h-2 w-16 rounded-full bg-gradient-to-r from-sky-500/35 via-blue-500/55 to-red-500/75" />
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div
        className="mt-5 grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {gridCells.map((cell, index) => {
          if (!cell) {
            return (
              <div
                key={`empty-${index + 1}`}
                className="h-[108px] rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/25"
              />
            )
          }

          return (
            <article
              key={cell.id}
              className={`relative overflow-hidden rounded-xl border p-3 ${statusTone(cell.status)}`}
              style={{
                background: `linear-gradient(160deg, rgba(15,23,42,0.7), rgba(15,23,42,0.32)), rgba(59,130,246,${heatOpacity(cell.intensity)})`,
              }}
            >
              <div className="text-xs uppercase tracking-wide opacity-85">Station</div>
              <div className="text-lg font-semibold leading-tight">{cell.label}</div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-100/90">
                <span className="text-zinc-300">Load</span>
                <span className="text-right">{cell.load}</span>
                <span className="text-zinc-300">Util</span>
                <span className="text-right">{cell.utilization.toFixed(0)}%</span>
                <span className="text-zinc-300">Tasks</span>
                <span className="text-right">{cell.assignedTasks}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
