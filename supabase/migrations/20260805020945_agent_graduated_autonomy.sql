create extension if not exists pgcrypto;

create table if not exists public.agent_definitions (
  agent_key text primary key,
  display_name text not null,
  purpose text not null,
  default_autonomy_level smallint not null default 2,
  default_action_type text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_definitions_autonomy_level_check
    check (default_autonomy_level between 1 and 4)
);

create table if not exists public.agent_facility_configs (
  id uuid primary key default gen_random_uuid(),
  facility_id text not null,
  agent_key text not null references public.agent_definitions(agent_key),
  enabled boolean not null default true,
  autonomy_level smallint not null default 2,
  minimum_confidence numeric(5,4) not null default 0.7500,
  stale_after_minutes integer not null default 30,
  approver_roles text[] not null default array['admin']::text[],
  allowed_reversible_actions text[] not null default array[]::text[],
  execution_mode text not null default 'simulation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_facility_configs_unique unique (facility_id, agent_key),
  constraint agent_facility_configs_autonomy_level_check check (autonomy_level between 1 and 4),
  constraint agent_facility_configs_confidence_check check (minimum_confidence between 0 and 1),
  constraint agent_facility_configs_stale_after_check check (stale_after_minutes between 1 and 1440),
  constraint agent_facility_configs_execution_mode_check check (execution_mode in ('simulation', 'production')),
  constraint agent_facility_configs_approver_roles_check check (approver_roles <@ array['admin']::text[])
);

create table if not exists public.agent_recommendations (
  id uuid primary key default gen_random_uuid(),
  facility_id text not null,
  agent_key text not null references public.agent_definitions(agent_key),
  agent_identity text not null,
  agent_version text not null,
  recommended_action text not null,
  action_type text,
  evidence jsonb not null,
  affected_entities jsonb not null default '[]'::jsonb,
  affected_entity_keys text[] not null default array[]::text[],
  expected_kpi_impact jsonb not null,
  confidence_score numeric(5,4) not null,
  risk_level text not null,
  required_approval_level smallint not null default 3,
  rollback_instructions text not null,
  execution_mode text not null default 'simulation',
  safeguard_flags text[] not null default array[]::text[],
  status text not null default 'proposed',
  data_observed_at timestamptz not null,
  expires_at timestamptz not null,
  approved_at timestamptz,
  approved_by uuid,
  rejected_at timestamptz,
  rejected_by uuid,
  executed_at timestamptz,
  rolled_back_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_recommendations_action_check check (length(trim(recommended_action)) > 0),
  constraint agent_recommendations_identity_check check (length(trim(agent_identity)) > 0),
  constraint agent_recommendations_evidence_check
    check (jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) > 0),
  constraint agent_recommendations_affected_entities_check check (jsonb_typeof(affected_entities) = 'array'),
  constraint agent_recommendations_kpi_impact_check
    check (jsonb_typeof(expected_kpi_impact) = 'array' and jsonb_array_length(expected_kpi_impact) > 0),
  constraint agent_recommendations_confidence_check check (confidence_score between 0 and 1),
  constraint agent_recommendations_risk_level_check check (risk_level in ('low', 'medium', 'high', 'critical')),
  constraint agent_recommendations_approval_level_check check (required_approval_level between 1 and 4),
  constraint agent_recommendations_state_change_approval_check
    check (action_type is null or required_approval_level >= 3),
  constraint agent_recommendations_rollback_check check (length(trim(rollback_instructions)) > 0),
  constraint agent_recommendations_execution_mode_check check (execution_mode in ('simulation', 'production')),
  constraint agent_recommendations_status_check
    check (status in ('proposed', 'approved', 'rejected', 'executed', 'rolled_back', 'expired')),
  constraint agent_recommendations_safeguard_flags_check
    check (
      safeguard_flags <@ array[
        'low_confidence',
        'conflicting_recommendation',
        'stale_data',
        'missing_evidence',
        'unsupported_action',
        'clarification_requested'
      ]::text[]
    ),
  constraint agent_recommendations_expiry_check check (expires_at > data_observed_at)
);

create table if not exists public.agent_action_executions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null unique references public.agent_recommendations(id),
  action_type text not null,
  execution_mode text not null,
  execution_payload jsonb not null default '{}'::jsonb,
  rollback_payload jsonb not null default '{}'::jsonb,
  executed_by uuid,
  executed_by_email text,
  executed_at timestamptz not null default now(),
  rolled_back_by uuid,
  rolled_back_by_email text,
  rolled_back_at timestamptz,
  constraint agent_action_executions_mode_check check (execution_mode in ('simulation', 'production'))
);

