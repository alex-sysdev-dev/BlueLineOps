import { getSuppliers } from '@/lib/queries/suppliers'
import KpiTile from '@/components/kpi/KpiTile'
import DataTable, { type Column } from '@/components/tables/DataTable'
import type { Supplier } from '@/types/suppliers'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  const active = suppliers.filter((s) => s.is_active)
  const avgLeadTime = active.length
    ? Math.round(active.reduce((sum, s) => sum + (s.lead_time_days ?? 0), 0) / active.length)
    : 0
  const avgReliability = active.length
    ? Number((active.reduce((sum, s) => sum + (s.reliability_pct ?? 0), 0) / active.length).toFixed(1))
    : 0
  const totalScheduled = suppliers.reduce((sum, s) => sum + (s.scheduled_shipments ?? 0), 0)

  const columns: Column<Supplier>[] = [
    { header: 'Code', accessor: 'code' },
    { header: 'Supplier', accessor: 'name' },
    { header: 'Category', accessor: 'primary_category' },
    { header: 'Contact', accessor: 'contact_name' },
    { header: 'Lead Time (d)', accessor: 'lead_time_days' },
    { header: 'Reliability', accessor: 'reliability_pct' },
    { header: 'Total Shipments', accessor: 'total_shipments' },
    { header: 'Scheduled', accessor: 'scheduled_shipments' },
    { header: 'Arrived', accessor: 'arrived_shipments' },
    { header: 'Received', accessor: 'received_shipments' },
  ]

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold">
        <span className="text-blue-500">Suppliers</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiTile title="Active Suppliers" value={active.length} />
        <KpiTile title="Avg Lead Time" value={avgLeadTime} suffix=" d" />
        <KpiTile
          title="Avg Reliability"
          value={avgReliability}
          suffix="%"
          accent="text-emerald-100 group-hover:text-emerald-50"
        />
        <KpiTile
          title="Scheduled Shipments"
          value={totalScheduled}
          accent="text-blue-100 group-hover:text-blue-50"
        />
      </div>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Supplier Directory</h2>
        <p className="text-sm text-zinc-400 mb-4">All registered suppliers with inbound shipment activity and performance metrics.</p>
        <DataTable<Supplier> columns={columns} data={suppliers} />
      </section>
    </div>
  )
}
