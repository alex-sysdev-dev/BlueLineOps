import type { InboundItem, Shipment, ShipmentStatus } from '@/types/inbound'

const STATUS_ORDER: ShipmentStatus[] = ['scheduled', 'arrived', 'received']

function toDayKey(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function toDayLabel(key: string): string {
  const date = new Date(`${key}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildDayWindow(days: number, latestKey: string | null): string[] {
  const todayKey = new Date().toISOString().slice(0, 10)
  const anchorKey = latestKey && latestKey > todayKey ? latestKey : latestKey ?? todayKey
  const anchorDate = new Date(`${anchorKey}T00:00:00`)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(anchorDate)
    date.setDate(anchorDate.getDate() - (days - 1 - index))
    return date.toISOString().slice(0, 10)
  })
}

export function buildInboundStatusTrend(shipments: Shipment[], days = 10): {
  labels: string[]
  scheduled: number[]
  arrived: number[]
  received: number[]
} {
  const byDay = new Map<string, Record<ShipmentStatus, number>>()

  for (const shipment of shipments) {
    const dayKey = toDayKey(shipment.eta)
    if (!dayKey) {
      continue
    }

    const bucket = byDay.get(dayKey) ?? { scheduled: 0, arrived: 0, received: 0 }
    if (STATUS_ORDER.includes(shipment.status)) {
      bucket[shipment.status] += 1
    }
    byDay.set(dayKey, bucket)
  }

  const latestKey = Array.from(byDay.keys()).sort((a, b) => a.localeCompare(b)).slice(-1)[0] ?? null
  const keys = buildDayWindow(days, latestKey)
  return {
    labels: keys.map(toDayLabel),
    scheduled: keys.map((key) => byDay.get(key)?.scheduled ?? 0),
    arrived: keys.map((key) => byDay.get(key)?.arrived ?? 0),
    received: keys.map((key) => byDay.get(key)?.received ?? 0),
  }
}

export function buildSupplierVolume(items: InboundItem[], limit = 6): {
  labels: string[]
  expected: number[]
  received: number[]
} {
  const bySupplier = new Map<string, { expected: number; received: number }>()

  for (const item of items) {
    const key = item.supplier || 'Unknown supplier'
    const bucket = bySupplier.get(key) ?? { expected: 0, received: 0 }
    bucket.expected += item.expected_qty
    bucket.received += item.received_qty
    bySupplier.set(key, bucket)
  }

  const top = Array.from(bySupplier.entries())
    .sort((a, b) => b[1].expected - a[1].expected)
    .slice(0, limit)

  return {
    labels: top.map(([supplier]) => supplier),
    expected: top.map(([, values]) => values.expected),
    received: top.map(([, values]) => values.received),
  }
}
