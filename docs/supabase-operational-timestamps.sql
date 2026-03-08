-- Supabase operational timestamp standardization for the executive control center.
-- Assumption: any existing "timestamp without time zone" values are stored in UTC.
-- If your legacy values are stored in local warehouse time, adjust the USING clause
-- in public.ensure_timestamptz_column() before running this script.

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

create or replace function public.ensure_timestamptz_column(
  p_schema_name text,
  p_table_name text,
  p_column_name text,
  p_default_now boolean default false
)
returns void
language plpgsql
as $$
declare
  v_data_type text;
  v_sql text;
begin
  select c.data_type
  into v_data_type
  from information_schema.columns c
  where c.table_schema = p_schema_name
    and c.table_name = p_table_name
    and c.column_name = p_column_name;

  if v_data_type is null then
    v_sql := format(
      'alter table %I.%I add column %I timestamptz%s',
      p_schema_name,
      p_table_name,
      p_column_name,
      case when p_default_now then ' default now()' else '' end
    );
    execute v_sql;
  elsif v_data_type <> 'timestamp with time zone' then
    if v_data_type = 'timestamp without time zone' then
      v_sql := format(
        'alter table %I.%I alter column %I type timestamptz using case when %I is null then null else %I at time zone ''UTC'' end',
        p_schema_name,
        p_table_name,
        p_column_name,
        p_column_name,
        p_column_name
      );
    else
      v_sql := format(
        'alter table %I.%I alter column %I type timestamptz using %I::timestamptz',
        p_schema_name,
        p_table_name,
        p_column_name,
        p_column_name
      );
    end if;

    execute v_sql;
  end if;

  if p_default_now then
    execute format(
      'alter table %I.%I alter column %I set default now()',
      p_schema_name,
      p_table_name,
      p_column_name
    );
  end if;
end;
$$;

create or replace function public.ensure_updated_at_trigger(
  p_schema_name text,
  p_table_name text
)
returns void
language plpgsql
as $$
declare
  v_trigger_name text;
begin
  if to_regclass(format('%I.%I', p_schema_name, p_table_name)) is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = p_schema_name
      and table_name = p_table_name
      and column_name = 'updated_at'
  ) then
    return;
  end if;

  v_trigger_name := format('set_%s_updated_at', p_table_name);

  execute format('drop trigger if exists %I on %I.%I', v_trigger_name, p_schema_name, p_table_name);
  execute format(
    'create trigger %I before update on %I.%I for each row execute function public.set_updated_at()',
    v_trigger_name,
    p_schema_name,
    p_table_name
  );
end;
$$;

create or replace function public.ensure_index_on_column(
  p_schema_name text,
  p_table_name text,
  p_index_name text,
  p_column_name text
)
returns void
language plpgsql
as $$
begin
  if to_regclass(format('%I.%I', p_schema_name, p_table_name)) is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = p_schema_name
      and table_name = p_table_name
      and column_name = p_column_name
  ) then
    return;
  end if;

  execute format(
    'create index if not exists %I on %I.%I (%I)',
    p_index_name,
    p_schema_name,
    p_table_name,
    p_column_name
  );
end;
$$;

-- Optional operational tables referenced by the control center.

