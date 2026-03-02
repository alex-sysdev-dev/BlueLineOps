export function calculateInboundKpis(shipments: any[]) {
  const scheduled = shipments.filter(s => s.status === 'scheduled').length
  const arrived = shipments.filter(s => s.status === 'arrived').length
  const received = shipments.filter(s => s.status === 'received').length

  return { scheduled, arrived, received }
}