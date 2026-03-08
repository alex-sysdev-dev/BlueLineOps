import FacilityLayoutCanvas from '@/components/facility/FacilityLayoutCanvas'
import type { FacilityLayoutData, FacilityLayoutItem } from '@/types/layout'
import type { YardSpotRow } from '@/types/yms'

type Props = {
  layoutData: FacilityLayoutData
  yardSpots: YardSpotRow[]
}

type YardBucket = {
  total: number
  occupied: number
  available: number
  reserved: number
}

function zoneTone(itemType: string): string {
  switch (itemType) {
    case 'building':
      return 'border-zinc-500 bg-zinc-100 text-zinc-900'
    case 'dock_group':
      return 'border-slate-700 bg-slate-600 text-white'
    case 'flex_group':
      return 'border-yellow-700 bg-yellow-200 text-zinc-900'
    case 'trailer_group':
      return 'border-emerald-800 bg-emerald-200 text-zinc-900'
    case 'drive_lane':
      return 'border-zinc-600 bg-zinc-600 text-white'
    case 'gate':
      return 'border-zinc-700 bg-zinc-900 text-zinc-100'
    default:
      return 'border-zinc-500 bg-zinc-200 text-zinc-900'
  }
}

function classifySpot(row: YardSpotRow): string {
  const raw = `${row.type ?? ''} ${row.zone ?? ''} ${row.yard_section ?? ''} ${row.label ?? ''}`.toLowerCase()

  if (raw.includes('flex')) {
    return 'flex'
  }
  if (raw.includes('outbound') || raw.includes('ship')) {
    return 'outbound'
  }
  if (raw.includes('inbound') || raw.includes('receiv') || raw.includes('unload')) {
    return 'inbound'
  }

  return 'trailer'
}

function bucketForItem(itemCode: string, yardSpots: YardSpotRow[]): YardBucket {
  const relevant = spotsForItem(itemCode, yardSpots)

  return relevant.reduce<YardBucket>(
    (summary, spot) => {
      summary.total += 1
      const status = String(spot.status ?? 'unknown').toLowerCase()
      if (status.includes('occup')) {
        summary.occupied += 1
      } else if (status.includes('avail')) {
        summary.available += 1
      } else if (status.includes('reserv')) {
        summary.reserved += 1
      }
      return summary
    },
    { total: 0, occupied: 0, available: 0, reserved: 0 }
  )
}

function spotsForItem(itemCode: string, yardSpots: YardSpotRow[]): YardSpotRow[] {
  const classified = yardSpots
    .map((spot) => ({ spot, group: classifySpot(spot) }))
    .sort((a, b) => String(a.spot.label ?? '').localeCompare(String(b.spot.label ?? '')))

  let relevant: YardSpotRow[] = []

  if (itemCode.includes('outbound_doors')) {
    const outbound = classified.filter((entry) => entry.group === 'outbound').map((entry) => entry.spot)
    const midpoint = Math.ceil(outbound.length / 2)
    relevant = itemCode.endsWith('_west') ? outbound.slice(0, midpoint) : outbound.slice(midpoint)
  } else if (itemCode.includes('inbound_doors')) {
    const inbound = classified.filter((entry) => entry.group === 'inbound').map((entry) => entry.spot)
    const midpoint = Math.ceil(inbound.length / 2)
    relevant = itemCode.endsWith('_west') ? inbound.slice(0, midpoint) : inbound.slice(midpoint)
  } else if (itemCode.includes('flex_doors')) {
    relevant = classified.filter((entry) => entry.group === 'flex').map((entry) => entry.spot)
  } else if (itemCode.includes('trailer_row')) {
    const trailers = classified.filter((entry) => entry.group === 'trailer').map((entry) => entry.spot)
    const sliceSize = Math.max(1, Math.ceil(trailers.length / 6))
    const groups = [
      trailers.slice(0, sliceSize),
      trailers.slice(sliceSize, sliceSize * 2),
      trailers.slice(sliceSize * 2, sliceSize * 3),
      trailers.slice(sliceSize * 3, sliceSize * 4),
      trailers.slice(sliceSize * 4, sliceSize * 5),
      trailers.slice(sliceSize * 5),
    ]
    if (itemCode.endsWith('north_west')) relevant = groups[0]
    else if (itemCode.endsWith('north_east')) relevant = groups[1]
    else if (itemCode.endsWith('south_west')) relevant = groups[2]
    else if (itemCode.endsWith('south_east')) relevant = groups[3]
    else if (itemCode.endsWith('lower_west')) relevant = groups[4]
    else relevant = groups[5]
  }

  return relevant
}

