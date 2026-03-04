import { supabase } from '@/lib/supabase'
import { InboundItem, Shipment, ShipmentStatus } from '@/types/inbound'

type RawInboundItem = {
  id: string
  shipment_id: string
  product_id: string
  expected_qty: number | null
  received_qty: number | null
}

type RawShipmentMeta = {
  id: string
  supplier: string | null
  eta: string | null
  status: string | null
}

function normalizeShipmentStatus(value: string | null): ShipmentStatus | 'unknown' {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'scheduled' || normalized === 'arrived' || normalized === 'received') {
    return normalized
  }

  return 'unknown'
}

export async function getInboundShipments(): Promise<Shipment[]> {
  const { data, error } = await supabase
    .from('inbound_shipments')
    .select('*')
    .order('eta', { ascending: true })

  if (error) {
    console.error('Inbound fetch error:', error)
    throw error
  }

  return data as Shipment[]
}

export async function getInboundItems(): Promise<InboundItem[]> {
  const [{ data: itemRows, error: itemError }, { data: shipmentRows, error: shipmentError }] = await Promise.all([
    supabase.from('inbound_items').select('id, shipment_id, product_id, expected_qty, received_qty'),
    supabase.from('inbound_shipments').select('id, supplier, eta, status'),
  ])

  if (itemError) {
    console.error('Inbound items fetch error:', itemError)
    throw itemError
  }

  if (shipmentError) {
    console.error('Inbound shipment metadata fetch error:', shipmentError)
    throw shipmentError
  }

  const shipmentsById = new Map<string, RawShipmentMeta>(
    ((shipmentRows as RawShipmentMeta[] | null) ?? []).map((shipment) => [shipment.id, shipment])
  )

  return ((itemRows as RawInboundItem[] | null) ?? []).map((item) => {
    const shipment = shipmentsById.get(item.shipment_id)
    return {
      id: item.id,
      shipment_id: item.shipment_id,
      product_id: item.product_id,
      expected_qty: item.expected_qty ?? 0,
      received_qty: item.received_qty ?? 0,
      supplier: shipment?.supplier ?? 'Unknown supplier',
      eta: shipment?.eta ?? null,
      status: normalizeShipmentStatus(shipment?.status ?? null),
    }
  })
}
