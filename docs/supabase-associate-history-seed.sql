-- BlueLineOps
-- Deterministic historical associate performance seed
--
-- What this does:
-- 1. Seeds the last 180 days of associate_task_events for tracked productivity roles
-- 2. Uses existing associates, skills, and performance targets
-- 3. Keeps reruns safe by checking source_ref before insert
--
-- Target roles:
-- - picker_small
-- - packer_small
-- - order_filler

create index if not exists idx_associate_task_events_source_ref
  on public.associate_task_events (source_ref);

with tracked_assignments as (
  select
    a.id as associate_id,
    a.employee_id,
    a.full_name,
    a.shift,
    sd.id as skill_id,
    sd.code as skill_code,
    pt.target_value as target_uph
  from public.associates a
  join public.associate_skills ask
    on ask.associate_id = a.id
  join public.skill_definitions sd
    on sd.id = ask.skill_id
  left join public.performance_targets pt
    on pt.skill_id = sd.id
   and pt.metric_code = 'uph'
   and pt.is_active = true
  where sd.is_productivity_tracked = true
    and coalesce(ask.status, 'certified') in ('trained', 'certified')
),
history_days as (
  select
    gs::date as work_date,
    extract(isodow from gs)::int as iso_dow,
    ((current_date - gs::date))::int as days_ago
  from generate_series(current_date - 180, current_date - 1, interval '1 day') gs
),
eligible_events as (
  select
    ta.associate_id,
    ta.employee_id,
    ta.full_name,
    ta.shift,
    ta.skill_id,
    ta.skill_code,
    ta.target_uph,
    hd.work_date,
    hd.iso_dow,
    hd.days_ago,
    abs(hashtext(ta.employee_id || '-' || ta.skill_code)) % 100 as associate_variation
  from tracked_assignments ta
  cross join history_days hd
  where hd.iso_dow between 1 and 6
),
shaped_events as (
  select
    ee.associate_id,
    ee.employee_id,
    ee.skill_id,
    ee.skill_code,
    ee.target_uph,
    ee.work_date,
    case
      when ee.skill_code = 'order_filler' then 'order_fill'
      when ee.skill_code = 'packer_small' then 'pack'
      else 'pick'
    end as task_type,
    case
      when ee.skill_code = 'order_filler' then 5.00
      when ee.shift = 'night' then 4.25
      else 4.00
    end
    + case when ee.iso_dow = 6 then -0.50 else 0 end
    + ((ee.associate_variation % 8) * 0.05) as hours_worked,
    (
      case
        when ee.associate_variation < 18 then 1.14
        when ee.associate_variation < 42 then 1.04
        when ee.associate_variation < 72 then 0.96
        else 0.84
      end
      * case
          when ee.iso_dow between 1 and 4 then 1.02
          when ee.iso_dow = 5 then 0.98
          else 0.88
        end
      * (1 + 0.04 * sin(2 * pi() * ((180 - ee.days_ago)::numeric / 28.0)))
      * (1 + 0.03 * cos(2 * pi() * ((180 - ee.days_ago)::numeric / 7.0)))
    ) as performance_factor,
    case
      when ee.shift = 'night' then (ee.work_date::timestamp at time zone 'America/Chicago') + interval '18 hours'
      else (ee.work_date::timestamp at time zone 'America/Chicago') + interval '7 hours'
    end
    + make_interval(mins => (ee.associate_variation % 25)) as started_at,
    format(
      'hist-%s-%s-%s',
      to_char(ee.work_date, 'YYYYMMDD'),
      ee.employee_id,
      ee.skill_code
    ) as source_ref
  from eligible_events ee
),
event_rows as (
  select
    se.associate_id,
    se.skill_id,
    se.task_type,
    se.source_ref,
    round(
      greatest(
        10,
        coalesce(se.target_uph, 0) * se.hours_worked * se.performance_factor
      )::numeric,
      2
    )::numeric(12,2) as units_completed,
    greatest(
      1,
      round(
        case
          when se.skill_code = 'order_filler' then (coalesce(se.target_uph, 0) * se.hours_worked * se.performance_factor) / 14.0
          else (coalesce(se.target_uph, 0) * se.hours_worked * se.performance_factor) / 6.0
        end
      )::numeric,
      0
    )::int as tasks_completed,
    se.started_at,
    se.started_at + make_interval(secs => greatest(900, floor(se.hours_worked * 3600)::int)) as completed_at
  from shaped_events se
)
insert into public.associate_task_events (
  associate_id,
  skill_id,
  task_type,
  source_ref,
  units_completed,
  tasks_completed,
  started_at,
  completed_at,
  created_at
)
select
  er.associate_id,
  er.skill_id,
  er.task_type,
  er.source_ref,
  er.units_completed,
  er.tasks_completed,
  er.started_at,
  er.completed_at,
  er.completed_at
from event_rows er
where not exists (
  select 1
  from public.associate_task_events existing
  where existing.source_ref = er.source_ref
);