function itemStats(item: FacilityLayoutItem, yardSpots: YardSpotRow[]): { line1?: string; line2?: string } {
  switch (item.item_type) {
    case 'dock_group':
    case 'flex_group':
    case 'trailer_group': {
      const bucket = bucketForItem(item.item_code, yardSpots)
      return {
        line1: `${bucket.occupied}/${bucket.total} occupied`,
        line2: `${bucket.available} available | ${bucket.reserved} reserved`,
      }
    }
    case 'building':
      return {
        line1: '250,000 sq. ft.',
        line2: 'Main warehouse',
      }
    default:
      return {}
  }
}

function compactSpotLabel(itemCode: string, spot: YardSpotRow, index: number): string {
  const raw = String(spot.label ?? spot.spot_label ?? index + 1)
  const digitMatch = raw.match(/\d+/)

  if (itemCode.includes('outbound_doors')) {
    return `OD-${digitMatch?.[0] ?? index + 1}`
  }

  if (itemCode.includes('inbound_doors')) {
    return `ID-${digitMatch?.[0] ?? index + 1}`
  }

  if (itemCode.includes('flex_doors')) {
    return `FX-${digitMatch?.[0] ?? index + 1}`
  }

  if (itemCode.includes('trailer_row')) {
    return `TR-${digitMatch?.[0] ?? index + 1}`
  }

  if (raw.length <= 5) {
    return raw
  }

  const match = raw.match(/[A-Za-z]+[- ]?\d+/)
  if (match) {
    return match[0].replace(' ', '-')
  }

  return raw.slice(-4)
}

export default function YardLayoutPlan({ layoutData, yardSpots }: Props) {
  if (!layoutData.layout || layoutData.items.length === 0) {
    return null
  }

  return (
    <FacilityLayoutCanvas
      layout={layoutData.layout}
      items={layoutData.items}
      title="BlueLineOps Yard Layout"
      description="Layout-driven yard plan with live occupancy overlays across dock bands, flex positions, and trailer parking rows."
      renderItem={(item) => {
        const stats = itemStats(item, yardSpots)
        const tone = zoneTone(item.item_type)
        const minimal = ['drive_lane'].includes(item.item_type)
        const maxVisibleSpots = item.item_type === 'trailer_group' ? 7 : item.item_type === 'dock_group' ? 8 : 4
        const allRelatedSpots = spotsForItem(item.item_code, yardSpots)
        const relatedSpots = allRelatedSpots.slice(0, maxVisibleSpots)
        const overflowCount = Math.max(0, allRelatedSpots.length - relatedSpots.length)

        return (
          <article className={`flex h-full w-full min-h-0 flex-col overflow-hidden rounded-md border px-2 py-1 ${tone} ${minimal ? 'justify-center' : 'justify-between'} shadow-sm`}>
            <div className={`font-semibold leading-tight ${minimal ? 'text-center text-[8px] sm:text-[10px]' : 'text-[9px] sm:text-[10px] md:text-xs'}`}>
              {item.item_label.replaceAll('_', ' ')}
            </div>
            {!minimal && (stats.line1 || stats.line2) ? (
              <div className="mt-1 space-y-0.5 text-[8px] font-medium opacity-90 sm:text-[10px]">
                {stats.line1 ? <div>{stats.line1}</div> : null}
                {stats.line2 ? <div>{stats.line2}</div> : null}
              </div>
            ) : null}

            {!minimal && relatedSpots.length > 0 ? (
              <div className="mt-1 grid grid-cols-8 gap-1">
                {relatedSpots.map((spot, index) => {
                  const status = String(spot.status ?? 'unknown').toLowerCase()
                  const chipTone =
                    status.includes('occup')
                      ? 'border-rose-400/40 bg-rose-500/25 text-rose-50'
                      : status.includes('avail')
                        ? 'border-emerald-400/40 bg-emerald-500/25 text-emerald-50'
                        : status.includes('reserv')
                          ? 'border-amber-400/40 bg-amber-500/25 text-amber-50'
                          : 'border-zinc-400/40 bg-zinc-700/30 text-zinc-50'

                  return (
                    <div
                      key={`${item.item_code}-${String(spot.id ?? index)}`}
                      className={`rounded border px-1 py-0.5 text-center text-[7px] font-semibold leading-tight ${chipTone}`}
                      title={`${String(spot.label ?? spot.spot_label ?? spot.id ?? index + 1)} | ${status}`}
                    >
                      {compactSpotLabel(item.item_code, spot, index)}
                    </div>
                  )
                })}
                {overflowCount > 0 ? (
                  <div className="rounded border border-zinc-400/40 bg-zinc-700/30 px-1 py-0.5 text-center text-[7px] font-semibold leading-tight text-zinc-50">
                    +{overflowCount}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        )
      }}
    />
  )
}
