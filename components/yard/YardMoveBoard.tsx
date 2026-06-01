"use client"

import { useMemo, useState } from 'react'
import type { NormalizedYardSpot, OrderRow, TrailerRow } from '@/types/yms'

type MoveStatus = 'pending' | 'in_progress' | 'completed'

type YardMove = {
  id: string
  trailerId: string
  trailerNumber: string
  fromSpotId: string
  toSpotId: string
  driver: string
  status: MoveStatus
}

type Props = {
  spots: NormalizedYardSpot[]
  trailers: TrailerRow[]
  orders: OrderRow[]
  readOnly?: boolean
}

const DRIVERS = ['Shag 11 - R. Miles', 'Shag 14 - T. Nguyen', 'Shag 22 - M. Sloan', 'Shag 31 - J. Carter']

function statusTone(status: string): string {
  if (status === 'available') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
  if (status === 'occupied') return 'border-blue-400/40 bg-blue-500/15 text-blue-100'
  if (status === 'reserved') return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
  if (status === 'blocked') return 'border-rose-400/40 bg-rose-500/15 text-rose-100'
  return 'border-zinc-500/60 bg-zinc-700/35 text-zinc-100'
}

function labelize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function YardMoveBoard({ spots, trailers, orders, readOnly = false }: Props) {
  const openOrders = orders.filter((order) => {
    const status = order.status?.toLowerCase() ?? ''
    return !['cancel', 'close', 'complete', 'ship', 'deliver'].some((token) => status.includes(token))
  }).length
  const initialTrailerBySpot = useMemo(() => {
    const map = new Map<string, TrailerRow>()
    for (const trailer of trailers) {
      if (trailer.current_spot_id) {
        map.set(String(trailer.current_spot_id), trailer)
      }
    }
    return map
  }, [trailers])

  const [trailerBySpot, setTrailerBySpot] = useState(initialTrailerBySpot)
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [selectedTrailerId, setSelectedTrailerId] = useState<string>('')
  const [destinationSpotId, setDestinationSpotId] = useState<string>('')
  const [driver, setDriver] = useState(DRIVERS[0])
  const [moves, setMoves] = useState<YardMove[]>([])

  const selectedSpotTrailer = selectedSpotId ? trailerBySpot.get(selectedSpotId) : undefined
  const selectableTrailers = Array.from(trailerBySpot.values()).sort((a, b) => a.trailer_number.localeCompare(b.trailer_number))
  const selectedTrailer = selectableTrailers.find((trailer) => trailer.id === selectedTrailerId) ?? selectedSpotTrailer
  const trailerCurrentSpot = selectedTrailer
    ? Array.from(trailerBySpot.entries()).find(([, trailer]) => trailer.id === selectedTrailer.id)?.[0]
    : undefined

  const pendingMoves = moves.filter((move) => move.status === 'pending').length
  const inProgressMoves = moves.filter((move) => move.status === 'in_progress').length
  const completedMoves = moves.filter((move) => move.status === 'completed').length
  const occupiedSpots = spots.filter((spot) => trailerBySpot.has(spot.id)).length

  function chooseSpot(spotId: string) {
    if (selectedTrailer && trailerCurrentSpot && spotId !== trailerCurrentSpot && !trailerBySpot.has(spotId)) {
      setDestinationSpotId(spotId)
      return
    }

    setSelectedSpotId(spotId)
    const trailer = trailerBySpot.get(spotId)
    setSelectedTrailerId(trailer?.id ?? '')
    setDestinationSpotId('')
  }

  function createMove() {
    if (readOnly) {
      return
    }

    if (!selectedTrailer || !trailerCurrentSpot || !destinationSpotId) {
      return
    }

    const move: YardMove = {
      id: `MOVE-${String(moves.length + 1).padStart(3, '0')}`,
      trailerId: selectedTrailer.id,
      trailerNumber: selectedTrailer.trailer_number,
      fromSpotId: trailerCurrentSpot,
      toSpotId: destinationSpotId,
      driver,
      status: 'pending',
    }

    setMoves((current) => [move, ...current])
  }

  function advanceMove(move: YardMove) {
    if (readOnly) {
      return
    }

    if (move.status === 'completed') {
      return
    }

    const nextStatus: MoveStatus = move.status === 'pending' ? 'in_progress' : 'completed'
    setMoves((current) => current.map((entry) => (entry.id === move.id ? { ...entry, status: nextStatus } : entry)))

    if (nextStatus === 'completed') {
      setTrailerBySpot((current) => {
        const next = new Map(current)
        const trailer = next.get(move.fromSpotId)
        if (trailer) {
          next.delete(move.fromSpotId)
          next.set(move.toSpotId, { ...trailer, current_spot_id: move.toSpotId, status: 'occupied' })
        }
        return next
      })
      setSelectedSpotId(move.toSpotId)
      setSelectedTrailerId(move.trailerId)
      setDestinationSpotId('')
    }
  }

  return (
    <section className="ops-card rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.96),rgba(15,23,42,0.9))] p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold text-zinc-100">Interactive Yard Move Board</h2>
            <div className="text-sm text-zinc-400">
              {readOnly
                ? 'Review mode: yard spots are clickable for inspection; move creation is disabled.'
                : 'Click a dock door or yard spot, then choose a trailer and destination.'}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {spots.map((spot) => {
              const trailer = trailerBySpot.get(spot.id)
              const isSelected = selectedSpotId === spot.id
              const isDestination = destinationSpotId === spot.id
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => chooseSpot(spot.id)}
                  className={`min-h-24 rounded-xl border p-3 text-left transition hover:-translate-y-1 hover:border-blue-300/70 ${
                    isSelected || isDestination ? 'border-blue-300 bg-blue-500/20 text-blue-50' : statusTone(trailer ? 'occupied' : spot.status)
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.16em] opacity-80">{spot.zone}</div>
                  <div className="mt-1 font-semibold">{spot.label}</div>
                  <div className="mt-2 text-xs opacity-90">{trailer ? trailer.trailer_number : labelize(spot.status)}</div>
                  {trailer?.carrier ? <div className="mt-1 truncate text-xs opacity-80">{trailer.carrier}</div> : null}
                </button>
              )
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-zinc-700/70 bg-zinc-950/60 p-5">
          <h3 className="text-lg font-semibold text-zinc-100">Move Control</h3>
          {readOnly ? (
            <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              View-only users can inspect yard state but cannot create or advance moves.
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">
              Trailer
              <select
                value={selectedTrailer?.id ?? ''}
                onChange={(event) => setSelectedTrailerId(event.target.value)}
                disabled={readOnly}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-400"
              >
                <option value="">Choose trailer</option>
                {selectableTrailers.map((trailer) => (
                  <option key={trailer.id} value={trailer.id}>
                    {trailer.trailer_number} {trailer.carrier ? `- ${trailer.carrier}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              Destination
              <select
                value={destinationSpotId}
                onChange={(event) => setDestinationSpotId(event.target.value)}
                disabled={readOnly}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-400"
              >
                <option value="">Choose dock door or yard spot</option>
                {spots
                  .filter((spot) => !trailerBySpot.has(spot.id) && spot.status !== 'blocked' && spot.status !== 'maintenance')
                  .map((spot) => (
                    <option key={spot.id} value={spot.id}>
                      {spot.label} - {spot.zone}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              Shag Driver
              <select
                value={driver}
                onChange={(event) => setDriver(event.target.value)}
                disabled={readOnly}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-400"
              >
                {DRIVERS.map((driverName) => (
                  <option key={driverName} value={driverName}>
                    {driverName}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={createMove}
              disabled={readOnly || !selectedTrailer || !destinationSpotId}
              className="w-full rounded-lg border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {readOnly ? 'View Only' : 'Create Move'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {[
              ['Moves Made', moves.length],
              ['Trailers', trailers.length],
              ['Dock Doors', spots.filter((spot) => spot.zone.toLowerCase().includes('dock') || spot.label.toLowerCase().includes('door')).length],
              ['Yard Spots', spots.length],
              ['Pending Moves', pendingMoves],
              ['Completed Moves', completedMoves],
              ['In-Progress Moves', inProgressMoves],
              ['Occupied Spots', occupiedSpots],
              ['Open Orders', openOrders],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-3">
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="mt-1 text-lg font-semibold text-zinc-100">{value}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-700/70 bg-zinc-950/50 p-5">
        <h3 className="text-lg font-semibold text-zinc-100">Move Queue</h3>
        {moves.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/35 p-4 text-sm text-zinc-400">
            No moves created in this session.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-300">
                  <th className="px-3 py-2 font-semibold">Move</th>
                  <th className="px-3 py-2 font-semibold">Trailer</th>
                  <th className="px-3 py-2 font-semibold">From</th>
                  <th className="px-3 py-2 font-semibold">To</th>
                  <th className="px-3 py-2 font-semibold">Driver</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((move) => (
                  <tr key={move.id} className="border-b border-white/5 text-zinc-200">
                    <td className="px-3 py-2">{move.id}</td>
                    <td className="px-3 py-2">{move.trailerNumber}</td>
                    <td className="px-3 py-2">{spots.find((spot) => spot.id === move.fromSpotId)?.label ?? move.fromSpotId}</td>
                    <td className="px-3 py-2">{spots.find((spot) => spot.id === move.toSpotId)?.label ?? move.toSpotId}</td>
                    <td className="px-3 py-2">{move.driver}</td>
                    <td className="px-3 py-2">{labelize(move.status)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => advanceMove(move)}
                        disabled={readOnly || move.status === 'completed'}
                        className="rounded-lg border border-zinc-600/70 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-40"
                      >
                        {move.status === 'pending' ? 'Start' : move.status === 'in_progress' ? 'Complete' : 'Done'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
