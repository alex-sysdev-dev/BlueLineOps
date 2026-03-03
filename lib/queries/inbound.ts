import { supabase } from '@/lib/supabase'
import { Shipment } from '@/types/inbound'

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