create table if not exists public.agent_recommendation_audit (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.agent_recommendations(id),
  event_type text not null,
  from_status text,
  to_status text not null,
  actor_id uuid,
  actor_email text,
  actor_role text not null,
  actor_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint agent_recommendation_audit_event_check
    check (
      event_type in (
        'recommendation_created',
        'clarification_requested',
        'recommendation_approved',
        'recommendation_rejected',
        'action_executed',
        'action_rolled_back',
        'recommendation_expired'
      )
    ),
  constraint agent_recommendation_audit_status_check
    check (
      (from_status is null or from_status in ('proposed', 'approved', 'rejected', 'executed', 'rolled_back', 'expired'))
      and to_status in ('proposed', 'approved', 'rejected', 'executed', 'rolled_back', 'expired')
    ),
  constraint agent_recommendation_audit_actor_role_check check (actor_role in ('admin', 'viewer', 'agent', 'system')),
  constraint agent_recommendation_audit_actor_type_check check (actor_type in ('user', 'agent', 'system'))
);

create index if not exists agent_recommendations_facility_status_idx
  on public.agent_recommendations (facility_id, status, created_at desc);

create index if not exists agent_recommendations_agent_status_idx
  on public.agent_recommendations (agent_key, status, created_at desc);

create index if not exists agent_recommendations_affected_keys_idx
  on public.agent_recommendations using gin (affected_entity_keys);

create index if not exists agent_recommendation_audit_history_idx
  on public.agent_recommendation_audit (recommendation_id, created_at asc);

insert into public.agent_definitions (
  agent_key,
  display_name,
  purpose,
  default_autonomy_level,
  default_action_type
)
values
  (
    'wave-risk',
    'Wave Risk Agent',
    'Identify waves at risk and explain the evidence before work is released.',
    2,
    'wave.stage_release_hold'
  ),
  (
    'dock-exception',
    'Dock Exception Agent',
    'Identify dock exceptions without dispatching or redirecting equipment.',
    2,
    'dock.stage_dispatch_hold'
  ),
  (
    'labor-reallocation',
    'Labor Reallocation Agent',
    'Recommend labor moves without reassigning associates.',
    2,
    'labor.stage_reallocation'
  ),
  (
    'inventory-discrepancy',
    'Inventory Discrepancy Agent',
    'Identify inventory discrepancies without changing on-hand balances.',
    2,
    'inventory.stage_cycle_count'
  )
on conflict (agent_key) do update
set
  display_name = excluded.display_name,
  purpose = excluded.purpose,
  default_autonomy_level = excluded.default_autonomy_level,
  default_action_type = excluded.default_action_type,
  updated_at = now();

insert into public.agent_facility_configs (
  facility_id,
  agent_key,
  enabled,
  autonomy_level,
  minimum_confidence,
  stale_after_minutes,
  approver_roles,
  allowed_reversible_actions,
  execution_mode
)
values
  ('default', 'wave-risk', true, 2, 0.7500, 30, array['admin'], array['wave.stage_release_hold'], 'simulation'),
  ('default', 'dock-exception', true, 2, 0.8000, 20, array['admin'], array['dock.stage_dispatch_hold'], 'simulation'),
  ('default', 'labor-reallocation', true, 2, 0.8500, 15, array['admin'], array['labor.stage_reallocation'], 'simulation'),
  ('default', 'inventory-discrepancy', true, 2, 0.9000, 60, array['admin'], array['inventory.stage_cycle_count'], 'simulation')
on conflict (facility_id, agent_key) do nothing;

create or replace function public.prevent_agent_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Agent audit history is append-only.';
end;
$$;

drop trigger if exists agent_recommendation_audit_immutable on public.agent_recommendation_audit;
create trigger agent_recommendation_audit_immutable
before update or delete on public.agent_recommendation_audit
for each row execute function public.prevent_agent_audit_mutation();

create or replace function public.create_agent_recommendation(
  p_facility_id text,
  p_agent_key text,
  p_agent_identity text,
  p_agent_version text,
  p_recommended_action text,
  p_action_type text,
  p_evidence jsonb,
  p_affected_entities jsonb,
  p_affected_entity_keys text[],
  p_expected_kpi_impact jsonb,
  p_confidence_score numeric,
  p_risk_level text,
  p_required_approval_level smallint,
  p_rollback_instructions text,
  p_execution_mode text,
  p_data_observed_at timestamptz,
  p_expires_at timestamptz
)
returns public.agent_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config public.agent_facility_configs;
  v_recommendation public.agent_recommendations;
  v_flags text[] := array[]::text[];
