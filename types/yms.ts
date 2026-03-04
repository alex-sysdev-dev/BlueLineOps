export type YardSpotStatus =
  | 'occupied'
  | 'available'
  | 'reserved'
  | 'blocked'
  | 'maintenance'
  | 'unknown'

export type WarehouseRow = {
  id: string
  name: string
  location: string | null
  square_feet: number | null
  created_at: string | null
}

export type TrailerRow = {
  id: string
  trailer_number: string
  carrier: string | null
  warehouse_id: string | null
  current_spot_id: string | null
  status: string | null
  arrived_at: string | null
  departed_at: string | null
}

export type TrailerMoveRow = {
  trailer_id: string
  from_spot_id: string | null
  to_spot_id: string
  moved_at: string | null
}

export type OrderRow = {
  id: string
  order_number: string | null
  client_name: string | null
  status: string | null
  order_date: string | null
  yard_spots_id: string | null
  trailer_id: string | null
}

export type YardSpotRow = {
  id?: string | number | null
  spot_label?: string | null
  type?: string | null
  warehouse_id?: string | null
  warehouse_name?: string | null
  warehouse_location?: string | null
  active_orders?: number | null

  spot_id?: string | number | null
  spot_code?: string | null
  spot_name?: string | null
  label?: string | null
  name?: string | null
  zone?: string | null
  area?: string | null
  yard_section?: string | null
  row?: number | string | null
  row_index?: number | string | null
  y?: number | string | null
  column?: number | string | null
  col?: number | string | null
  col_index?: number | string | null
  x?: number | string | null
  status?: string | null
  state?: string | null
  availability?: string | null
  occupied?: boolean | null
  trailer_id?: string | null
  trailer_number?: string | null
  trailer?: string | null
  carrier?: string | null
  appointment_time?: string | null
  updated_at?: string | null
  last_updated?: string | null
  [key: string]: unknown
}

export type NormalizedYardSpot = {
  id: string
  label: string
  zone: string
  status: YardSpotStatus
  row: number
  column: number
  trailerId?: string
  carrier?: string
  updatedAt?: string
}

export type YardSummary = {
  total: number
  occupied: number
  available: number
  reserved: number
  blocked: number
  maintenance: number
  unknown: number
}

export type YmsDashboardData = {
  warehouses: WarehouseRow[]
  trailers: TrailerRow[]
  orders: OrderRow[]
  yardSpots: YardSpotRow[]
}
