"use client"

import { startTransition, useEffect, useRef, useState } from 'react'

type SignalDefinition = {
  label: string
  color: string
  level: number
  displayValue: string
  note: string
}

type SignalPulseBoardProps = {
  title: string
  description: string
  summary: string
  signals: SignalDefinition[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildSeed(level: number, seedIndex: number, points = 16): number[] {
  return Array.from({ length: points }, (_, pointIndex) =>
    Number(
      clamp(
        level + Math.sin((pointIndex + seedIndex) / 2.1) * 6 + Math.cos((pointIndex + seedIndex * 1.6) / 4.9) * 3,
        6,
        96
      ).toFixed(2)
    )
  )
}

function formatTimelineLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function SignalPulseBoard({ title, description, summary, signals }: SignalPulseBoardProps) {
  const signalSeed = signals.map((signal, index) => buildSeed(signal.level, index))
  const [points, setPoints] = useState(signalSeed)
  const [timelineEnd, setTimelineEnd] = useState(() => Date.now())
  const seedRef = useRef(signalSeed)
  const tickRef = useRef(signalSeed[0]?.length ?? 0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setPoints((current) =>
          current.map((series, seriesIndex) => {
            const anchor = seedRef.current[seriesIndex]?.[tickRef.current % (seedRef.current[seriesIndex]?.length ?? 1)] ?? signals[seriesIndex]?.level ?? 50
            const previous = series[series.length - 1] ?? anchor
            const prior = series[series.length - 2] ?? previous
            const wave = Math.sin((tickRef.current + seriesIndex * 1.8) / 2.3) * 3.4 + Math.cos((tickRef.current + seriesIndex) / 5.4) * 1.8
            const next = Number(clamp(previous + (anchor - previous) * 0.2 + (previous - prior) * 0.22 + wave, 4, 98).toFixed(2))

            return [...series.slice(1), next]
          })
        )
        tickRef.current += 1
        setTimelineEnd((current) => current + 15 * 60_000)
      })
    }, 2400)

    return () => window.clearInterval(intervalId)
  }, [signals])

  if (signals.length === 0 || points.length === 0) {
    return null
  }

  const width = 820
  const height = 280
  const padding = { top: 18, right: 24, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const labels = points[0].map((_, index) => {
    const distance = points[0].length - 1 - index
    return formatTimelineLabel(timelineEnd - distance * 15 * 60_000)
  })
  const xTickStep = Math.max(1, Math.ceil(labels.length / 6))

  const toX = (index: number): number => {
    if (labels.length <= 1) {
      return padding.left + chartWidth / 2
    }

    return padding.left + (index / (labels.length - 1)) * chartWidth
  }

  const toY = (value: number): number => padding.top + ((100 - value) / 100) * chartHeight

  return (
    <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(155deg,rgba(3,7,18,0.95),rgba(15,23,42,0.9))] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.85)]" />
              Live Pulse
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">{description}</p>
        </div>

        <div className="max-w-sm rounded-2xl border border-zinc-700/60 bg-zinc-900/45 px-4 py-3 text-sm text-zinc-300">
          {summary}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_42%),linear-gradient(180deg,rgba(2,6,23,0.8),rgba(2,6,23,0.98))] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = toY(tick)
            return (
              <g key={`tick-${tick}`}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(113,113,122,0.35)" strokeDasharray="4 6" />
                <text x={8} y={y + 4} fill="rgba(161,161,170,0.82)" fontSize={11}>
                  {tick}
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

          {labels.map((label, index) => {
            if (index % xTickStep !== 0 && index !== labels.length - 1) {
              return null
            }

            return (
              <text key={`${label}-${index}`} x={toX(index)} y={height - 14} fill="rgba(161,161,170,0.82)" fontSize={11} textAnchor="middle">
                {label}
              </text>
            )
          })}

          {signals.map((signal, signalIndex) => {
            const linePoints = points[signalIndex].map((value, valueIndex) => `${toX(valueIndex)},${toY(value)}`).join(' ')

            return (
              <g key={signal.label}>
                <polyline
                  fill="none"
                  stroke={signal.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={linePoints}
                />
                <circle
                  cx={toX(points[signalIndex].length - 1)}
                  cy={toY(points[signalIndex][points[signalIndex].length - 1] ?? signal.level)}
                  r="5"
                  fill={signal.color}
                  stroke="rgba(2,6,23,0.95)"
                  strokeWidth="2"
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {signals.map((signal) => (
          <div key={`legend-${signal.label}`} className="flex items-center gap-2 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: signal.color }} />
            <span>{signal.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {signals.map((signal) => (
          <div key={`signal-${signal.label}`} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{signal.label}</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-100">{signal.displayValue}</div>
            <p className="mt-2 text-sm text-zinc-400">{signal.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
