import type { NormalizedYardSpot, YardSpotRow, YardSpotStatus, YardSummary } from '@/types/yms'

const ROW_KEYS = ['row', 'row_index', 'y']
const COLUMN_KEYS = ['column', 'col', 'col_index', 'x']
const LABEL_KEYS = ['spot_label', 'spot_code', 'spot_name', 'label', 'name', 'spot_id', 'id']
const ZONE_KEYS = ['warehouse_name', 'zone', 'area', 'yard_section', 'type']
const STATUS_KEYS = ['status', 'state', 'availability']
const TRAILER_KEYS = ['trailer_number', 'trailer_id', 'trailer']
const UPDATED_KEYS = ['updated_at', 'last_updated']

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

function pickString(row: YardSpotRow, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return undefined
}

function normalizeStatus(row: YardSpotRow): YardSpotStatus {
  if (typeof row.occupied === 'boolean') {
    return row.occupied ? 'occupied' : 'available'
  }

  const rawStatus = pickString(row, STATUS_KEYS)?.toLowerCase()
  if (!rawStatus) {
    return 'unknown'
  }

  if (rawStatus.includes('avail') || rawStatus.includes('open') || rawStatus.includes('empty')) {
    return 'available'
  }

  if (rawStatus.includes('reserve') || rawStatus.includes('book')) {
    return 'reserved'
  }

  if (rawStatus.includes('block') || rawStatus.includes('hold')) {
    return 'blocked'
  }

  if (rawStatus.includes('maint') || rawStatus.includes('repair') || rawStatus.includes('down')) {
    return 'maintenance'
  }

  if (rawStatus.includes('occup') || rawStatus.includes('full') || rawStatus.includes('load')) {
    return 'occupied'
  }

  return 'unknown'
}

function normalizeSpotBase(row: YardSpotRow, index: number): Omit<NormalizedYardSpot, 'row' | 'column'> & {
  row?: number
  column?: number
} {
  const id = pickString(row, ['id', 'spot_id', 'spot_label', 'spot_code', 'name']) ?? `spot-${index + 1}`
  const label = pickString(row, LABEL_KEYS) ?? `Spot ${index + 1}`
  const zone = pickString(row, ZONE_KEYS) ?? 'General'
  const trailerId = pickString(row, TRAILER_KEYS)
  const updatedAt = pickString(row, UPDATED_KEYS)

  let rowValue: number | undefined
  let columnValue: number | undefined

  for (const key of ROW_KEYS) {
    rowValue = toNumber(row[key])
    if (rowValue !== undefined) {
      break
    }
  }

  for (const key of COLUMN_KEYS) {
    columnValue = toNumber(row[key])
    if (columnValue !== undefined) {
      break
    }
  }

  return {
    id,
    label,
    zone,
    status: normalizeStatus(row),
    row: rowValue,
    column: columnValue,
    trailerId,
    carrier: pickString(row, ['carrier']),
    updatedAt,
  }
}

export function normalizeYardSpots(rows: YardSpotRow[]): NormalizedYardSpot[] {
  const normalized = rows.map(normalizeSpotBase)
  const hasCoordinates = normalized.some((spot) => spot.row !== undefined && spot.column !== undefined)

  if (!hasCoordinates) {
    return normalized.map((spot, index) => ({
      ...spot,
      row: Math.floor(index / 8) + 1,
      column: (index % 8) + 1,
    }))
  }

  return normalized.map((spot, index) => ({
    ...spot,
    row: spot.row ?? Math.floor(index / 8) + 1,
    column: spot.column ?? (index % 8) + 1,
  }))
}

export function summarizeYard(spots: NormalizedYardSpot[]): YardSummary {
  return spots.reduce<YardSummary>(
    (summary, spot) => {
      summary.total += 1
      summary[spot.status] += 1
      return summary
    },
    {
      total: 0,
      occupied: 0,
      available: 0,
      reserved: 0,
      blocked: 0,
      maintenance: 0,
      unknown: 0,
    }
  )
}
