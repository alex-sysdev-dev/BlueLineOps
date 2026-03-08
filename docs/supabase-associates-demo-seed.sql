-- Demo workforce seed for the BlueLineOps Associates dashboard.
-- Safe to rerun: associates are upserted, skills are upserted, and task events
-- are inserted only when the same demo source_ref does not already exist.

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
  ('qa_inspector', 'QA Inspector', 'role', 'Quality assurance inspection and exception handling.', false, false, false),
  ('receiver_unloader', 'Receiver / Unloader', 'role', 'Inbound unload and receiving support.', false, false, false)
on conflict (code) do update
set
  label = excluded.label,
  skill_category = excluded.skill_category,
  description = excluded.description,
  is_productivity_tracked = excluded.is_productivity_tracked,
  is_equipment = excluded.is_equipment,
  is_attachment = excluded.is_attachment,
  updated_at = now();

with associate_seed as (
  select *
  from (
    values
      ('D1001', 'Mia Torres', 'active', 'day', 'pick-pack'),
      ('D1002', 'Logan Price', 'active', 'day', 'pick-pack'),
      ('D1003', 'Aria Bennett', 'active', 'day', 'pick-pack'),
      ('D1004', 'Isaac Brooks', 'active', 'day', 'pick-pack'),
      ('D1005', 'Chloe Diaz', 'active', 'day', 'pick-pack'),
      ('D1006', 'Noah Foster', 'active', 'day', 'pick-pack'),
      ('D1007', 'Ava Parker', 'active', 'day', 'pack'),
      ('D1008', 'Ethan Cole', 'active', 'day', 'pack'),
      ('D1009', 'Harper Reed', 'active', 'day', 'pack'),
      ('D1010', 'Mason Kelly', 'active', 'day', 'pack'),
      ('D1011', 'Zoe Morris', 'active', 'day', 'order-filler'),
      ('D1012', 'Lucas Hayes', 'active', 'day', 'order-filler'),
      ('D1013', 'Camila Ortiz', 'active', 'day', 'dock'),
      ('D1014', 'Jack Ward', 'active', 'day', 'dock'),
      ('D1015', 'Nia James', 'active', 'day', 'qa'),
      ('D1016', 'Owen Cruz', 'active', 'day', 'qa'),
      ('D1017', 'Ella Kim', 'active', 'day', 'inbound'),
      ('D1018', 'Liam Scott', 'active', 'day', 'inbound'),
      ('N2001', 'Sofia Mitchell', 'active', 'night', 'pick-pack'),
      ('N2002', 'Caleb Hughes', 'active', 'night', 'pick-pack'),
      ('N2003', 'Riley Perry', 'active', 'night', 'pick-pack'),
      ('N2004', 'Wyatt Cook', 'active', 'night', 'pick-pack'),
      ('N2005', 'Layla Ward', 'active', 'night', 'pack'),
      ('N2006', 'Hudson Ross', 'active', 'night', 'pack'),
      ('N2007', 'Nora Price', 'active', 'night', 'pack'),
      ('N2008', 'Eli Richardson', 'active', 'night', 'pack'),
      ('N2009', 'Grace Bennett', 'active', 'night', 'order-filler'),
      ('N2010', 'Carter Diaz', 'active', 'night', 'order-filler'),
      ('N2011', 'Maya Powell', 'active', 'night', 'dock'),
      ('N2012', 'Levi Sanders', 'active', 'night', 'dock'),
      ('N2013', 'Stella Myers', 'active', 'night', 'qa'),
      ('N2014', 'Julian Bell', 'active', 'night', 'qa')
  ) as seed(employee_id, full_name, status, shift, team)
)
insert into public.associates (employee_id, full_name, status, shift, team, created_at, updated_at)
select
  employee_id,
  full_name,
  status,
  shift,
  team,
  now(),
  now()
from associate_seed
on conflict (employee_id) do update
set
  full_name = excluded.full_name,
  status = excluded.status,
  shift = excluded.shift,
  team = excluded.team,
  updated_at = now();

