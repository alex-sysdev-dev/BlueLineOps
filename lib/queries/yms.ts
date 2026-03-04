import { supabase } from '@/lib/supabase'
import type {
  OrderRow,
  TrailerRow,
  WarehouseRow,
  YardSpotRow,
  YardSpotStatus,
  YmsDashboardData,
} from '@/types/yms'

const CLOSED_ORDER_TOKENS = ['cancel', 'close', 'complete', 'ship', 'deliver']

function isClosedOrder(status: string | null | undefined): boolean {
  const value = status?.trim().toLowerCase()
  if (!value) {
    return false
  }

  return CLOSED_ORDER_TOKENS.some((token) => value.includes(token))
}

function normalizeTrailerStatus(status: string | null | undefined): YardSpotStatus {
  const value = status?.trim().toLowerCase()
  if (!value) {
    return 'occupied'
  }

  if (value.includes('maint') || value.includes('repair')) {
    return 'maintenance'
  }

  if (value.includes('block') || value.includes('hold')) {
    return 'blocked'
  }

  if (value.includes('reserve') || value.includes('queue')) {
    return 'reserved'
  }

  if (value.includes('avail') || value.includes('empty') || value.includes('depart')) {
    return 'available'
  }

  return 'occupied'
}

function toTime(value: string | null): number {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function chooseLatestTrailer(current: TrailerRow | undefined, next: TrailerRow): TrailerRow {
  if (!current) {
    return next
  }

  const currentTime = Math.max(toTime(current.arrived_at), toTime(current.departed_at))
  const nextTime = Math.max(toTime(next.arrived_at), toTime(next.departed_at))

  return nextTime > currentTime ? next : current
}

function chooseLatestOrder(current: OrderRow | undefined, next: OrderRow): OrderRow {
  if (!current) {
    return next
  }

  return toTime(next.order_date) > toTime(current.order_date) ? next : current
}

export async function getYmsDashboardData(): Promise<YmsDashboardData> {
  const [warehousesResult, trailersResult, ordersResult, yardSpotsResult] = await Promise.all([
    supabase.from('warehouses').select('id, name, location, square_feet, created_at'),
    supabase
      .from('trailers')
      .select('id, trailer_number, carrier, warehouse_id, current_spot_id, status, arrived_at, departed_at'),
    supabase.from('orders').select('id, order_number, client_name, status, order_date, yard_spots_id, trailer_id'),
    supabase.from('yard_spots').select('id, spot_label, warehouse_id, type'),
  ])

  if (warehousesResult.error) {
    console.error('YMS warehouses fetch error:', warehousesResult.error)
    throw warehousesResult.error
  }

  if (trailersResult.error) {
    console.error('YMS trailers fetch error:', trailersResult.error)
    throw trailersResult.error
  }

  if (ordersResult.error) {
    console.error('YMS orders fetch error:', ordersResult.error)
    throw ordersResult.error
  }

  if (yardSpotsResult.error) {
    console.error('YMS yard_spots fetch error:', yardSpotsResult.error)
    throw yardSpotsResult.error
  }

  const warehouses = (warehousesResult.data ?? []) as WarehouseRow[]
  const trailers = (trailersResult.data ?? []) as TrailerRow[]
  const orders = (ordersResult.data ?? []) as OrderRow[]
  const yardSpotRecords = (yardSpotsResult.data ?? []) as YardSpotRow[]

  const warehouseById = new Map<string, WarehouseRow>()
  for (const warehouse of warehouses) {
    warehouseById.set(warehouse.id, warehouse)
  }

  const trailerBySpotId = new Map<string, TrailerRow>()
  const trailerById = new Map<string, TrailerRow>()
  for (const trailer of trailers) {
    trailerById.set(trailer.id, trailer)

    if (!trailer.current_spot_id) {
      continue
    }

    const existing = trailerBySpotId.get(trailer.current_spot_id)
    trailerBySpotId.set(trailer.current_spot_id, chooseLatestTrailer(existing, trailer))
  }

  const openOrderCountBySpotId = new Map<string, number>()
  const latestOpenOrderBySpotId = new Map<string, OrderRow>()

  for (const order of orders) {
    if (isClosedOrder(order.status)) {
      continue
    }

    let spotId = order.yard_spots_id
    if (!spotId && order.trailer_id) {
      spotId = trailerById.get(order.trailer_id)?.current_spot_id ?? null
    }

    if (!spotId) {
      continue
    }

    openOrderCountBySpotId.set(spotId, (openOrderCountBySpotId.get(spotId) ?? 0) + 1)
    latestOpenOrderBySpotId.set(
      spotId,
      chooseLatestOrder(latestOpenOrderBySpotId.get(spotId), order)
    )
  }

  const yardSpots = yardSpotRecords.map((spot, index) => {
    const spotId = typeof spot.id === 'string' ? spot.id : null
    const warehouse =
      typeof spot.warehouse_id === 'string'
        ? warehouseById.get(spot.warehouse_id)
        : undefined

    const trailer = spotId ? trailerBySpotId.get(spotId) : undefined
    const openOrderCount = spotId ? (openOrderCountBySpotId.get(spotId) ?? 0) : 0
    const latestOrder = spotId ? latestOpenOrderBySpotId.get(spotId) : undefined

    let status: YardSpotStatus = 'available'
    if (trailer) {
      status = normalizeTrailerStatus(trailer.status)
    } else if (openOrderCount > 0) {
      status = 'reserved'
    }

    const spotType = typeof spot.type === 'string' ? spot.type.toLowerCase() : ''
    if (spotType.includes('maint') || spotType.includes('repair')) {
      status = 'maintenance'
    } else if (spotType.includes('block') || spotType.includes('hold')) {
      status = 'blocked'
    }

    const label =
      typeof spot.spot_label === 'string' && spot.spot_label.trim().length > 0
        ? spot.spot_label.trim()
        : `Spot ${index + 1}`

    const zone =
      warehouse?.name ??
      (typeof spot.type === 'string' && spot.type.trim().length > 0 ? spot.type.trim() : 'General')

    return {
      ...spot,
      spot_id: spot.id,
      label,
      zone,
      yard_section: spot.type ?? null,
      warehouse_name: warehouse?.name ?? null,
      warehouse_location: warehouse?.location ?? null,
      status,
      trailer_id: trailer?.id ?? null,
      trailer_number: trailer?.trailer_number ?? null,
      carrier: trailer?.carrier ?? null,
      active_orders: openOrderCount,
      order_number: latestOrder?.order_number ?? null,
      updated_at: trailer?.arrived_at ?? trailer?.departed_at ?? latestOrder?.order_date ?? null,
    } as YardSpotRow
  })

  return {
    warehouses,
    trailers,
    orders,
    yardSpots,
  }
}

export async function getYardSpots(): Promise<YardSpotRow[]> {
  const data = await getYmsDashboardData()
  return data.yardSpots
}
