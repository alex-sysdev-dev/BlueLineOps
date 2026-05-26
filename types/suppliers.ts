export interface Supplier {
  id: string
  code: string
  name: string
  contact_name: string | null
  contact_email: string | null
  phone: string | null
  lead_time_days: number | null
  reliability_pct: number | null
  primary_category: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // joined aggregates
  total_shipments?: number
  scheduled_shipments?: number
  arrived_shipments?: number
  received_shipments?: number
}
