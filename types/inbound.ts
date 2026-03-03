export type ShipmentStatus = 'scheduled' | 'arrived' | 'received'

export interface Shipment {
  id: string
  supplier: string
  eta: string
  status: ShipmentStatus
  created_at: string
  updated_at: string
}

export interface InboundKpi {
  scheduled: number
  arrived: number
  received: number
}