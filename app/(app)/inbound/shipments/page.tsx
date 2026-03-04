import LineCharts from '@/components/charts/LineCharts'
import BarChart from '@/components/charts/BarChart'
import DataTable, { type Column } from '@/components/tables/DataTable'
import { buildInboundStatusTrend, buildSupplierVolume } from '@/lib/calculations/inbound'
import { getInboundItems, getInboundShipments } from '@/lib/queries/inbound'
import type { Shipment } from '@/types/inbound'

export default async function InboundShipmentsPage() {
  const [shipments, items] = await Promise.all([getInboundShipments(), getInboundItems()])
  const trend = buildInboundStatusTrend(shipments, 14)
  const suppliers = buildSupplierVolume(items, 8)

  const columns: Column<Shipment>[] = [
    { header: 'Supplier', accessor: 'supplier' },
    { header: 'ETA', accessor: 'eta' },
    { header: 'Status', accessor: 'status' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        <span className="text-blue-500">Inbound</span>{' '}
        <span className="text-[var(--foreground)]">Shipments</span>
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LineCharts
          title="Two-Week Shipment Trend"
          description="Daily shipment lifecycle movement from scheduled to received."
          labels={trend.labels}
          series={[
            { name: 'Scheduled', color: '#60a5fa', values: trend.scheduled },
            { name: 'Arrived', color: '#22c55e', values: trend.arrived },
            { name: 'Received', color: '#f59e0b', values: trend.received },
          ]}
        />

        <BarChart
          title="Supplier Throughput"
          description="Expected vs received quantity by supplier."
          labels={suppliers.labels}
          series={[
            { name: 'Expected', color: '#3b82f6', values: suppliers.expected },
            { name: 'Received', color: '#14b8a6', values: suppliers.received },
          ]}
        />
      </div>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Shipment Table</h2>
        <DataTable<Shipment> columns={columns} data={shipments} />
      </section>
    </div>
  )
}
