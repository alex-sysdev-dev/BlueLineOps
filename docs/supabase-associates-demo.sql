create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.associates (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null unique,
  full_name text not null,
  status text not null default 'active',
  shift text,
  team text,
  hired_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.associates
  add column if not exists employee_id text,
  add column if not exists full_name text,
  add column if not exists status text,
  add column if not exists shift text,
  add column if not exists team text,
  add column if not exists hired_on date,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.associates
set
  employee_id = coalesce(employee_id, id::text),
  full_name = coalesce(full_name, 'Unknown Associate'),
  status = coalesce(status, 'active'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where employee_id is null
   or full_name is null
   or status is null
   or created_at is null
   or updated_at is null;

alter table public.associates
  alter column employee_id set not null,
  alter column full_name set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column status set default 'active',
  alter column created_at set default now(),
  alter column updated_at set default now();

create unique index if not exists idx_associates_employee_id
  on public.associates (employee_id);

create table if not exists public.skill_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  skill_category text not null,
  description text,
  is_productivity_tracked boolean not null default false,
  is_equipment boolean not null default false,
  is_attachment boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.associate_skills (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references public.associates(id) on delete cascade,
  skill_id uuid not null references public.skill_definitions(id) on delete cascade,
  status text not null default 'certified',
  trained_at timestamptz,
  certified_at timestamptz,
  expires_at timestamptz,
  trainer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint associate_skills_associate_id_skill_id_key unique (associate_id, skill_id)
);

create table if not exists public.performance_targets (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skill_definitions(id) on delete cascade,
  metric_code text not null,
  target_value numeric(12,2) not null,
  target_unit text not null default 'uph',
  effective_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.associate_task_events (
  id uuid primary key default gen_random_uuid(),
  associate_id uuid not null references public.associates(id) on delete cascade,
  skill_id uuid references public.skill_definitions(id) on delete set null,
  task_type text not null,
  source_ref text,
  units_completed numeric(12,2) not null default 0,
  tasks_completed integer not null default 0,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  duration_seconds integer generated always as (greatest(floor(extract(epoch from (completed_at - started_at))), 0)::integer) stored,
  created_at timestamptz not null default now()
);

insert into public.skill_definitions (
  code,
  label,
  skill_category,
  description,
  is_productivity_tracked,
  is_equipment,
  is_attachment
)
values
  ('picker_small', 'Picker - Small Items', 'role', 'Case and each picking for small-item workflows.', true, false, false),
  ('packer_small', 'Packer - Small Items', 'role', 'Packing and carton closeout for small-item workflows.', true, false, false),
  ('order_filler', 'Order Filler', 'role', 'Large-format item handling such as couches and oversized product.', true, false, false),
  ('loader', 'Loader', 'role', 'Trailer loading and final trailer securement.', false, false, false),
  ('forklift_standard', 'Forklift - Standard', 'equipment', 'Standard sit-down or stand-up forklift authorization.', false, true, false),
  ('reach_truck', 'Reach Truck', 'equipment', 'Reach truck certification for narrow aisle racking.', false, true, false),
  ('center_rider', 'Center Rider', 'equipment', 'Center rider / order picker certification.', false, true, false),
  ('clamp_attachment', 'Clamp Attachment', 'attachment', 'Clamp attachment authorization for machine order filler work.', false, false, true)
on conflict (code) do update
set
  label = excluded.label,
  skill_category = excluded.skill_category,
  description = excluded.description,
  is_productivity_tracked = excluded.is_productivity_tracked,
  is_equipment = excluded.is_equipment,
  is_attachment = excluded.is_attachment,
  updated_at = now();

insert into public.performance_targets (
  skill_id,
  metric_code,
  target_value,
  target_unit,
  effective_at,
  is_active
)
select
  sd.id,
  'uph',
  v.target_value,
  'uph',
  now(),
  true
from (
  values
    ('picker_small', 200.00::numeric),
    ('packer_small', 200.00::numeric),
    ('order_filler', 70.00::numeric)
) as v(code, target_value)
join public.skill_definitions sd
  on sd.code = v.code
where not exists (
  select 1
  from public.performance_targets pt
  where pt.skill_id = sd.id
    and pt.metric_code = 'uph'
    and pt.is_active = true
);

create unique index if not exists idx_performance_targets_active
  on public.performance_targets (skill_id, metric_code)
  where is_active = true;

create index if not exists idx_associate_skills_associate_id
  on public.associate_skills (associate_id);

create index if not exists idx_associate_skills_skill_id
  on public.associate_skills (skill_id);

create index if not exists idx_associate_task_events_associate_id
  on public.associate_task_events (associate_id);

create index if not exists idx_associate_task_events_completed_at
  on public.associate_task_events (completed_at);

create index if not exists idx_associate_task_events_skill_id
  on public.associate_task_events (skill_id);

drop trigger if exists set_associates_updated_at on public.associates;
create trigger set_associates_updated_at
before update on public.associates
for each row execute function public.set_updated_at();

drop trigger if exists set_skill_definitions_updated_at on public.skill_definitions;
create trigger set_skill_definitions_updated_at
before update on public.skill_definitions
for each row execute function public.set_updated_at();

drop trigger if exists set_associate_skills_updated_at on public.associate_skills;
create trigger set_associate_skills_updated_at
before update on public.associate_skills
for each row execute function public.set_updated_at();

drop trigger if exists set_performance_targets_updated_at on public.performance_targets;
create trigger set_performance_targets_updated_at
before update on public.performance_targets
for each row execute function public.set_updated_at();

create or replace view public.associate_skill_matrix as
select
  a.id as associate_id,
  a.employee_id,
  a.full_name,
  a.status,
  a.shift,
  a.team,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', sd.code,
        'label', sd.label,
        'status', ask.status,
        'trained_at', ask.trained_at,
        'certified_at', ask.certified_at,
        'expires_at', ask.expires_at
      )
      order by sd.label
    ) filter (where sd.skill_category = 'role'),
    '[]'::jsonb
  ) as role_skills,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', sd.code,
        'label', sd.label,
        'status', ask.status,
        'trained_at', ask.trained_at,
        'certified_at', ask.certified_at,
        'expires_at', ask.expires_at
      )
      order by sd.label
    ) filter (where sd.skill_category = 'equipment'),
    '[]'::jsonb
  ) as equipment_skills,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', sd.code,
        'label', sd.label,
        'status', ask.status,
        'trained_at', ask.trained_at,
        'certified_at', ask.certified_at,
        'expires_at', ask.expires_at
      )
      order by sd.label
    ) filter (where sd.skill_category = 'attachment'),
    '[]'::jsonb
  ) as attachment_skills
