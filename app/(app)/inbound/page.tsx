import { getInboundShipments } from '@/lib/queries/inbound'
import { calculateInboundKpis } from '@/lib/calculations/kpi'
import KpiTile from '@/components/kpi/KpiTile'
import DataTable, { type Column } from '@/components/tables/DataTable'
import type { Shipment } from '@/types/inbound'

export default async function InboundPage() {
  const shipments: Shipment[] = await getInboundShipments()
  const kpis = calculateInboundKpis(shipments)

  const columns: Column<Shipment>[] = [
    { header: 'Supplier', accessor: 'supplier' },
    { header: 'ETA', accessor: 'eta' },
    { header: 'Status', accessor: 'status' },
  ]

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold">
        <span className="text-blue-500">Inbound</span>{' '}
        <span className="text-[var(--foreground)]">Dashboard</span>
      </h1>

      <div className="grid grid-cols-4 gap-6">
        <KpiTile title="Scheduled" value={kpis.scheduled} />
        <KpiTile title="Arrived" value={kpis.arrived} />
        <KpiTile title="Received" value={kpis.received} />
        <KpiTile title="Accuracy" value={99.2} suffix="%" />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Shipments</h2>
        <DataTable<Shipment> columns={columns} data={shipments} />
      </div>
    </div>
  )
}
