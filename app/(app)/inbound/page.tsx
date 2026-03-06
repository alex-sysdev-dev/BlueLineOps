import { getInboundItems, getInboundShipments } from '@/lib/queries/inbound'
import { buildInboundStatusTrend, buildSupplierVolume } from '@/lib/calculations/inbound'
import { calculateInboundKpis } from '@/lib/calculations/kpi'
import { getCrossFunctionalKpis, getDockDoorCounts, getPutawayTasksCount } from '@/lib/queries/operations'
import KpiTile from '@/components/kpi/KpiTile'
import DataTable, { type Column } from '@/components/tables/DataTable'
import LineCharts from '@/components/charts/LineCharts'
import BarChart from '@/components/charts/BarChart'
import type { Shipment } from '@/types/inbound'

export default async function InboundPage() {
  const [shipments, inboundItems, crossKpis, dockDoors, putawayTasks] = await Promise.all([
    getInboundShipments(),
    getInboundItems(),
    getCrossFunctionalKpis(),
    getDockDoorCounts(),
    getPutawayTasksCount(),
  ])
  const kpis = calculateInboundKpis(shipments)
  const statusTrend = buildInboundStatusTrend(shipments)
  const supplierVolume = buildSupplierVolume(inboundItems)

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <KpiTile title="Scheduled" value={kpis.scheduled} />
        <KpiTile title="Arrived" value={kpis.arrived} />
        <KpiTile title="Received" value={kpis.received} />
        <KpiTile title="Accuracy" value={99.2} suffix="%" />
        <KpiTile title="Inventory Risk SKUs" value={crossKpis.inventoryRiskSkus} accent="text-orange-100 group-hover:text-orange-50" />
        <KpiTile title="Inbound QA Pending" value={crossKpis.inboundQaPending} accent="text-yellow-100 group-hover:text-yellow-50" />
        <KpiTile title="Inbound QA Blocked" value={crossKpis.inboundQaBlocked} accent="text-rose-100 group-hover:text-rose-50" />
        <KpiTile title="Inbound Dock Doors" value={dockDoors.inboundDockDoors} accent="text-blue-100 group-hover:text-blue-50" />
        <KpiTile title="Putaway Tasks" value={putawayTasks} accent="text-emerald-100 group-hover:text-emerald-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LineCharts
          title="Inbound Status Trend"
          description="Scheduled, arrived, and received shipment counts by ETA date."
          labels={statusTrend.labels}
          series={[
            { name: 'Scheduled', color: '#60a5fa', values: statusTrend.scheduled },
            { name: 'Arrived', color: '#22c55e', values: statusTrend.arrived },
            { name: 'Received', color: '#f59e0b', values: statusTrend.received },
          ]}
        />

        <BarChart
          title="Supplier Volume (Expected vs Received)"
          description="Top suppliers by expected units from inbound items."
          labels={supplierVolume.labels}
          series={[
            { name: 'Expected', color: '#3b82f6', values: supplierVolume.expected },
            { name: 'Received', color: '#14b8a6', values: supplierVolume.received },
          ]}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Shipments</h2>
        <DataTable<Shipment> columns={columns} data={shipments} />
      </div>
    </div>
  )
}
