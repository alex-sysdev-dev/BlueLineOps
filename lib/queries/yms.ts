import { supabase } from '@/lib/supabase'
import type { YardSpotRow } from '@/types/yms'

export async function getYardSpots(): Promise<YardSpotRow[]> {
  const { data, error } = await supabase
    .from('yard_spots')
    .select('*')

  if (error) {
    console.error('YMS yard_spots fetch error:', error)
    throw error
  }

  return (data ?? []) as YardSpotRow[]
}
