-- BlueLineOps
-- Deterministic executive KPI history backfill + simple daily forecast views
--
-- What this does:
-- 1. Seeds the last 180 days of hourly rows into public.executive_kpi_history
-- 2. Creates a daily forecast view for:
--    - active_orders
--    - cpt_risk_orders
--    - throughput_per_hour
--
-- Notes:
-- - The backfill is deterministic, so reruns stay stable.
-- - Existing snapshot_at rows are updated via ON CONFLICT.
-- - Forecasting uses recent same-day-of-week baselines plus a short-term slope.

with anchor as (
  select
    coalesce(eks.throughput_per_hour, 22.0)::numeric as base_throughput_per_hour,
    coalesce(eks.throughput_basis, 'orders_per_hour') as base_throughput_basis,
    coalesce(eks.labor_cost_per_unit, 2.85)::numeric as base_labor_cost_per_unit,
    coalesce(eks.on_time_ship_pct, 96.20)::numeric as base_on_time_ship_pct,
    coalesce(eks.cpt_risk_orders, 6)::numeric as base_cpt_risk_orders,
    coalesce(eks.active_orders, 118)::numeric as base_active_orders,
    coalesce(eks.pending_pick_orders, 42)::numeric as base_pending_pick_orders,
    coalesce(eks.pending_pack_orders, 18)::numeric as base_pending_pack_orders,
    coalesce(eks.avg_order_age_hours, 5.50)::numeric as base_avg_order_age_hours,
    coalesce(eks.yard_occupancy_pct, 78.0)::numeric as base_yard_occupancy_pct,
    coalesce(eks.dock_utilization_pct, 64.0)::numeric as base_dock_utilization_pct,
    coalesce(eks.avg_trailer_dwell_hours, 8.50)::numeric as base_avg_trailer_dwell_hours,
    coalesce(eks.deadlined_orders, 2)::numeric as base_deadlined_orders,
    coalesce(eks.active_labor, 24)::numeric as base_active_labor,
    coalesce(eks.productivity_per_labor_hour, 0.92)::numeric as base_productivity_per_labor_hour,
    coalesce(eks.quality_score_pct, 98.70)::numeric as base_quality_score_pct,
    coalesce(eks.safety_incidents_30d, 1)::numeric as base_safety_incidents_30d
  from public.executive_kpi_snapshot eks
  limit 1
),
bounds as (
  select
    date_trunc('hour', now() - interval '180 days') as history_start,
    date_trunc('hour', now()) - interval '1 hour' as history_end
),
series as (
  select
    gs as snapshot_at,
    extract(hour from gs)::int as hour_of_day,
    extract(isodow from gs)::int as iso_dow,
    ((extract(epoch from gs) - extract(epoch from b.history_start)) / 86400.0)::numeric as day_index
  from bounds b
  cross join generate_series(b.history_start, b.history_end, interval '1 hour') gs
),
factors as (
  select
    s.snapshot_at,
    s.hour_of_day,
    s.iso_dow,
    s.day_index,
    case
      when s.iso_dow in (1, 2, 3, 4) then 1.04
      when s.iso_dow = 5 then 1.00
      when s.iso_dow = 6 then 0.86
      else 0.74
    end as weekday_factor,
    case
      when s.hour_of_day between 6 and 10 then 1.10
      when s.hour_of_day between 11 and 16 then 1.18
      when s.hour_of_day between 17 and 21 then 1.02
      when s.hour_of_day in (22, 23) then 0.78
      else 0.62
    end as throughput_hour_factor,
    case
      when s.hour_of_day between 6 and 11 then 1.00
      when s.hour_of_day between 12 and 18 then 1.10
      when s.hour_of_day between 19 and 22 then 0.98
      else 0.76
    end as backlog_hour_factor,
    case
      when s.hour_of_day between 6 and 17 then 1.05
      when s.hour_of_day between 18 and 22 then 0.88
      else 0.68
    end as labor_hour_factor,
    (0.94 + least(0.12, (s.day_index / 180.0) * 0.12)) as trend_factor,
    (1 + 0.06 * sin(2 * pi() * (s.hour_of_day / 24.0)) + 0.03 * cos(2 * pi() * (s.day_index / 7.0))) as weekly_wave,
    (1 + 0.02 * sin(2 * pi() * (s.day_index / 30.0))) as monthly_wave,
    case
      when s.hour_of_day between 14 and 20 then 1.35
      when s.hour_of_day between 11 and 13 then 1.15
      else 0.92
    end as cpt_pressure_factor
  from series s
),
seeded as (
  select
    f.snapshot_at,
    a.base_throughput_basis as throughput_basis,
    round(
      greatest(
        4.0,
        a.base_throughput_per_hour
        * f.weekday_factor
        * f.throughput_hour_factor
        * f.trend_factor
        * f.weekly_wave
      )::numeric,
      2
    )::numeric(12,2) as throughput_per_hour,
    greatest(
      16,
      round(
        a.base_active_orders
        * f.weekday_factor
        * f.backlog_hour_factor
        * f.trend_factor
        * f.monthly_wave
      )::numeric,
      0
    )::int as active_orders,
    greatest(
      8,
      round(
        a.base_active_labor
        * f.weekday_factor
        * f.labor_hour_factor
        * (0.97 + (f.day_index / 1800.0))
      )::numeric,
      0
    )::int as active_labor,
    round(
      least(
        99.7,
        greatest(
          95.0,
          a.base_quality_score_pct
          + (0.6 * sin(2 * pi() * (f.day_index / 14.0)))
          - case when f.iso_dow in (6, 7) then 0.2 else 0 end
        )
      )::numeric,
      2
    )::numeric(5,2) as quality_score_pct,
    greatest(
      0,
      least(
        4,
        round(
          a.base_safety_incidents_30d
          + (0.7 * sin(2 * pi() * (f.day_index / 45.0)))
          + case when f.iso_dow = 1 then 1 else 0 end
        )::numeric,
        0
      )
    )::int as safety_incidents_30d
  from factors f
  cross join anchor a
),
finalized as (
  select
    s.snapshot_at,
    s.throughput_per_hour,
    s.throughput_basis,
    round(
      least(
        6.25,
        greatest(
          1.75,
          a.base_labor_cost_per_unit
          + ((s.active_labor - a.base_active_labor) * 0.03)
          - ((s.throughput_per_hour - a.base_throughput_per_hour) * 0.04)
        )
      )::numeric,
      2
    )::numeric(12,2) as labor_cost_per_unit,
    greatest(
      8,
      round((s.active_orders * 0.34) + case when extract(hour from s.snapshot_at) between 13 and 19 then 5 else 1 end)::int
    ) as pending_pick_orders,
    greatest(
      4,
      round((s.active_orders * 0.17) + case when extract(hour from s.snapshot_at) between 15 and 20 then 3 else 1 end)::int
    ) as pending_pack_orders,
    round(
      least(
        16.0,
        greatest(
          2.2,
          a.base_avg_order_age_hours
          + ((s.active_orders - a.base_active_orders) * 0.02)
          - ((s.throughput_per_hour - a.base_throughput_per_hour) * 0.04)
          + case when extract(isodow from s.snapshot_at) in (6, 7) then 1.1 else 0 end
        )
      )::numeric,
      2
    )::numeric(12,2) as avg_order_age_hours,
    round(
      least(
        97.5,
        greatest(
          48.0,
          a.base_yard_occupancy_pct
          + ((s.active_orders - a.base_active_orders) * 0.12)
          + case when extract(isodow from s.snapshot_at) in (6, 7) then 3 else 0 end
        )
      )::numeric,
      2
    )::numeric(5,2) as yard_occupancy_pct,
    round(
      least(
        94.5,
        greatest(
          32.0,
          a.base_dock_utilization_pct
          + ((s.throughput_per_hour - a.base_throughput_per_hour) * 1.15)
          + case when extract(hour from s.snapshot_at) between 11 and 18 then 6 else -4 end
        )
      )::numeric,
      2
    )::numeric(5,2) as dock_utilization_pct,
    round(
      least(
        24.0,
        greatest(
          4.5,
          a.base_avg_trailer_dwell_hours
          + case when extract(isodow from s.snapshot_at) in (6, 7) then 2.1 else 0 end
          + case when extract(hour from s.snapshot_at) between 0 and 5 then 0.9 else -0.2 end
        )
      )::numeric,
      2
    )::numeric(12,2) as avg_trailer_dwell_hours,
    greatest(
      0,
      round(
        (s.active_orders * 0.045)
        + case when extract(hour from s.snapshot_at) between 14 and 20 then 3 else 0 end
        + case when extract(isodow from s.snapshot_at) = 5 then 2 else 0 end
      )::numeric,
      0
    )::int as cpt_risk_orders,
    s.active_orders,
    greatest(
      0,
      round(
        ((s.active_orders * 0.045)
        + case when extract(hour from s.snapshot_at) between 14 and 20 then 3 else 0 end
        + case when extract(isodow from s.snapshot_at) = 5 then 2 else 0 end) * 0.24
      )::numeric,
      0
    )::int as deadlined_orders,
    s.active_labor,
    round(
      greatest(0.20, s.throughput_per_hour / greatest(s.active_labor, 1))::numeric,
      2
    )::numeric(12,2) as productivity_per_labor_hour,
    round(
      least(
        99.4,
        greatest(
          86.0,
          a.base_on_time_ship_pct
          - (
            greatest(
              0,
              round(
                (s.active_orders * 0.045)
                + case when extract(hour from s.snapshot_at) between 14 and 20 then 3 else 0 end
                + case when extract(isodow from s.snapshot_at) = 5 then 2 else 0 end
              )::numeric,
              0
            ) * 0.55
          )
          + ((s.quality_score_pct - a.base_quality_score_pct) * 0.2)
        )
      )::numeric,
      2
    )::numeric(5,2) as on_time_ship_pct,
    s.quality_score_pct,
    s.safety_incidents_30d
  from seeded s
  cross join anchor a
)
insert into public.executive_kpi_history (
  snapshot_at,
  throughput_per_hour,
  throughput_basis,
  labor_cost_per_unit,
  on_time_ship_pct,
  cpt_risk_orders,
  active_orders,
  pending_pick_orders,
  pending_pack_orders,
  avg_order_age_hours,
  yard_occupancy_pct,
  dock_utilization_pct,
  avg_trailer_dwell_hours,
  deadlined_orders,
  active_labor,
  productivity_per_labor_hour,
  quality_score_pct,
  safety_incidents_30d
)
select
  f.snapshot_at,
  f.throughput_per_hour,
  f.throughput_basis,
  f.labor_cost_per_unit,
  f.on_time_ship_pct,
  f.cpt_risk_orders,
  f.active_orders,
  f.pending_pick_orders,
  f.pending_pack_orders,
  f.avg_order_age_hours,
  f.yard_occupancy_pct,
  f.dock_utilization_pct,
  f.avg_trailer_dwell_hours,
  f.deadlined_orders,
  f.active_labor,
  f.productivity_per_labor_hour,
  f.quality_score_pct,
  f.safety_incidents_30d