begin
  select *
  into v_config
  from public.agent_facility_configs
  where facility_id = p_facility_id
    and agent_key = p_agent_key;

  if not found or not v_config.enabled then
    raise exception 'Agent is not enabled for this facility.';
  end if;

  if v_config.autonomy_level < 2 then
    raise exception 'This agent is configured for observe-and-explain only.';
  end if;

  if p_execution_mode <> v_config.execution_mode then
    raise exception 'Recommendation execution mode does not match facility configuration.';
  end if;

  if jsonb_typeof(p_evidence) <> 'array' or jsonb_array_length(p_evidence) = 0 then
    raise exception 'Evidence is required.';
  end if;

  if jsonb_typeof(p_expected_kpi_impact) <> 'array' or jsonb_array_length(p_expected_kpi_impact) = 0 then
    raise exception 'Expected KPI impact is required.';
  end if;

  if p_action_type is not null and p_required_approval_level < 3 then
    raise exception 'State-changing recommendations require supervisor approval.';
  end if;

  if p_confidence_score < v_config.minimum_confidence then
    v_flags := array_append(v_flags, 'low_confidence');
  end if;

  if p_data_observed_at + make_interval(mins => v_config.stale_after_minutes) <= now()
    or p_expires_at <= now()
  then
    v_flags := array_append(v_flags, 'stale_data');
  end if;

  if p_action_type is not null and not (p_action_type = any(v_config.allowed_reversible_actions)) then
    v_flags := array_append(v_flags, 'unsupported_action');
  end if;

  if cardinality(coalesce(p_affected_entity_keys, array[]::text[])) > 0 and exists (
    select 1
    from public.agent_recommendations existing
    where existing.facility_id = p_facility_id
      and existing.status in ('proposed', 'approved', 'executed')
      and existing.affected_entity_keys && p_affected_entity_keys
  ) then
    v_flags := array_append(v_flags, 'conflicting_recommendation');
  end if;

  insert into public.agent_recommendations (
    facility_id,
    agent_key,
    agent_identity,
    agent_version,
    recommended_action,
    action_type,
    evidence,
    affected_entities,
    affected_entity_keys,
    expected_kpi_impact,
    confidence_score,
    risk_level,
    required_approval_level,
    rollback_instructions,
    execution_mode,
    safeguard_flags,
    data_observed_at,
    expires_at
  )
  values (
    p_facility_id,
    p_agent_key,
    p_agent_identity,
    p_agent_version,
    p_recommended_action,
    p_action_type,
    p_evidence,
    coalesce(p_affected_entities, '[]'::jsonb),
    coalesce(p_affected_entity_keys, array[]::text[]),
    p_expected_kpi_impact,
    p_confidence_score,
    p_risk_level,
    p_required_approval_level,
    p_rollback_instructions,
    p_execution_mode,
    v_flags,
    p_data_observed_at,
    p_expires_at
  )
  returning * into v_recommendation;

  insert into public.agent_recommendation_audit (
    recommendation_id,
    event_type,
    from_status,
    to_status,
    actor_email,
    actor_role,
    actor_type,
    detail
  )
  values (
    v_recommendation.id,
    'recommendation_created',
    null,
    'proposed',
    p_agent_identity,
    'agent',
    'agent',
    jsonb_build_object(
      'agent_version', p_agent_version,
      'execution_mode', p_execution_mode,
      'safeguard_flags', v_flags
    )
  );

  return v_recommendation;
end;
$$;

create or replace function public.transition_agent_recommendation(
  p_recommendation_id uuid,
  p_action text,
  p_actor_id uuid,
  p_actor_email text,
  p_actor_role text,
  p_reason text default null,
  p_expected_updated_at timestamptz default null
)
returns public.agent_recommendations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recommendation public.agent_recommendations;
  v_config public.agent_facility_configs;
  v_from_status text;
  v_to_status text;
  v_event_type text;
  v_conflict boolean := false;
