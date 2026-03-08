create extension if not exists pgcrypto;

create table if not exists public.facility_layouts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  facility_area text not null,
  width_units numeric(10,2) not null,
  height_units numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_layout_items (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.facility_layouts(id) on delete cascade,
  item_code text not null,
  item_label text not null,
  item_type text not null,
  x numeric(10,2) not null,
  y numeric(10,2) not null,
  w numeric(10,2) not null,
  h numeric(10,2) not null,
  rotation_deg numeric(10,2),
  zone text,
  shape text,
  color text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint facility_layout_items_layout_code_key unique (layout_id, item_code)
);

create index if not exists idx_facility_layout_items_layout_id
  on public.facility_layout_items (layout_id, sort_order);

with layout_seed as (
  select *
  from (
    values
      ('pick_pack_main', 'BlueLineOps Pick/Pack Layout', 'pick_pack', 100.00::numeric, 100.00::numeric),
      ('yard_main', 'BlueLineOps Yard Layout', 'yard', 160.00::numeric, 110.00::numeric)
  ) as seed(code, name, facility_area, width_units, height_units)
)
insert into public.facility_layouts (code, name, facility_area, width_units, height_units)
select code, name, facility_area, width_units, height_units
from layout_seed
on conflict (code) do update
set
  name = excluded.name,
  facility_area = excluded.facility_area,
  width_units = excluded.width_units,
  height_units = excluded.height_units,
  updated_at = now();

