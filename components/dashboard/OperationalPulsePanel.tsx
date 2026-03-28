"use client"

import { startTransition, useEffect, useRef, useState } from "react"

export type OperationalPulsePoint = {
  backlog: number
  cpt: number
  flow: number
  capacity: number
}

type OperationalPulsePanelProps = {
  title: string
  description: string
  seed: OperationalPulsePoint[]
  modeLabel: string
  modeSummary: string
}

const SERIES = [
  { key: "backlog", label: "Order Pressure", color: "#38bdf8" },
  { key: "cpt", label: "CPT Exposure", color: "#fb7185" },
  { key: "flow", label: "Flow Efficiency", color: "#34d399" },
  { key: "capacity", label: "Capacity Load", color: "#f59e0b" },
] as const

const WINDOW_MINUTES = 15
const TICK_MS = 2400

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function evolvePoint(previous: number, anchor: number, tick: number, phase: number, prior: number): number {
  const anchorPull = (anchor - previous) * 0.24
  const momentum = (previous - prior) * 0.28
  const wave = Math.sin((tick + phase) / 1.8) * 3.2 + Math.cos((tick + phase) / 4.6) * 1.9

  return Math.round(clamp(previous + anchorPull + momentum + wave, 8, 96) * 10) / 10
}

function metricTone(value: number): string {
  if (value >= 78) {
    return "Elevated"
  }
  if (value >= 58) {
    return "Active"
  }
  if (value >= 38) {
    return "Steady"
  }

  return "Light"
}

function metricNarrative(label: string, value: number): string {
  if (label === "Order Pressure") {
    return value >= 70 ? "Backlog is stacking across the floor." : "Backlog is moving at a controllable pace."
  }
  if (label === "CPT Exposure") {
    return value >= 68 ? "Shipping windows need close attention." : "CPT risk is inside a manageable band."
  }
  if (label === "Flow Efficiency") {
    return value >= 68 ? "Labor and throughput are landing cleanly." : "Flow has room to tighten up."
  }

  return value >= 68 ? "Dock and yard capacity are running hot." : "Capacity is available for the next wave."
}

function formatTimelineLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function OperationalPulsePanel({
  title,
  description,
  seed,
  modeLabel,
  modeSummary,
}: OperationalPulsePanelProps) {
  const initialSeed = seed.length > 0 ? seed : [{ backlog: 56, cpt: 34, flow: 62, capacity: 48 }]
  const [points, setPoints] = useState<OperationalPulsePoint[]>(initialSeed)
  const [timelineEnd, setTimelineEnd] = useState(() => Date.now())
  const seedRef = useRef(initialSeed)
  const tickRef = useRef(initialSeed.length)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setPoints((current) => {
          const source = current.length > 0 ? current : seedRef.current
          const anchor = seedRef.current[tickRef.current % seedRef.current.length]
          const previous = source[source.length - 1] ?? anchor
          const prior = source[source.length - 2] ?? previous

          const nextPoint: OperationalPulsePoint = {
            backlog: evolvePoint(previous.backlog, anchor.backlog, tickRef.current, 0.8, prior.backlog),
            cpt: evolvePoint(previous.cpt, anchor.cpt, tickRef.current, 2.4, prior.cpt),
            flow: evolvePoint(previous.flow, anchor.flow, tickRef.current, 4.1, prior.flow),
            capacity: evolvePoint(previous.capacity, anchor.capacity, tickRef.current, 5.6, prior.capacity),
          }

          tickRef.current += 1
          return [...source.slice(1), nextPoint]
        })

        setTimelineEnd((current) => current + WINDOW_MINUTES * 60_000)
      })
    }, TICK_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  const width = 820
  const height = 320
  const padding = { top: 18, right: 24, bottom: 44, left: 44 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const yTicks = [0, 25, 50, 75, 100]

  const toX = (index: number): number => {
    if (points.length <= 1) {
      return padding.left + chartWidth / 2
    }

    return padding.left + (index / (points.length - 1)) * chartWidth
  }

  const toY = (value: number): number => padding.top + ((100 - value) / 100) * chartHeight

  const labels = points.map((_, index) => {
    const distance = points.length - 1 - index
    return formatTimelineLabel(timelineEnd - distance * WINDOW_MINUTES * 60_000)
  })

  const current = points[points.length - 1] ?? initialSeed[initialSeed.length - 1]
  const xTickStep = Math.max(1, Math.ceil(points.length / 6))

  return (
    <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(155deg,rgba(3,7,18,0.95),rgba(15,23,42,0.9))] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.85)]" />
              {modeLabel}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">{description}</p>
        </div>

        <div className="max-w-sm rounded-2xl border border-zinc-700/60 bg-zinc-900/45 px-4 py-3 text-sm text-zinc-300">
          {modeSummary}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.8),rgba(2,6,23,0.98))] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <defs>
            {SERIES.map((series) => (
              <linearGradient key={`${series.key}-gradient`} id={`${series.key}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {yTicks.map((tickValue) => {
            const y = toY(tickValue)
            return (
              <g key={`tick-${tickValue}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(113,113,122,0.35)" strokeDasharray="4 6" />
                <text x={8} y={y + 4} fill="rgba(161,161,170,0.82)" fontSize={11}>
                  {tickValue}
                </text>
              </g>
            )
          })}

          <line
            x1={width - padding.right}
            y1={padding.top}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="rgba(226,232,240,0.35)"
            strokeDasharray="5 5"
          />
          <text x={width - padding.right - 2} y={padding.top - 2} fill="rgba(226,232,240,0.86)" fontSize={11} textAnchor="end">
            Now
          </text>

          {labels.map((label, index) => {
            if (index % xTickStep !== 0 && index !== labels.length - 1) {
              return null
            }

            return (
              <text key={`${label}-${index}`} x={toX(index)} y={height - 18} fill="rgba(161,161,170,0.82)" fontSize={11} textAnchor="middle">
                {label}
              </text>
            )
          })}

          {SERIES.map((series) => {
            const values = points.map((point) => point[series.key])
            const linePoints = values.map((value, index) => `${toX(index)},${toY(value)}`).join(" ")
            const areaPoints = [
              `${padding.left},${height - padding.bottom}`,
              ...values.map((value, index) => `${toX(index)},${toY(value)}`),
              `${width - padding.right},${height - padding.bottom}`,
            ].join(" ")

            return (
              <g key={series.key}>
                <polygon points={areaPoints} fill={`url(#${series.key}-gradient)`} />
                <polyline
                  fill="none"
                  stroke={series.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={linePoints}
                />
                <circle
                  cx={toX(points.length - 1)}
                  cy={toY(values[values.length - 1] ?? 0)}
                  r="5"
                  fill={series.color}
                  stroke="rgba(2,6,23,0.95)"
                  strokeWidth="2"
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center gap-2 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            <span>{series.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SERIES.map((series) => {
          const value = current[series.key]
          return (
            <div key={`card-${series.key}`} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{series.label}</div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="text-3xl font-semibold text-zinc-100">{Math.round(value)}</div>
                <div className="rounded-full border border-zinc-700/70 px-2.5 py-1 text-xs font-medium text-zinc-300">{metricTone(value)}</div>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{metricNarrative(series.label, value)}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
