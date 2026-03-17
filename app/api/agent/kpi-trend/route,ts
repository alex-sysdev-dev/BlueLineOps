import { getExecutiveKpiHistoryHourly, getExecutiveKpiHistoryDaily } from '@/lib/queries/executive'

const METRIC_MAP: Record<string, string> = {
  throughput_per_hour: 'throughput_per_hour_avg',
  labor_cost_per_unit: 'labor_cost_per_unit_avg',
  on_time_ship_pct: 'on_time_ship_pct_avg',
  cpt_risk_orders: 'cpt_risk_orders_max',
  active_orders: 'active_orders_max',
  pending_pick_orders: 'pending_pick_orders_max',
  pending_pack_orders: 'pending_pack_orders_max',
  avg_order_age_hours: 'avg_order_age_hours_avg',
  yard_occupancy_pct: 'yard_occupancy_pct_avg',
  dock_utilization_pct: 'dock_utilization_pct_avg',
  avg_trailer_dwell_hours: 'avg_trailer_dwell_hours_avg',
  deadlined_orders: 'deadlined_orders_max',
  active_labor: 'active_labor_max',
  productivity_per_labor_hour: 'productivity_per_labor_hour_avg',
  quality_score_pct: 'quality_score_pct_avg',
  safety_incidents_30d: 'safety_incidents_30d_max',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const metric = searchParams.get('metric')
  const grain = searchParams.get('grain') ?? 'hourly'

  if (!metric || !METRIC_MAP[metric]) {
    return Response.json(
      { error: 'bad_request', message: 'Valid metric is required.', hint: `Supported: ${Object.keys(METRIC_MAP).join(', ')}` },
      { status: 400 }
    )
  }

  const field = METRIC_MAP[metric]
  const rows = grain === 'daily'
    ? await getExecutiveKpiHistoryDaily(30)
    : await getExecutiveKpiHistoryHourly(24)

  const data = rows.map((row) => ({
    bucket_at: row.bucket_at,
    value: (row as Record<string, unknown>)[field] ?? null,
  }))

  return Response.json({
    source_view: grain === 'daily' ? 'executive_kpi_history_daily' : 'executive_kpi_history_hourly',
    metric,
    grain,
    data,
  })
}