begin
  if p_actor_role <> 'admin' then
    raise exception 'Supervisor access is required.';
  end if;

  select *
  into v_recommendation
  from public.agent_recommendations
  where id = p_recommendation_id
  for update;

  if not found then
    raise exception 'Recommendation was not found.';
  end if;

  if p_expected_updated_at is not null and v_recommendation.updated_at <> p_expected_updated_at then
    raise exception 'Recommendation changed after it was opened. Refresh and review the latest state.';
  end if;

  select *
  into v_config
  from public.agent_facility_configs
  where facility_id = v_recommendation.facility_id
    and agent_key = v_recommendation.agent_key;

  if not found or not v_config.enabled then
    raise exception 'Agent is not enabled for this facility.';
  end if;

  v_from_status := v_recommendation.status;

  if p_action in ('approve', 'execute') then
    if v_recommendation.confidence_score < v_config.minimum_confidence then
      raise exception 'Recommendation is below the configured confidence threshold.';
    end if;

    if v_recommendation.data_observed_at + make_interval(mins => v_config.stale_after_minutes) <= now()
      or v_recommendation.expires_at <= now()
    then
      raise exception 'Recommendation data is stale or expired.';
    end if;

    if 'clarification_requested' = any(v_recommendation.safeguard_flags) then
      raise exception 'The agent must submit a supported replacement recommendation after clarification is requested.';
    end if;

    if v_recommendation.action_type is not null
      and not (v_recommendation.action_type = any(v_config.allowed_reversible_actions))
    then
      raise exception 'Recommendation action is not configured for this agent and facility.';
    end if;

    if cardinality(v_recommendation.affected_entity_keys) > 0 then
      select exists (
        select 1
        from public.agent_recommendations existing
        where existing.id <> v_recommendation.id
          and existing.facility_id = v_recommendation.facility_id
          and existing.status in ('proposed', 'approved', 'executed')
          and existing.affected_entity_keys && v_recommendation.affected_entity_keys
      ) into v_conflict;

      if v_conflict then
        raise exception 'A conflicting recommendation affects the same operational work.';
      end if;
    end if;
  end if;

  case p_action
    when 'approve' then
      if v_from_status <> 'proposed' then
        raise exception 'Only proposed recommendations can be approved.';
      end if;
      v_to_status := 'approved';
      v_event_type := 'recommendation_approved';
      update public.agent_recommendations
      set
        status = v_to_status,
        approved_at = now(),
        approved_by = p_actor_id,
        updated_at = now()
      where id = v_recommendation.id
      returning * into v_recommendation;

    when 'reject' then
      if v_from_status not in ('proposed', 'approved') then
        raise exception 'Only proposed or approved recommendations can be rejected.';
      end if;
      v_to_status := 'rejected';
      v_event_type := 'recommendation_rejected';
      update public.agent_recommendations
      set
        status = v_to_status,
        rejected_at = now(),
        rejected_by = p_actor_id,
        updated_at = now()
      where id = v_recommendation.id
      returning * into v_recommendation;

    when 'request_clarification' then
      if v_from_status <> 'proposed' then
        raise exception 'Clarification can be requested only while a recommendation is proposed.';
      end if;
      v_to_status := 'proposed';
      v_event_type := 'clarification_requested';
      update public.agent_recommendations
      set
        safeguard_flags = array(
          select distinct flag
          from unnest(safeguard_flags || array['clarification_requested']::text[]) as flag
        ),
        updated_at = now()
      where id = v_recommendation.id
      returning * into v_recommendation;

    when 'execute' then
      if v_from_status <> 'approved' then
        raise exception 'Supervisor approval is required before execution.';
      end if;
      if v_config.autonomy_level <> 4 then
        raise exception 'Execution requires autonomy level 4 for this agent and facility.';
      end if;
      if v_recommendation.action_type is null
        or not (v_recommendation.action_type = any(v_config.allowed_reversible_actions))
      then
        raise exception 'Execution requires a configured reversible action.';
      end if;
      if v_recommendation.execution_mode <> 'simulation' or v_config.execution_mode <> 'simulation' then
        raise exception 'No production execution adapter is configured.';
      end if;
      v_to_status := 'executed';
      v_event_type := 'action_executed';

      insert into public.agent_action_executions (
        recommendation_id,
        action_type,
        execution_mode,
        execution_payload,
        rollback_payload,
        executed_by,
        executed_by_email
      )
      values (
        v_recommendation.id,
        v_recommendation.action_type,
        v_recommendation.execution_mode,
        jsonb_build_object(
          'simulation', true,
          'message', 'Staged in the BlueLineOps agent control plane. No operational record was changed.'
        ),
        jsonb_build_object(
          'simulation', true,
          'message', v_recommendation.rollback_instructions
        ),
        p_actor_id,
        p_actor_email
      );

      update public.agent_recommendations
      set status = v_to_status, executed_at = now(), updated_at = now()
      where id = v_recommendation.id
      returning * into v_recommendation;

    when 'rollback' then
      if v_from_status <> 'executed' then
        raise exception 'Only an executed action can be rolled back.';
      end if;
      v_to_status := 'rolled_back';
      v_event_type := 'action_rolled_back';

      update public.agent_action_executions
      set
        rolled_back_by = p_actor_id,
        rolled_back_by_email = p_actor_email,
        rolled_back_at = now()
      where recommendation_id = v_recommendation.id
        and rolled_back_at is null;

      if not found then
        raise exception 'Execution record was not found or is already rolled back.';
      end if;

      update public.agent_recommendations
      set status = v_to_status, rolled_back_at = now(), updated_at = now()
      where id = v_recommendation.id
      returning * into v_recommendation;

    else
      raise exception 'Unsupported recommendation action.';
  end case;

  insert into public.agent_recommendation_audit (
    recommendation_id,
    event_type,
    from_status,
    to_status,
    actor_id,
    actor_email,
    actor_role,
    actor_type,
    detail
  )
  values (
    v_recommendation.id,
    v_event_type,
    v_from_status,
    v_to_status,
    p_actor_id,
    p_actor_email,
    p_actor_role,
    'user',
    jsonb_build_object(
      'reason', coalesce(p_reason, ''),
      'execution_mode', v_recommendation.execution_mode,
      'simulation', v_recommendation.execution_mode = 'simulation'
    )
  );

  return v_recommendation;