with skill_seed as (
  select *
  from (
    values
      ('D1001', 'picker_small'), ('D1001', 'center_rider'), ('D1001', 'reach_truck'),
      ('D1002', 'picker_small'), ('D1002', 'center_rider'),
      ('D1003', 'picker_small'), ('D1003', 'center_rider'),
      ('D1004', 'picker_small'), ('D1004', 'center_rider'),
      ('D1005', 'picker_small'), ('D1005', 'center_rider'),
      ('D1006', 'picker_small'), ('D1006', 'center_rider'), ('D1006', 'forklift_standard'),
      ('D1007', 'packer_small'),
      ('D1008', 'packer_small'),
      ('D1009', 'packer_small'),
      ('D1010', 'packer_small'),
      ('D1011', 'order_filler'), ('D1011', 'forklift_standard'), ('D1011', 'clamp_attachment'),
      ('D1012', 'order_filler'), ('D1012', 'forklift_standard'), ('D1012', 'clamp_attachment'),
      ('D1013', 'loader'), ('D1013', 'forklift_standard'),
      ('D1014', 'loader'), ('D1014', 'forklift_standard'),
      ('D1015', 'qa_inspector'),
      ('D1016', 'qa_inspector'),
      ('D1017', 'receiver_unloader'), ('D1017', 'forklift_standard'), ('D1017', 'reach_truck'),
      ('D1018', 'receiver_unloader'), ('D1018', 'forklift_standard'),
      ('N2001', 'picker_small'), ('N2001', 'center_rider'),
      ('N2002', 'picker_small'), ('N2002', 'center_rider'),
      ('N2003', 'picker_small'), ('N2003', 'center_rider'), ('N2003', 'reach_truck'),
      ('N2004', 'picker_small'), ('N2004', 'center_rider'),
      ('N2005', 'packer_small'),
      ('N2006', 'packer_small'),
      ('N2007', 'packer_small'),
      ('N2008', 'packer_small'),
      ('N2009', 'order_filler'), ('N2009', 'forklift_standard'), ('N2009', 'clamp_attachment'),
      ('N2010', 'order_filler'), ('N2010', 'forklift_standard'), ('N2010', 'clamp_attachment'),
      ('N2011', 'loader'), ('N2011', 'forklift_standard'),
      ('N2012', 'loader'), ('N2012', 'forklift_standard'),
      ('N2013', 'qa_inspector'),
      ('N2014', 'qa_inspector')
  ) as seed(employee_id, skill_code)
)
insert into public.associate_skills (
  associate_id,
  skill_id,
  status,
  trained_at,
  certified_at,
  created_at,
  updated_at
)
select
  a.id,
  sd.id,
  'certified',
  now() - interval '180 days',
  now() - interval '150 days',
  now(),
  now()
from skill_seed ss
join public.associates a
  on a.employee_id = ss.employee_id
join public.skill_definitions sd
  on sd.code = ss.skill_code
on conflict (associate_id, skill_id) do update
set
  status = excluded.status,
  trained_at = excluded.trained_at,
  certified_at = excluded.certified_at,
  updated_at = now();

with task_seed as (
  select *
  from (
    values
      ('demo-D1001-picker', 'D1001', 'picker_small', 'pick', 920.00::numeric, 184, 240, 30),
      ('demo-D1002-picker', 'D1002', 'picker_small', 'pick', 840.00::numeric, 168, 240, 45),
      ('demo-D1003-picker', 'D1003', 'picker_small', 'pick', 780.00::numeric, 156, 240, 60),
      ('demo-D1004-picker', 'D1004', 'picker_small', 'pick', 720.00::numeric, 144, 240, 75),
      ('demo-D1005-picker', 'D1005', 'picker_small', 'pick', 660.00::numeric, 132, 240, 90),
      ('demo-D1006-picker', 'D1006', 'picker_small', 'pick', 960.00::numeric, 192, 240, 105),
      ('demo-D1007-packer', 'D1007', 'packer_small', 'pack', 880.00::numeric, 176, 240, 40),
      ('demo-D1008-packer', 'D1008', 'packer_small', 'pack', 810.00::numeric, 162, 240, 55),
      ('demo-D1009-packer', 'D1009', 'packer_small', 'pack', 760.00::numeric, 152, 240, 70),
      ('demo-D1010-packer', 'D1010', 'packer_small', 'pack', 680.00::numeric, 136, 240, 85),
      ('demo-D1011-filler', 'D1011', 'order_filler', 'order_fill', 390.00::numeric, 30, 300, 65),
      ('demo-D1012-filler', 'D1012', 'order_filler', 'order_fill', 310.00::numeric, 24, 300, 95),
      ('demo-N2001-picker', 'N2001', 'picker_small', 'pick', 870.00::numeric, 174, 240, 50),
      ('demo-N2002-picker', 'N2002', 'picker_small', 'pick', 800.00::numeric, 160, 240, 80),
      ('demo-N2003-picker', 'N2003', 'picker_small', 'pick', 700.00::numeric, 140, 240, 110),
      ('demo-N2004-picker', 'N2004', 'picker_small', 'pick', 980.00::numeric, 196, 240, 140),
      ('demo-N2005-packer', 'N2005', 'packer_small', 'pack', 860.00::numeric, 172, 240, 35),
      ('demo-N2006-packer', 'N2006', 'packer_small', 'pack', 790.00::numeric, 158, 240, 65),
      ('demo-N2007-packer', 'N2007', 'packer_small', 'pack', 730.00::numeric, 146, 240, 95),
      ('demo-N2008-packer', 'N2008', 'packer_small', 'pack', 620.00::numeric, 124, 240, 125),
      ('demo-N2009-filler', 'N2009', 'order_filler', 'order_fill', 360.00::numeric, 27, 300, 90),
      ('demo-N2010-filler', 'N2010', 'order_filler', 'order_fill', 265.00::numeric, 20, 300, 120)
  ) as seed(source_ref, employee_id, skill_code, task_type, units_completed, tasks_completed, duration_minutes, completed_offset_minutes)
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
  a.id,
  sd.id,
  ts.task_type,
  ts.source_ref,
  ts.units_completed,
  ts.tasks_completed,
  now() - make_interval(mins => ts.completed_offset_minutes + ts.duration_minutes),
  now() - make_interval(mins => ts.completed_offset_minutes),
  now()
from task_seed ts
join public.associates a
  on a.employee_id = ts.employee_id
join public.skill_definitions sd
  on sd.code = ts.skill_code
where not exists (
  select 1
  from public.associate_task_events existing
  where existing.source_ref = ts.source_ref
);