with pick_pack_items as (
  select
    fl.id as layout_id,
    seed.*
  from public.facility_layouts fl
  join (
    values
      ('staging_north_west', 'STAGING_NORTH_WEST', 'staging', 5.00::numeric, 4.00::numeric, 27.00::numeric, 12.00::numeric, 10),
      ('staging_north_east', 'STAGING_NORTH_EAST', 'staging', 59.00::numeric, 4.00::numeric, 27.00::numeric, 12.00::numeric, 20),
      ('pick_north_west', 'PICK_NORTH_WEST', 'pick_block', 5.00::numeric, 18.00::numeric, 35.00::numeric, 17.00::numeric, 30),
      ('pick_north_east', 'PICK_NORTH_EAST', 'pick_block', 48.00::numeric, 18.00::numeric, 38.00::numeric, 17.00::numeric, 40),
      ('center_cross_aisle', 'CENTER_CROSS_AISLE', 'aisle', 0.00::numeric, 40.00::numeric, 100.00::numeric, 8.00::numeric, 50),
      ('center_spine', 'CENTER_SPINE', 'aisle', 42.00::numeric, 0.00::numeric, 4.00::numeric, 100.00::numeric, 60),
      ('qa_west', 'QA_WEST', 'qa', 5.00::numeric, 54.00::numeric, 15.00::numeric, 14.00::numeric, 70),
      ('qa_east', 'QA_EAST', 'qa', 72.00::numeric, 54.00::numeric, 13.00::numeric, 14.00::numeric, 80),
      ('conveyor_east_west', 'CONVEYOR_EAST_WEST', 'conveyor', 31.00::numeric, 59.00::numeric, 38.00::numeric, 9.00::numeric, 90),
      ('pack_south_west', 'PACK_SOUTH_WEST', 'pack_block', 5.00::numeric, 72.00::numeric, 30.00::numeric, 22.00::numeric, 100),
      ('pack_south_east', 'PACK_SOUTH_EAST', 'pack_block', 56.00::numeric, 72.00::numeric, 30.00::numeric, 22.00::numeric, 110),
      ('south_wall', 'SOUTH_WALL', 'wall', 0.00::numeric, 94.00::numeric, 100.00::numeric, 6.00::numeric, 120)
  ) as seed(item_code, item_label, item_type, x, y, w, h, sort_order)
    on fl.code = 'pick_pack_main'
),
yard_items as (
  select
    fl.id as layout_id,
    seed.*
  from public.facility_layouts fl
  join (
    values
      ('yard_loop_road', 'YARD_LOOP_ROAD', 'drive_lane', 2.00::numeric, 2.00::numeric, 156.00::numeric, 106.00::numeric, 10),
      ('outbound_doors_west', 'OUTBOUND_DOORS_WEST', 'dock_group', 10.00::numeric, 10.00::numeric, 40.00::numeric, 12.00::numeric, 20),
      ('flex_doors_outbound_west', 'FLEX_DOORS_OUTBOUND_WEST', 'flex_group', 51.00::numeric, 10.00::numeric, 18.00::numeric, 10.00::numeric, 30),
      ('flex_doors_outbound_east', 'FLEX_DOORS_OUTBOUND_EAST', 'flex_group', 71.00::numeric, 10.00::numeric, 18.00::numeric, 10.00::numeric, 40),
      ('outbound_doors_east', 'OUTBOUND_DOORS_EAST', 'dock_group', 96.00::numeric, 10.00::numeric, 38.00::numeric, 12.00::numeric, 50),
      ('trailer_row_north_west', 'TRAILER_ROW_NORTH_WEST', 'trailer_group', 18.00::numeric, 27.00::numeric, 50.00::numeric, 9.00::numeric, 60),
      ('trailer_row_north_east', 'TRAILER_ROW_NORTH_EAST', 'trailer_group', 92.00::numeric, 27.00::numeric, 42.00::numeric, 9.00::numeric, 70),
      ('warehouse_main', 'WAREHOUSE_MAIN', 'building', 34.00::numeric, 38.00::numeric, 88.00::numeric, 22.00::numeric, 80),
      ('inbound_doors_west', 'INBOUND_DOORS_WEST', 'dock_group', 35.00::numeric, 60.00::numeric, 31.00::numeric, 8.00::numeric, 90),
      ('flex_doors_inbound_center', 'FLEX_DOORS_INBOUND_CENTER', 'flex_group', 67.00::numeric, 60.00::numeric, 26.00::numeric, 8.00::numeric, 100),
      ('inbound_doors_east', 'INBOUND_DOORS_EAST', 'dock_group', 94.00::numeric, 60.00::numeric, 31.00::numeric, 8.00::numeric, 110),
      ('trailer_row_south_west', 'TRAILER_ROW_SOUTH_WEST', 'trailer_group', 34.00::numeric, 76.00::numeric, 44.00::numeric, 9.00::numeric, 120),
      ('trailer_row_south_east', 'TRAILER_ROW_SOUTH_EAST', 'trailer_group', 90.00::numeric, 76.00::numeric, 48.00::numeric, 9.00::numeric, 130),
      ('trailer_row_lower_west', 'TRAILER_ROW_LOWER_WEST', 'trailer_group', 28.00::numeric, 88.00::numeric, 50.00::numeric, 9.00::numeric, 140),
      ('trailer_row_lower_east', 'TRAILER_ROW_LOWER_EAST', 'trailer_group', 90.00::numeric, 88.00::numeric, 50.00::numeric, 9.00::numeric, 150),
      ('inbound_gate', 'INBOUND_GATE', 'gate', 18.00::numeric, 100.00::numeric, 20.00::numeric, 6.00::numeric, 160),
      ('outbound_gate', 'OUTBOUND_GATE', 'gate', 118.00::numeric, 100.00::numeric, 22.00::numeric, 6.00::numeric, 170)
  ) as seed(item_code, item_label, item_type, x, y, w, h, sort_order)
    on fl.code = 'yard_main'
),
all_items as (
  select * from pick_pack_items
  union all
  select * from yard_items
)
insert into public.facility_layout_items (
  layout_id,
  item_code,
  item_label,
  item_type,
  x,
  y,
  w,
  h,
  zone,
  shape,
  color,
  sort_order
)
select
  layout_id,
  item_code,
  item_label,
  item_type,
  x,
  y,
  w,
  h,
  null,
  'rect',
  null,
  sort_order
from all_items
on conflict (layout_id, item_code) do update
set
  item_label = excluded.item_label,
  item_type = excluded.item_type,
  x = excluded.x,
  y = excluded.y,
  w = excluded.w,
  h = excluded.h,
  zone = excluded.zone,
  shape = excluded.shape,
  color = excluded.color,
  sort_order = excluded.sort_order,
  updated_at = now();
