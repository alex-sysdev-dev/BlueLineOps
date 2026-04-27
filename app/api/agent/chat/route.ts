import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  getExecutiveKpiSnapshot,
  getExecutiveKpiHistoryDaily,
  getExecutiveKpiHistoryHourly,
  getExecutiveKpiMaxLines,
  getExecutiveCptRiskOrders,
} from '@/lib/queries/executive'

// =============================================================================
// BlueLineOps OpenAI Chat Agent
// -----------------------------------------------------------------------------
// Read-only KPI assistant. Mirrors the build note in:
//   docs/BlueLineOps Operational Intelligence_Agent_Builder_Click_By_Click_UI_Guide.txt
//
// The agent uses OpenAI tool calling to answer questions about KPIs by
// invoking the existing /api/agent/* endpoints' underlying query functions.
// Tool execution happens in-process (no HTTP round-trip), so no base URL
// or auth needs to flow between routes.
// =============================================================================

export const runtime = 'nodejs'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = process.env.OPENAI_AGENT_MODEL ?? 'gpt-4o-mini'
const MAX_TOOL_LOOPS = 6

// -----------------------------------------------------------------------------
// Tool schemas (mirrors app/api/agent/mcp/route.ts)
// -----------------------------------------------------------------------------

const TREND_METRICS = [
  'throughput_per_hour',
  'labor_cost_per_unit',
  'on_time_ship_pct',
  'cpt_risk_orders',
  'active_orders',
  'pending_pick_orders',
  'pending_pack_orders',
  'avg_order_age_hours',
  'yard_occupancy_pct',
  'dock_utilization_pct',
  'avg_trailer_dwell_hours',
  'deadlined_orders',
  'active_labor',
  'productivity_per_labor_hour',
  'quality_score_pct',
  'safety_incidents_30d',
] as const

const RISK_BUCKETS = ['all', 'safe', 'watch', 'risk', 'missed', 'shipped_on_time', 'shipped_late'] as const

const TREND_FIELD_MAP: Record<string, string> = {
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

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_kpi_snapshot',
      description:
        'Get the current executive KPI snapshot: throughput, on-time ship %, CPT risk orders, active orders, pick/pack queues, yard occupancy, dock utilization, deadlined orders, labor, quality, and safety. Use this for any "right now" or "current" KPI question.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_kpi_trend',
      description:
        'Get historical trend data for one KPI metric. Use this for questions about how a metric has moved over the last hours or days.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: [...TREND_METRICS] },
          grain: { type: 'string', enum: ['hourly', 'daily'] },
        },
        required: ['metric'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_max_lines',
      description:
        'Get hourly max-line series for active orders, CPT risk orders, and safety incidents. Use when the user asks for max lines or all three together.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_cpt_risk',
      description:
        'List CPT risk orders, optionally filtered by bucket (safe, watch, risk, missed, shipped_on_time, shipped_late, or all). Sorted by deadline urgency.',
      parameters: {
        type: 'object',
        properties: {
          bucket: { type: 'string', enum: [...RISK_BUCKETS] },
          limit: { type: 'integer', minimum: 1, maximum: 50 },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_order_status',
      description:
        'Look up status for a single order by order_number or internal id. Returns null when not found.',
      parameters: {
        type: 'object',
        properties: {
          order_number: { type: 'string' },
          id: { type: 'string' },
        },
        required: [],
      },
    },
  },
] as const

// -----------------------------------------------------------------------------
// Tool execution
// -----------------------------------------------------------------------------

type ToolArgs = Record<string, unknown>

async function executeTool(name: string, args: ToolArgs): Promise<unknown> {
  switch (name) {
    case 'get_kpi_snapshot': {
      const snapshot = await getExecutiveKpiSnapshot()
      return snapshot ?? { error: 'not_found', message: 'No executive KPI snapshot was found.' }
    }

    case 'get_kpi_trend': {
      const metric = String(args.metric ?? '')
      const grain = String(args.grain ?? 'hourly')
      const field = TREND_FIELD_MAP[metric]
      if (!field) {
        return { error: 'bad_request', message: `Unknown metric: ${metric}`, supported: Object.keys(TREND_FIELD_MAP) }
      }
      const rows =
        grain === 'daily'
          ? await getExecutiveKpiHistoryDaily(30)
          : await getExecutiveKpiHistoryHourly(24)
      return {
        metric,
        grain,
        data: rows.map((row) => ({
          bucket_at: row.bucket_at,
          value: (row as Record<string, unknown>)[field] ?? null,
        })),
      }
    }

    case 'get_max_lines': {
      const data = await getExecutiveKpiMaxLines(48)
      return { grain: 'hourly', data }
    }

    case 'get_cpt_risk': {
      const bucket = (args.bucket as string) ?? 'all'
      const limit = Math.min(50, Math.max(1, Number(args.limit) || 10))
      const rows = await getExecutiveCptRiskOrders(limit)
      const filtered = bucket === 'all' ? rows : rows.filter((o) => o.risk_bucket === bucket)
      return { bucket, limit, count: filtered.length, data: filtered }
    }

    case 'get_order_status': {
      const id = args.id ? String(args.id) : null
      const orderNumber = args.order_number ? String(args.order_number) : null
      if (!id && !orderNumber) {
        return { error: 'bad_request', message: 'Provide id or order_number.' }
      }
      let query = supabase.from('order_cpt_risk').select('*')
      query = id ? query.eq('order_id', id) : query.eq('order_number', orderNumber!)
      const { data, error } = await query.maybeSingle()
      if (error) return { error: 'server_error', message: error.message }
      if (!data) return { found: false, data: null }
      return { found: true, data }
    }

    default:
      return { error: 'unknown_tool', name }
  }
}

