import { supabase } from '@/lib/supabase'

export async function getInboundShipments() {
  const { data, error } = await supabase
    .from('inbound_shipments')
    .select('*')
    .order('eta', { ascending: true })

  if (error) {
    console.error('Inbound fetch error:', error)
    throw error
  }

  return data
}