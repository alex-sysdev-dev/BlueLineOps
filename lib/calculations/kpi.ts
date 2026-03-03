import { Shipment, InboundKpi } from '@/types/inbound'

export function calculateInboundKpis(shipments: Shipment[]): InboundKpi {
  return shipments.reduce(
    (acc, shipment) => {
      acc[shipment.status]++
      return acc
    },
    { scheduled: 0, arrived: 0, received: 0 }
  )
}