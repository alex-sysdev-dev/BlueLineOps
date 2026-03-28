import { getInboundItems, getInboundShipments } from '@/lib/queries/inbound'
import { buildInboundStatusTrend, buildSupplierVolume } from '@/lib/calculations/inbound'
import { calculateInboundKpis } from '@/lib/calculations/kpi'
import { getCrossFunctionalKpis, getDockDoorCounts, getPutawayTasksCount } from '@/lib/queries/operations'
import KpiTile from '@/components/kpi/KpiTile'
import SignalPulseBoard from '@/components/dashboard/SignalPulseBoard'
import DataTable, { type Column } from '@/components/tables/DataTable'
import LineCharts from '@/components/charts/LineCharts'
import BarChart from '@/components/charts/BarChart'
import type { Shipment } from '@/types/inbound'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

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
  const flowVolume = kpis.scheduled + kpis.arrived + kpis.received
  const receivedRate = flowVolume > 0 ? Number(((kpis.received / flowVolume) * 100).toFixed(1)) : 0
  const arrivalRate = flowVolume > 0 ? Number(((kpis.arrived / flowVolume) * 100).toFixed(1)) : 0
  const qaRate = flowVolume > 0 ? Number((((crossKpis.inboundQaPending + crossKpis.inboundQaBlocked) / flowVolume) * 100).toFixed(1)) : 0

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

      <SignalPulseBoard
        title="Inbound Flow Pulse"
        description="Continuous motion layer for scheduled arrivals, receipt conversion, QA friction, and putaway pressure."
        summary="Inbound now reads like a live receiving board by exposing the motion between scheduled, arrived, received, and QA-constrained inventory."
        signals={[
          {
            label: 'Schedule Load',
            color: '#38bdf8',
            level: clamp(kpis.scheduled * 7, 8, 96),
            displayValue: `${kpis.scheduled}`,
            note: 'Expected inbound volume still on the schedule.',
          },
          {
            label: 'Arrival Flow',
            color: '#34d399',
            level: clamp(arrivalRate || kpis.arrived * 8, 8, 96),
            displayValue: `${kpis.arrived}`,
            note: 'Shipments that have landed and are entering the building flow.',
          },
          {
            label: 'Receipt Conversion',
            color: '#f59e0b',
            level: clamp(receivedRate || kpis.received * 8, 8, 96),
            displayValue: `${kpis.received}`,
            note: 'Inbound loads fully converted into received inventory state.',
          },
          {
            label: 'QA Friction',
            color: '#fb7185',
            level: clamp(qaRate || (crossKpis.inboundQaPending + crossKpis.inboundQaBlocked) * 6, 8, 96),
            displayValue: `${crossKpis.inboundQaPending + crossKpis.inboundQaBlocked}`,
            note: 'Inbound items slowed by QA pending or blocked disposition.',
          },
        ]}
      />

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