// -----------------------------------------------------------------------------
// System prompt
// -----------------------------------------------------------------------------

function buildSystemPrompt(pageContext?: { pathname?: string }): string {
  const page = pageContext?.pathname ? ` The user is currently viewing ${pageContext.pathname}.` : ''
  return [
    'You are the BlueLineOps Operational Intelligence assistant — a read-only KPI helper for a fulfillment center operations platform.',
    `Operating mode: read-only demo. Timezone: America/Chicago.${page}`,
    '',
    'Capabilities:',
    '- Answer questions about current KPI snapshot values (throughput, on-time ship %, CPT risk orders, active/pick/pack queues, yard, dock, labor, quality, safety).',
    '- Answer questions about KPI trends over hours or days.',
    '- Show max-line series for active orders, CPT risk, and safety.',
    '- List CPT risk orders by bucket (safe/watch/risk/missed/shipped_on_time/shipped_late).',
    '- Look up a specific order by order number or id.',
    '',
    'Rules:',
    '- Always call a tool to get real numbers — never invent values.',
    '- Lead the answer with the number and the time basis (e.g., "as of 14:00 CT", "last 24 hours hourly").',
    '- Keep answers concise and plain-text. No markdown tables, no charts, no code blocks unless quoting an order id.',
    '- If the user asks for a write/update/insert/delete or for credentials or raw SQL, refuse with: "I can help with read-only BlueLineOps KPI, trend, CPT risk, and order lookup questions, but I cannot modify data or expose credentials."',
    '- If the request is ambiguous (missing metric, grain, or order reference), ask one short clarifying question before calling tools.',
    '- If a tool returns an error or empty result, say so plainly and do not fabricate a substitute.',
  ].join('\n')
}

// -----------------------------------------------------------------------------
// OpenAI message types (minimal — we only use what we need)
// -----------------------------------------------------------------------------

type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string }

type ToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

// -----------------------------------------------------------------------------
// Route handler
// -----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'config_error', message: 'OPENAI_API_KEY is not set on the server.' },
      { status: 500 }
    )
  }

  let body: { messages?: { role: string; content: string }[]; pageContext?: { pathname?: string } }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const userMessages = (body.messages ?? []).filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
  )
  if (userMessages.length === 0) {
    return NextResponse.json({ error: 'bad_request', message: 'messages array is required.' }, { status: 400 })
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(body.pageContext) },
    ...userMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  const trace: { name: string; arguments: ToolArgs; result_preview: string }[] = []

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    const openaiRes = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
      }),
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      return NextResponse.json(
        { error: 'openai_error', status: openaiRes.status, message: errText.slice(0, 500) },
        { status: 502 }
      )
    }

    const completion = await openaiRes.json()
    const choice = completion.choices?.[0]
    if (!choice) {
      return NextResponse.json(
        { error: 'openai_error', message: 'OpenAI returned no choices.' },
        { status: 502 }
      )
    }

    const assistantMsg = choice.message as {
      role: 'assistant'
      content: string | null
      tool_calls?: ToolCall[]
    }

    // No tool calls -> we have a final answer.
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return NextResponse.json({
        text: assistantMsg.content ?? '',
        trace,
        usage: completion.usage,
      })
    }

    // Append assistant turn (with tool_calls) to history.
    messages.push({
      role: 'assistant',
      content: assistantMsg.content,
      tool_calls: assistantMsg.tool_calls,
    })

    // Execute each tool call and append the result.
    for (const call of assistantMsg.tool_calls) {
      let parsedArgs: ToolArgs = {}
      try {
        parsedArgs = call.function.arguments ? JSON.parse(call.function.arguments) : {}
      } catch {
        parsedArgs = {}
      }

      let result: unknown
      try {
        result = await executeTool(call.function.name, parsedArgs)
      } catch (err) {
        result = { error: 'tool_exception', message: err instanceof Error ? err.message : String(err) }
      }

      const resultJson = JSON.stringify(result)
      trace.push({
        name: call.function.name,
        arguments: parsedArgs,
        result_preview: resultJson.length > 280 ? resultJson.slice(0, 280) + '…' : resultJson,
      })

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: resultJson,
      })
    }
  }

  return NextResponse.json(
    { error: 'tool_loop_exceeded', message: 'Hit max tool loops without a final answer.', trace },
    { status: 504 }
  )
}
