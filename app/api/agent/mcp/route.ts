import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://bluelineopsok-d06hvfgdm-alex-sysdev-devs-projects.vercel.app";

const tools = [
  {
    name: "get_kpi_snapshot",
    description: "Get current executive KPI snapshot for BlueLineOps.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_kpi_trend",
    description: "Get one KPI metric trend over time.",
    inputSchema: {
      type: "object",
      properties: {
        metric: { type: "string" },
        grain: { type: "string", enum: ["hourly", "daily"] },
        start: { type: "string" },
        end: { type: "string" },
      },
      required: ["metric", "grain"],
    },
  },
  {
    name: "get_max_lines",
    description: "Get max-line chart data for active orders, CPT risk, and safety.",
    inputSchema: {
      type: "object",
      properties: {
        grain: { type: "string", enum: ["hourly", "daily"] },
        start: { type: "string" },
        end: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "get_cpt_risk",
    description: "Get current CPT risk orders.",
    inputSchema: {
      type: "object",
      properties: {
        bucket: { type: "string" },
        limit: { type: "integer" },
      },
      required: [],
    },
  },
  {
    name: "get_order_status",
    description: "Get status for one order by ID or order number.",
    inputSchema: {
      type: "object",
      properties: {
        order_number: { type: "string" },
        id: { type: "string" },
      },
      required: [],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(args).forEach(([k, v]) => {
    if (v != null) params.set(k, String(v));
  });

  const endpoints: Record<string, string> = {
    get_kpi_snapshot: "/api/agent/kpi-snapshot",
    get_kpi_trend: "/api/agent/kpi-trend",
    get_max_lines: "/api/agent/max-lines",
    get_cpt_risk: "/api/agent/cpt-risk",
    get_order_status: "/api/agent/order-status",
  };

  const path = endpoints[name];
  if (!path) throw new Error(`Unknown tool: ${name}`);

  const url = `${BASE}${path}${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url);
  return res.json();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { method, params } = body;

  if (method === "tools/list") {
    return NextResponse.json({ tools });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      const result = await callTool(name, args || {});
      return NextResponse.json({
        content: [{ type: "text", text: JSON.stringify(result) }],
      });
    } catch (err) {
      return NextResponse.json({
        content: [{ type: "text", text: `Error: ${err}` }],
        isError: true,
      });
    }
  }

  return NextResponse.json({ error: "Unknown method" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ tools });
}