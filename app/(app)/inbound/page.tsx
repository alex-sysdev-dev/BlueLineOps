import { getInboundShipments } from '@/lib/queries/inbound'
import { calculateInboundKpis } from '@/lib/calculations/kpi'
import KpiTile from '@/components/kpi/KpiTile'
import DataTable from '@/components/tables/DataTable'

export default async function InboundPage() {
  const shipments = await getInboundShipments()
  const kpis = calculateInboundKpis(shipments)

  const columns = [
    { header: 'Supplier', accessor: 'supplier' },
    { header: 'ETA', accessor: 'eta' },
    { header: 'Status', accessor: 'status' },
  ]

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold">Inbound Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <KpiTile label="Scheduled" value={kpis.scheduled} />
        <KpiTile label="Arrived" value={kpis.arrived} />
        <KpiTile label="Received" value={kpis.received} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Shipments</h2>
        <DataTable columns={columns} data={shipments} />
      </div>
    </div>
  )
}