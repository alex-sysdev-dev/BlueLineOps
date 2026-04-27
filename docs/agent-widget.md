# OpenAI KPI Agent Widget

Floating, read-only AI assistant that renders on every operational page in the
`(app)` route group. It answers KPI questions in plain text by calling OpenAI
with tool access to the existing `/api/agent/*` KPI endpoints.

## What this PR adds

| File | Purpose |
| --- | --- |
| `app/api/agent/chat/route.ts` | POST endpoint. Wraps OpenAI Chat Completions with tool calling. Tool execution happens in-process by importing `lib/queries/executive.ts` directly — no extra HTTP round-trip, no base URL config. |
| `components/agent/AgentWidget.tsx` | Client component. Floating launcher button + chat panel. Sends `pathname` as page context. |
| `app/(app)/layout.tsx` | One-line mount of `AgentWidget` so it appears on every page inside the `(app)` group. |

No new npm packages. OpenAI is called via `fetch`, so `package.json` and
`package-lock.json` are untouched.

## Required environment variable

Add to `.env.local` (and to your Vercel project settings):

```
OPENAI_API_KEY=sk-...
```

Optional override (defaults to `gpt-4o-mini`):

```
OPENAI_AGENT_MODEL=gpt-4o-mini
```

## Tools the agent can call

These mirror the existing endpoints so behavior is consistent with the MCP route:

| Tool | Backend |
| --- | --- |
| `get_kpi_snapshot` | `getExecutiveKpiSnapshot()` from `lib/queries/executive` |
| `get_kpi_trend` | `getExecutiveKpiHistoryHourly` / `getExecutiveKpiHistoryDaily` |
| `get_max_lines` | `getExecutiveKpiMaxLines(48)` |
| `get_cpt_risk` | `getExecutiveCptRiskOrders(limit)` filtered by bucket |
| `get_order_status` | `supabase.from('order_cpt_risk').eq(...)` |

The system prompt enforces:
- Always call a tool — never invent values.
- Lead with the number and time basis.
- Refuse writes, secrets, raw SQL, or off-topic questions.
- Plain text only (no markdown tables/charts).

## Request / response contract

`POST /api/agent/chat`

Request body:
```json
{
  "messages": [
    { "role": "user", "content": "What is my current KPI snapshot?" }
  ],
  "pageContext": { "pathname": "/dashboard" }
}
```

Response:
```json
{
  "text": "As of 14:00 CT: throughput 312/hr, on-time ship 96.4%, ...",
  "trace": [
    { "name": "get_kpi_snapshot", "arguments": {}, "result_preview": "{...}" }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

Errors return `{ error, message, ... }` with appropriate status codes
(`400` bad input, `500` missing key, `502` OpenAI failure, `504` tool loop exceeded).

## Manual smoke test

1. `OPENAI_API_KEY=sk-... npm run dev`
2. Open http://localhost:3000/dashboard
3. Click the blue chat bubble bottom-right.
4. Try the suggested prompts (snapshot, top 10 CPT risk, throughput trend, deadlined orders).
5. Verify each response leads with a number and time basis, not invented values.
6. Try a write attempt: "delete order 100245" — should refuse cleanly.

## Why this design

- **Reuses existing query layer**: avoids drifting from `/api/agent/*` and the
  MCP route, and avoids needing a server-side base URL.
- **No new dependency**: smaller blast radius, no `package.json` change.
- **Single file mounted in layout**: one place to remove the agent if needed.
- **Read-only by construction**: no tool exists that can write to Supabase, even
  if the model tried.

## Known limitations / next steps

- No streaming yet (full response returned after tool loop completes). Easy to
  add SSE later if latency becomes a concern.
- No rate limiting on `/api/agent/chat`. Add per-IP throttling before public
  exposure.
- No conversation persistence — history lives in component state only.
- Page context is just `pathname`. Could be extended to include the visible
  KPI tile values for tighter grounding.
