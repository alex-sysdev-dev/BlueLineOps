import LineCharts from '@/components/charts/LineCharts'
import BarChart from '@/components/charts/BarChart'
import SignalPulseBoard from '@/components/dashboard/SignalPulseBoard'
import DataTable, { type Column } from '@/components/tables/DataTable'
import { buildInboundStatusTrend, buildSupplierVolume } from '@/lib/calculations/inbound'
import { getInboundItems, getInboundShipments } from '@/lib/queries/inbound'
import type { Shipment } from '@/types/inbound'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export default async function InboundShipmentsPage() {
  const [shipments, items] = await Promise.all([getInboundShipments(), getInboundItems()])
  const trend = buildInboundStatusTrend(shipments, 14)
  const suppliers = buildSupplierVolume(items, 8)
  const scheduledCount = shipments.filter((shipment) => shipment.status === 'scheduled').length
  const arrivedCount = shipments.filter((shipment) => shipment.status === 'arrived').length
  const receivedCount = shipments.filter((shipment) => shipment.status === 'received').length
  const totalCount = scheduledCount + arrivedCount + receivedCount

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

      <SignalPulseBoard
        title="Shipment Lane Pulse"
        description="Continuous motion view of scheduled appointments, arrivals at dock, receipt completion, and supplier throughput concentration."
        summary="This keeps the shipment page active for visitors even when table data is sparse or clustered around a few timestamps."
        signals={[
          {
            label: 'Scheduled',
            color: '#38bdf8',
            level: clamp(totalCount > 0 ? (scheduledCount / totalCount) * 100 : scheduledCount * 8, 8, 96),
            displayValue: `${scheduledCount}`,
            note: 'Appointments still ahead of physical arrival.',
          },
          {
            label: 'Arrived',
            color: '#34d399',
            level: clamp(totalCount > 0 ? (arrivedCount / totalCount) * 100 : arrivedCount * 8, 8, 96),
            displayValue: `${arrivedCount}`,
            note: 'Loads physically present and moving through receiving.',
          },
          {
            label: 'Received',
            color: '#f59e0b',
            level: clamp(totalCount > 0 ? (receivedCount / totalCount) * 100 : receivedCount * 8, 8, 96),
            displayValue: `${receivedCount}`,
            note: 'Shipments fully landed into received inventory state.',
          },
          {
            label: 'Supplier Density',
            color: '#fb7185',
            level: clamp(suppliers.labels.length * 12, 8, 96),
            displayValue: `${suppliers.labels.length}`,
            note: 'High-volume suppliers currently shaping inbound lane mix.',
          },
        ]}
      />

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
