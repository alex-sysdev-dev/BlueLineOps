import { supabase } from '@/lib/supabase'
import type {
  ExecutiveCptRiskOrder,
  ExecutiveKpiForecastRow,
  ExecutiveKpiHistoryRow,
  ExecutiveKpiMaxLineRow,
  ExecutiveKpiSnapshot,
} from '@/types/executive'

export async function getExecutiveKpiSnapshot(): Promise<ExecutiveKpiSnapshot | null> {
  const { data, error } = await supabase.from('executive_kpi_snapshot').select('*').maybeSingle()

  if (error) {
    console.error('Executive KPI snapshot fetch error:', error)
    return null
  }

  return (data as ExecutiveKpiSnapshot | null) ?? null
}

export async function getExecutiveKpiMaxLines(limit = 24): Promise<ExecutiveKpiMaxLineRow[]> {
  const { data, error } = await supabase
    .from('executive_kpi_max_lines')
    .select('bucket_at, active_orders_max, cpt_risk_orders_max, safety_incidents_30d_max')
    .order('bucket_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Executive KPI max lines fetch error:', error)
    return []
  }

  return ((data as ExecutiveKpiMaxLineRow[] | null) ?? []).reverse()
}

export async function getExecutiveCptRiskOrders(limit = 8): Promise<ExecutiveCptRiskOrder[]> {
  const { data, error } = await supabase
    .from('order_cpt_risk')
    .select(
      'order_id, order_number, status, cpt_at, cpt_window_label, minutes_to_cpt, hours_to_cpt, order_age_hours, lifecycle_stage, risk_bucket, is_deadlined'
    )
    .in('risk_bucket', ['missed', 'risk', 'watch'])
    .order('is_deadlined', { ascending: false })
    .order('minutes_to_cpt', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Executive CPT risk fetch error:', error)
    return []
  }

  return (data as ExecutiveCptRiskOrder[] | null) ?? []
}

const HISTORY_SELECT = `
  bucket_at,
  throughput_per_hour_avg,
  throughput_basis,
  labor_cost_per_unit_avg,
  on_time_ship_pct_avg,
  cpt_risk_orders_avg,
  cpt_risk_orders_max,
  active_orders_avg,
  active_orders_max,
  pending_pick_orders_avg,
  pending_pick_orders_max,
  pending_pack_orders_avg,
  pending_pack_orders_max,
  avg_order_age_hours_avg,
  yard_occupancy_pct_avg,
  dock_utilization_pct_avg,
  avg_trailer_dwell_hours_avg,
  deadlined_orders_avg,
  deadlined_orders_max,
  active_labor_avg,
  active_labor_max,
  productivity_per_labor_hour_avg,
  quality_score_pct_avg,
  safety_incidents_30d_avg,
  safety_incidents_30d_max,
  snapshot_count
`

async function getExecutiveHistoryRows(
  table: 'executive_kpi_history_hourly' | 'executive_kpi_history_daily',
  limit: number
): Promise<ExecutiveKpiHistoryRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select(HISTORY_SELECT)
    .order('bucket_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`Executive KPI history fetch error for ${table}:`, error)
    return []
  }

  return ((data as ExecutiveKpiHistoryRow[] | null) ?? []).reverse()
}

export async function getExecutiveKpiHistoryHourly(limit = 24): Promise<ExecutiveKpiHistoryRow[]> {
  return getExecutiveHistoryRows('executive_kpi_history_hourly', limit)
}

export async function getExecutiveKpiHistoryDaily(limit = 14): Promise<ExecutiveKpiHistoryRow[]> {
  return getExecutiveHistoryRows('executive_kpi_history_daily', limit)
}

export async function getExecutiveKpiForecastDaily(limit = 14): Promise<ExecutiveKpiForecastRow[]> {
  const { data, error } = await supabase
    .from('executive_kpi_forecast_daily')
    .select(
      'forecast_date, active_orders_forecast, cpt_risk_orders_forecast, throughput_per_hour_forecast, active_orders_low, active_orders_high, cpt_risk_orders_low, cpt_risk_orders_high, throughput_per_hour_low, throughput_per_hour_high, forecast_method'
    )
    .order('forecast_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Executive KPI forecast fetch error:', error)
    return []
  }

  return (data as ExecutiveKpiForecastRow[] | null) ?? []
}
