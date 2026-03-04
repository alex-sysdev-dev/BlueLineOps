export type ShipmentStatus = 'scheduled' | 'arrived' | 'received'

export interface Shipment {
  id: string
  supplier: string
  eta: string
  status: ShipmentStatus
  created_at?: string
  updated_at?: string
}

export interface InboundKpi {
  scheduled: number
  arrived: number
  received: number
}

export interface InboundItem {
  id: string
  shipment_id: string
  product_id: string
  expected_qty: number
  received_qty: number
  supplier: string
  eta: string | null
  status: ShipmentStatus | 'unknown'
}
