import { serverSupabase } from '@/lib/supabase-server'
import type { Supplier } from '@/types/suppliers'

export async function getSuppliers(): Promise<Supplier[]> {
  const { data: supplierRows, error: supplierError } = await serverSupabase
    .from('suppliers')
    .select('*')
    .order('code', { ascending: true })

  if (supplierError) {
    console.error('Suppliers fetch error:', supplierError)
    throw supplierError
  }

  const { data: shipmentRows, error: shipmentError } = await serverSupabase
    .from('inbound_shipments')
    .select('supplier, status')

  if (shipmentError) {
    console.error('Supplier shipment counts error:', shipmentError)
    throw shipmentError
  }

  type ShipmentRow = { supplier: string | null; status: string | null }
  const rows = (shipmentRows as ShipmentRow[] | null) ?? []

  const countsByName = new Map<string, { total: number; scheduled: number; arrived: number; received: number }>()
  for (const row of rows) {
    const key = row.supplier ?? ''
    if (!countsByName.has(key)) countsByName.set(key, { total: 0, scheduled: 0, arrived: 0, received: 0 })
    const c = countsByName.get(key)!
    c.total++
    if (row.status === 'scheduled') c.scheduled++
    else if (row.status === 'arrived') c.arrived++
    else if (row.status === 'received') c.received++
  }

  return ((supplierRows as Supplier[] | null) ?? []).map((s) => {
    const counts = countsByName.get(s.name) ?? { total: 0, scheduled: 0, arrived: 0, received: 0 }
    return {
      ...s,
      total_shipments: counts.total,
      scheduled_shipments: counts.scheduled,
      arrived_shipments: counts.arrived,
      received_shipments: counts.received,
    }
  })
}