from finalized f
on conflict (snapshot_at) do update
set
  throughput_per_hour = excluded.throughput_per_hour,
  throughput_basis = excluded.throughput_basis,
  labor_cost_per_unit = excluded.labor_cost_per_unit,
  on_time_ship_pct = excluded.on_time_ship_pct,
  cpt_risk_orders = excluded.cpt_risk_orders,
  active_orders = excluded.active_orders,
  pending_pick_orders = excluded.pending_pick_orders,
  pending_pack_orders = excluded.pending_pack_orders,
  avg_order_age_hours = excluded.avg_order_age_hours,
  yard_occupancy_pct = excluded.yard_occupancy_pct,
  dock_utilization_pct = excluded.dock_utilization_pct,
  avg_trailer_dwell_hours = excluded.avg_trailer_dwell_hours,
  deadlined_orders = excluded.deadlined_orders,
  active_labor = excluded.active_labor,
  productivity_per_labor_hour = excluded.productivity_per_labor_hour,
  quality_score_pct = excluded.quality_score_pct,
  safety_incidents_30d = excluded.safety_incidents_30d;

create or replace view public.executive_kpi_forecast_daily as
with recent_daily as (
  select
    ehd.bucket_at::date as bucket_date,
    ehd.active_orders_max::numeric as active_orders_actual,
    ehd.cpt_risk_orders_max::numeric as cpt_risk_orders_actual,
    ehd.throughput_per_hour_avg::numeric as throughput_per_hour_actual,
    extract(isodow from ehd.bucket_at)::int as iso_dow
  from public.executive_kpi_history_daily ehd
  where ehd.bucket_at::date >= current_date - 56
),
latest_actual as (
  select
    rd.bucket_date,
    rd.active_orders_actual,
    rd.cpt_risk_orders_actual,
    rd.throughput_per_hour_actual
  from recent_daily rd
  order by rd.bucket_date desc
  limit 1
),
dow_baseline as (
  select
    rd.iso_dow,
    avg(rd.active_orders_actual)::numeric as active_orders_baseline,
    avg(rd.cpt_risk_orders_actual)::numeric as cpt_risk_orders_baseline,
    avg(rd.throughput_per_hour_actual)::numeric as throughput_per_hour_baseline
  from recent_daily rd
  group by rd.iso_dow
),
trend_window as (
  select
    ehd.bucket_at::date as bucket_date,
    ehd.active_orders_max::numeric as active_orders_actual,
    ehd.cpt_risk_orders_max::numeric as cpt_risk_orders_actual,
    ehd.throughput_per_hour_avg::numeric as throughput_per_hour_actual,
    (extract(epoch from ehd.bucket_at) / 86400.0)::numeric as day_number
  from public.executive_kpi_history_daily ehd
  where ehd.bucket_at::date >= current_date - 28
),
slopes as (
  select
    coalesce(regr_slope(tw.active_orders_actual, tw.day_number), 0)::numeric as active_orders_slope,
    coalesce(regr_slope(tw.cpt_risk_orders_actual, tw.day_number), 0)::numeric as cpt_risk_orders_slope,
    coalesce(regr_slope(tw.throughput_per_hour_actual, tw.day_number), 0)::numeric as throughput_per_hour_slope
  from trend_window tw
),
forecast_days as (
  select
    gs::date as forecast_date,
    extract(isodow from gs)::int as iso_dow,
    (gs::date - current_date) as days_ahead
  from generate_series(current_date + 1, current_date + 14, interval '1 day') gs
)
select
  fd.forecast_date,
  round(
    greatest(
      0,
      (
        (coalesce(db.active_orders_baseline, la.active_orders_actual) * 0.78)
        + (la.active_orders_actual * 0.22)
        + (coalesce(s.active_orders_slope, 0) * fd.days_ahead)
      )
    )::numeric,
    0
  )::int as active_orders_forecast,
  round(
    greatest(
      0,
      (
        (coalesce(db.cpt_risk_orders_baseline, la.cpt_risk_orders_actual) * 0.80)
        + (la.cpt_risk_orders_actual * 0.20)
        + (coalesce(s.cpt_risk_orders_slope, 0) * fd.days_ahead)
      )
    )::numeric,
    0
  )::int as cpt_risk_orders_forecast,
  round(
    greatest(
      0.10,
      (
        (coalesce(db.throughput_per_hour_baseline, la.throughput_per_hour_actual) * 0.78)
        + (la.throughput_per_hour_actual * 0.22)
        + (coalesce(s.throughput_per_hour_slope, 0) * fd.days_ahead)
      )
    )::numeric,
    2
  )::numeric(12,2) as throughput_per_hour_forecast,
  round(
    greatest(
      0,
      (
        ((coalesce(db.active_orders_baseline, la.active_orders_actual) * 0.78)
        + (la.active_orders_actual * 0.22)
        + (coalesce(s.active_orders_slope, 0) * fd.days_ahead)) * 0.92
      )
    )::numeric,
    0
  )::int as active_orders_low,
  round(
    (
      ((coalesce(db.active_orders_baseline, la.active_orders_actual) * 0.78)
      + (la.active_orders_actual * 0.22)
      + (coalesce(s.active_orders_slope, 0) * fd.days_ahead)) * 1.08
    )::numeric,
    0
  )::int as active_orders_high,
  round(
    greatest(
      0,
      (
        ((coalesce(db.cpt_risk_orders_baseline, la.cpt_risk_orders_actual) * 0.80)
        + (la.cpt_risk_orders_actual * 0.20)
        + (coalesce(s.cpt_risk_orders_slope, 0) * fd.days_ahead)) * 0.88
      )
    )::numeric,
    0
  )::int as cpt_risk_orders_low,
  round(
    (
      ((coalesce(db.cpt_risk_orders_baseline, la.cpt_risk_orders_actual) * 0.80)
      + (la.cpt_risk_orders_actual * 0.20)
      + (coalesce(s.cpt_risk_orders_slope, 0) * fd.days_ahead)) * 1.12
    )::numeric,
    0
  )::int as cpt_risk_orders_high,
  round(
    greatest(
      0.10,
      (
        ((coalesce(db.throughput_per_hour_baseline, la.throughput_per_hour_actual) * 0.78)
        + (la.throughput_per_hour_actual * 0.22)
        + (coalesce(s.throughput_per_hour_slope, 0) * fd.days_ahead)) * 0.93
      )
    )::numeric,
    2
  )::numeric(12,2) as throughput_per_hour_low,
  round(
    (
      ((coalesce(db.throughput_per_hour_baseline, la.throughput_per_hour_actual) * 0.78)
      + (la.throughput_per_hour_actual * 0.22)
      + (coalesce(s.throughput_per_hour_slope, 0) * fd.days_ahead)) * 1.07
    )::numeric,
    2
  )::numeric(12,2) as throughput_per_hour_high,
  'same_dow_baseline_plus_28d_slope'::text as forecast_method
from forecast_days fd
cross join latest_actual la
cross join slopes s
left join dow_baseline db
  on db.iso_dow = fd.iso_dow
order by fd.forecast_date;