end;
$$;

create or replace function public.expire_agent_recommendations(
  p_facility_id text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recommendation public.agent_recommendations;
  v_expired_count integer := 0;
begin
  for v_recommendation in
    select *
    from public.agent_recommendations
    where status = 'proposed'
      and expires_at <= now()
      and (p_facility_id is null or facility_id = p_facility_id)
    for update
  loop
    update public.agent_recommendations
    set status = 'expired', updated_at = now()
    where id = v_recommendation.id;

    insert into public.agent_recommendation_audit (
      recommendation_id,
      event_type,
      from_status,
      to_status,
      actor_role,
      actor_type,
      detail
    )
    values (
      v_recommendation.id,
      'recommendation_expired',
      'proposed',
      'expired',
      'system',
      'system',
      jsonb_build_object('reason', 'Recommendation expiration time passed.')
    );

    v_expired_count := v_expired_count + 1;
  end loop;

  return v_expired_count;
end;
$$;

alter table public.agent_definitions enable row level security;
alter table public.agent_facility_configs enable row level security;
alter table public.agent_recommendations enable row level security;
alter table public.agent_action_executions enable row level security;
alter table public.agent_recommendation_audit enable row level security;

revoke all on table public.agent_definitions from anon, authenticated;
revoke all on table public.agent_facility_configs from anon, authenticated;
revoke all on table public.agent_recommendations from anon, authenticated;
revoke all on table public.agent_action_executions from anon, authenticated;
revoke all on table public.agent_recommendation_audit from anon, authenticated;

grant select on table public.agent_definitions to service_role;
grant select, insert, update on table public.agent_facility_configs to service_role;
grant select, insert, update on table public.agent_recommendations to service_role;
grant select, insert, update on table public.agent_action_executions to service_role;
grant select, insert on table public.agent_recommendation_audit to service_role;

revoke execute on function public.prevent_agent_audit_mutation() from public, anon, authenticated;
revoke execute on function public.create_agent_recommendation(
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  text[],
  jsonb,
  numeric,
  text,
  smallint,
  text,
  text,
  timestamptz,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.transition_agent_recommendation(
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;
revoke execute on function public.expire_agent_recommendations(text) from public, anon, authenticated;

grant execute on function public.create_agent_recommendation(
  text,
  text,
  text,
  text,
  text,
  text,
  jsonb,
  jsonb,
  text[],
  jsonb,
  numeric,
  text,
  smallint,
  text,
  text,
  timestamptz,
  timestamptz
) to service_role;
grant execute on function public.transition_agent_recommendation(
  uuid,
  text,
  uuid,
  text,
  text,
  text,
  timestamptz
) to service_role;
grant execute on function public.expire_agent_recommendations(text) to service_role;
