# Supabase + Agent Builder Integration Plan (WMS)

This plan assumes Airtable is no longer part of the runtime path and Supabase is the single data source.

## Scope lock (do this before implementation)

Before writing any tooling, pick exactly one **Phase 1 agent experience** and freeze it for the first milestone.

Use this decision table:

| Phase 1 option | What the agent can do | Required backend surface | Risk level |
|---|---|---|---|
| A. Relationship visualization only (**recommended**) | Explain how tables connect and render/describe graph edges | `/api/schema/entities`, `/api/schema/relationships`, `/api/schema/graph` (metadata only) | Low |
| B. Visualization + operational Q&A | Do A plus answer KPI/workflow questions using read-only aggregates | A + read-only metrics endpoints/views | Medium |
| C. Read + write actions | Do B plus perform updates (create/update records) | B + validated write endpoints, approvals, audit logging | High |

Define and store these **locked outcomes** in your implementation ticket/PR before coding:

1. **In-scope tasks** (3-5 bullets max).
2. **Out-of-scope tasks** (especially write actions if Phase 1 is read-only).
3. **Success criteria** (what users must be able to do in Agent Builder).
4. **Failure/rollback trigger** (when to disable tools with a feature flag).

Suggested Phase 1 lock:
- In scope: relationship graph and relationship questions only.
- Out of scope: operational recommendations requiring row-level sensitive data and all writes.
- Success: agent answers at least 5 relationship prompts correctly using only metadata responses.
- Rollback: any sensitive-field leakage or repeated schema mismatch.

### Exact implementation workflow (copy this into your next ticket/PR)

1. **Choose Phase 1 option (A/B/C) in one sentence.**
   Example: `Phase 1 = A (relationship visualization only).`
2. **Write 3-5 in-scope bullets.**
   Keep each bullet observable ("Expose `/api/schema/graph`" not "Improve architecture").
3. **Write 3-5 out-of-scope bullets.**
   Explicitly exclude writes and sensitive row retrieval unless you selected C.
4. **Set measurable success criteria.**
   Include at least one accuracy check, one security check, and one usability check.
5. **Set rollback trigger and kill switch owner.**
   Define exactly what event disables the tool and who has authority to flip the flag.
6. **Do a 10-minute scope review before coding.**
   If any planned task is out-of-scope, either remove it or update the scope lock first.

Use this template verbatim in your issue/PR description:

```md
## Scope Lock (Phase 1)

- Selected option: A | B | C
- Why this option now: <1-2 sentences>

### In scope
- <task 1>
- <task 2>
- <task 3>

### Out of scope
- <explicit non-goal 1>
- <explicit non-goal 2>
- <explicit non-goal 3>

### Success criteria
- Accuracy: <e.g., agent returns correct FK path for 5/5 prompts>
- Security: <e.g., no PII columns present in any tool response>
- Usability: <e.g., response under 3s p95 for schema graph calls>

### Rollback trigger
- Trigger: <e.g., any sensitive-field leak or repeated schema mismatch>
- Kill switch: <feature flag name>
- Owner: <person/role>