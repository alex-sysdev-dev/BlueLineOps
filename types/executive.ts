export type ExecutiveKpiSnapshot = {
  snapshot_at: string
  throughput_per_hour: number | null
  throughput_basis: string | null
  labor_cost_per_unit: number | null
  on_time_ship_pct: number | null
  cpt_risk_orders: number | null
  active_orders: number | null
  pending_pick_orders: number | null
  pending_pack_orders: number | null
  avg_order_age_hours: number | null
  yard_occupancy_pct: number | null
  dock_utilization_pct: number | null
  avg_trailer_dwell_hours: number | null
  deadlined_orders: number | null
  active_labor: number | null
  productivity_per_labor_hour: number | null
  quality_score_pct: number | null
  safety_incidents_30d: number | null
}

export type ExecutiveKpiMaxLineRow = {
  bucket_at: string
  active_orders_max: number | null
  cpt_risk_orders_max: number | null
  safety_incidents_30d_max: number | null
}

export type ExecutiveKpiHistoryRow = {
  bucket_at: string
  throughput_per_hour_avg: number | null
  throughput_basis: string | null
  labor_cost_per_unit_avg: number | null
  on_time_ship_pct_avg: number | null
  cpt_risk_orders_avg: number | null
  cpt_risk_orders_max: number | null
  active_orders_avg: number | null
  active_orders_max: number | null
  pending_pick_orders_avg: number | null
  pending_pick_orders_max: number | null
  pending_pack_orders_avg: number | null
  pending_pack_orders_max: number | null
  avg_order_age_hours_avg: number | null
  yard_occupancy_pct_avg: number | null
  dock_utilization_pct_avg: number | null
  avg_trailer_dwell_hours_avg: number | null
  deadlined_orders_avg: number | null
  deadlined_orders_max: number | null
  active_labor_avg: number | null
  active_labor_max: number | null
  productivity_per_labor_hour_avg: number | null
  quality_score_pct_avg: number | null
  safety_incidents_30d_avg: number | null
  safety_incidents_30d_max: number | null
  snapshot_count: number | null
}

export type ExecutiveKpiForecastRow = {
  forecast_date: string
  active_orders_forecast: number | null
  cpt_risk_orders_forecast: number | null
  throughput_per_hour_forecast: number | null
  active_orders_low: number | null
  active_orders_high: number | null
  cpt_risk_orders_low: number | null
  cpt_risk_orders_high: number | null
  throughput_per_hour_low: number | null
  throughput_per_hour_high: number | null
  forecast_method: string | null
}

export type ExecutiveCptRiskOrder = {
  order_id: string
  order_number: string | null
  status: string | null
  cpt_at: string
  cpt_window_label: string | null
  minutes_to_cpt: number | null
  hours_to_cpt: number | null
  order_age_hours: number | null
  lifecycle_stage: string | null
  risk_bucket: string | null
  is_deadlined: boolean | null
}
