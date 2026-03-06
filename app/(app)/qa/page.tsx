import KpiTile from '@/components/kpi/KpiTile'
import LineCharts from '@/components/charts/LineCharts'
import BarChart from '@/components/charts/BarChart'
import DataTable, { type Column } from '@/components/tables/DataTable'
import { buildInspectorBreakdown, buildQaTrend, calculateQaKpis } from '@/lib/calculations/qa'
import { getQaInspections } from '@/lib/queries/qa'
import { getCrossFunctionalKpis, getCycleCountTasksCount } from '@/lib/queries/operations'
import type { QaInspection } from '@/types/qa'

export default async function QaPage() {
  const [inspections, crossKpis, cycleCount] = await Promise.all([
    getQaInspections(),
    getCrossFunctionalKpis(),
    getCycleCountTasksCount(),
  ])
  const kpis = calculateQaKpis(inspections)
  const trend = buildQaTrend(inspections, 14)
  const inspectorBreakdown = buildInspectorBreakdown(inspections, 8)

  const columns: Column<QaInspection>[] = [
    { header: 'Inspector', accessor: 'inspector' },
    { header: 'Result', accessor: 'result' },
    { header: 'Inspected Qty', accessor: 'inspectedQty' },
    { header: 'Damaged Qty', accessor: 'damagedQty' },
    { header: 'Inspected At', accessor: 'inspectedAt' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">
        <span className="text-blue-500">QA</span>{' '}
        <span className="text-[var(--foreground)]">Dashboard</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiTile title="Total Inspections" value={kpis.totalInspections} />
        <KpiTile title="Passed" value={kpis.passed} />
        <KpiTile title="Failed" value={kpis.failed} />
        <KpiTile title="Pass Rate" value={kpis.passRate} suffix="%" />
        <KpiTile title="Inventory Risk SKUs" value={crossKpis.inventoryRiskSkus} accent="text-orange-100 group-hover:text-orange-50" />
        <KpiTile title="Inbound QA Blocked" value={crossKpis.inboundQaBlocked} accent="text-rose-100 group-hover:text-rose-50" />
        <KpiTile title="Inbound QA Pending" value={crossKpis.inboundQaPending} accent="text-yellow-100 group-hover:text-yellow-50" />
        <KpiTile title="CycleCount" value={cycleCount} accent="text-blue-100 group-hover:text-blue-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LineCharts
          title="Inspection Results Trend"
          description="Daily pass/fail counts from QA inspection events."
          labels={trend.labels}
          series={[
            { name: 'Pass', color: '#22c55e', values: trend.passed },
            { name: 'Fail', color: '#ef4444', values: trend.failed },
          ]}
        />

        <BarChart
          title="Inspector Output"
          description="Inspected units vs damaged units by inspector."
          labels={inspectorBreakdown.labels}
          series={[
            { name: 'Inspected', color: '#3b82f6', values: inspectorBreakdown.inspected },
            { name: 'Damaged', color: '#f97316', values: inspectorBreakdown.damaged },
          ]}
        />
      </div>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Inspection Log</h2>
        <DataTable<QaInspection> columns={columns} data={inspections} />
      </section>
    </div>
  )
}