from public.associates a
left join public.associate_skills ask
  on ask.associate_id = a.id
left join public.skill_definitions sd
  on sd.id = ask.skill_id
group by
  a.id,
  a.employee_id,
  a.full_name,
  a.status,
  a.shift,
  a.team;

create or replace view public.associate_daily_performance as
with event_rollup as (
  select
    ate.associate_id,
    a.employee_id,
    a.full_name,
    a.shift,
    a.team,
    sd.id as skill_id,
    sd.code as skill_code,
    sd.label as skill_label,
    (ate.completed_at at time zone 'America/Chicago')::date as performance_date,
    sum(ate.units_completed)::numeric(12,2) as units_completed,
    sum(ate.tasks_completed)::int as tasks_completed,
    sum(ate.duration_seconds)::int as duration_seconds
  from public.associate_task_events ate
  join public.associates a
    on a.id = ate.associate_id
  left join public.skill_definitions sd
    on sd.id = ate.skill_id
  group by
    ate.associate_id,
    a.employee_id,
    a.full_name,
    a.shift,
    a.team,
    sd.id,
    sd.code,
    sd.label,
    (ate.completed_at at time zone 'America/Chicago')::date
),
active_targets as (
  select
    pt.skill_id,
    pt.metric_code,
    pt.target_value,
    pt.target_unit
  from public.performance_targets pt
  where pt.is_active = true
)
select
  er.associate_id,
  er.employee_id,
  er.full_name,
  er.shift,
  er.team,
  er.skill_id,
  er.skill_code,
  er.skill_label,
  er.performance_date,
  er.units_completed,
  er.tasks_completed,
  round((er.duration_seconds::numeric / 3600.0), 2)::numeric(12,2) as hours_worked,
  case
    when er.duration_seconds > 0
      then round((er.units_completed / (er.duration_seconds::numeric / 3600.0)), 2)::numeric(12,2)
    else null::numeric(12,2)
  end as uph,
  at.target_value as target_uph,
  case
    when at.target_value is null then null::numeric(12,2)
    when er.duration_seconds > 0
      then round((er.units_completed / (er.duration_seconds::numeric / 3600.0)) - at.target_value, 2)::numeric(12,2)
    else null::numeric(12,2)
  end as variance_to_target,
  case
    when at.target_value is null then 'not_tracked'
    when er.duration_seconds = 0 then 'no_output'
    when (er.units_completed / (er.duration_seconds::numeric / 3600.0)) < at.target_value * 0.85 then 'below'
    when (er.units_completed / (er.duration_seconds::numeric / 3600.0)) < at.target_value then 'at_risk'
    when (er.units_completed / (er.duration_seconds::numeric / 3600.0)) <= at.target_value * 1.15 then 'on_target'
    else 'above'
  end as performance_band
from event_rollup er
left join active_targets at
  on at.skill_id = er.skill_id
 and at.metric_code = 'uph';

create or replace view public.associate_current_performance as
select
  adp.*
from public.associate_daily_performance adp
where adp.performance_date = (now() at time zone 'America/Chicago')::date;

-- Optional demo seed block. Uncomment and adjust if you want sample associates immediately.
--
-- insert into public.associates (employee_id, full_name, status, shift, team)
-- values
--   ('A1001', 'Jordan Reyes', 'active', 'day', 'pick-pack'),
--   ('A1002', 'Monica Tran', 'active', 'day', 'pack'),
--   ('A1003', 'Darius Cole', 'active', 'day', 'outbound')
-- on conflict (employee_id) do nothing;