create table if not exists public.putaway_tasks (
  id uuid primary key default gen_random_uuid(),
  status text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  due_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.trailer_moves (
  id uuid primary key default gen_random_uuid(),
  trailer_id uuid not null,
  from_spot_id uuid,
  to_spot_id uuid not null,
  moved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.dock_events (
  id uuid primary key default gen_random_uuid(),
  trailer_id uuid,
  order_id uuid,
  yard_spot_id uuid,
  event_type text,
  assigned_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labor_time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  department text,
  cost_center text,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.safety_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number text unique,
  employee_id text,
  area text,
  severity text,
  description text,
  occurred_at timestamptz not null,
  reported_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing or expected operational tables.

do $$
begin
  if to_regclass('public.orders') is not null then
    perform public.ensure_timestamptz_column('public', 'orders', 'created_at', true);
    perform public.ensure_timestamptz_column('public', 'orders', 'cpt_at');
    perform public.ensure_timestamptz_column('public', 'orders', 'picked_at');
    perform public.ensure_timestamptz_column('public', 'orders', 'packed_at');
    perform public.ensure_timestamptz_column('public', 'orders', 'loaded_at');
    perform public.ensure_timestamptz_column('public', 'orders', 'shipped_at');
    perform public.ensure_timestamptz_column('public', 'orders', 'cancelled_at');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.pick_tasks') is not null then
    perform public.ensure_timestamptz_column('public', 'pick_tasks', 'created_at', true);
    perform public.ensure_timestamptz_column('public', 'pick_tasks', 'assigned_at');
    perform public.ensure_timestamptz_column('public', 'pick_tasks', 'started_at');
    perform public.ensure_timestamptz_column('public', 'pick_tasks', 'completed_at');
    perform public.ensure_timestamptz_column('public', 'pick_tasks', 'due_at');
    perform public.ensure_timestamptz_column('public', 'pick_tasks', 'updated_at', true);
  end if;
end;
$$;

do $$
begin
  perform public.ensure_timestamptz_column('public', 'putaway_tasks', 'created_at', true);
  perform public.ensure_timestamptz_column('public', 'putaway_tasks', 'started_at');
  perform public.ensure_timestamptz_column('public', 'putaway_tasks', 'completed_at');
  perform public.ensure_timestamptz_column('public', 'putaway_tasks', 'due_at');
  perform public.ensure_timestamptz_column('public', 'putaway_tasks', 'updated_at', true);
end;
$$;

do $$
begin
  if to_regclass('public.trailers') is not null then
    perform public.ensure_timestamptz_column('public', 'trailers', 'arrived_at');
    perform public.ensure_timestamptz_column('public', 'trailers', 'departed_at');
    perform public.ensure_timestamptz_column('public', 'trailers', 'updated_at', true);
  end if;
end;
$$;

do $$
begin
  perform public.ensure_timestamptz_column('public', 'trailer_moves', 'moved_at', true);
end;
$$;

do $$
begin
  perform public.ensure_timestamptz_column('public', 'dock_events', 'assigned_at');
  perform public.ensure_timestamptz_column('public', 'dock_events', 'started_at');
  perform public.ensure_timestamptz_column('public', 'dock_events', 'ended_at');
end;
$$;

do $$
begin
  if to_regclass('public.qa_inspections') is not null then
    perform public.ensure_timestamptz_column('public', 'qa_inspections', 'inspected_at');
    perform public.ensure_timestamptz_column('public', 'qa_inspections', 'created_at', true);
    perform public.ensure_timestamptz_column('public', 'qa_inspections', 'updated_at', true);
  end if;
end;
$$;

do $$
begin
  perform public.ensure_timestamptz_column('public', 'labor_time_entries', 'clock_in_at');
  perform public.ensure_timestamptz_column('public', 'labor_time_entries', 'clock_out_at');
end;
$$;

do $$
begin
  perform public.ensure_timestamptz_column('public', 'safety_incidents', 'occurred_at');
  perform public.ensure_timestamptz_column('public', 'safety_incidents', 'reported_at');
  perform public.ensure_timestamptz_column('public', 'safety_incidents', 'resolved_at');
end;
$$;

do $$
begin
  if to_regclass('public.cpt_windows') is not null then
    perform public.ensure_timestamptz_column('public', 'cpt_windows', 'created_at', true);
    perform public.ensure_timestamptz_column('public', 'cpt_windows', 'updated_at', true);
  end if;
end;
$$;

select public.ensure_updated_at_trigger('public', 'pick_tasks');
select public.ensure_updated_at_trigger('public', 'putaway_tasks');
select public.ensure_updated_at_trigger('public', 'trailers');
select public.ensure_updated_at_trigger('public', 'dock_events');
select public.ensure_updated_at_trigger('public', 'qa_inspections');
select public.ensure_updated_at_trigger('public', 'labor_time_entries');
select public.ensure_updated_at_trigger('public', 'safety_incidents');
select public.ensure_updated_at_trigger('public', 'cpt_windows');

select public.ensure_index_on_column('public', 'orders', 'idx_orders_cpt_at', 'cpt_at');
select public.ensure_index_on_column('public', 'orders', 'idx_orders_shipped_at', 'shipped_at');
select public.ensure_index_on_column('public', 'pick_tasks', 'idx_pick_tasks_due_at', 'due_at');
select public.ensure_index_on_column('public', 'pick_tasks', 'idx_pick_tasks_completed_at', 'completed_at');
select public.ensure_index_on_column('public', 'putaway_tasks', 'idx_putaway_tasks_due_at', 'due_at');
select public.ensure_index_on_column('public', 'trailers', 'idx_trailers_arrived_at', 'arrived_at');
select public.ensure_index_on_column('public', 'trailer_moves', 'idx_trailer_moves_moved_at', 'moved_at');
select public.ensure_index_on_column('public', 'dock_events', 'idx_dock_events_started_at', 'started_at');
select public.ensure_index_on_column('public', 'qa_inspections', 'idx_qa_inspections_inspected_at', 'inspected_at');
select public.ensure_index_on_column('public', 'labor_time_entries', 'idx_labor_time_entries_clock_in_at', 'clock_in_at');
select public.ensure_index_on_column('public', 'safety_incidents', 'idx_safety_incidents_occurred_at', 'occurred_at');
