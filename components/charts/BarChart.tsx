type BarSeries = {
  name: string
  color: string
  values: number[]
}

type BarChartProps = {
  title: string
  labels: string[]
  series: BarSeries[]
  description?: string
}

function formatValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }

  return `${value.toFixed(0)}`
}

export default function BarChart({ title, labels, series, description }: BarChartProps) {
  if (labels.length === 0 || series.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{description ?? 'No bar chart data available yet.'}</p>
      </section>
    )
  }

  const width = 800
  const height = 320
  const padding = { top: 20, right: 18, bottom: 62, left: 46 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...series.flatMap((entry) => entry.values), 1)
  const safeMax = maxValue === 0 ? 1 : maxValue
  const groupWidth = plotWidth / labels.length
  const totalBarGap = 10
  const barCount = series.length
  const barWidth = Math.max(8, (groupWidth - totalBarGap) / barCount)
  const xTickStep = Math.max(1, Math.ceil(labels.length / 8))

  return (
    <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {Array.from({ length: 5 }, (_, lineIndex) => {
          const y = padding.top + (lineIndex / 4) * plotHeight
          const value = safeMax - (lineIndex / 4) * safeMax
          return (
            <g key={`grid-${lineIndex}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(113,113,122,0.35)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(161,161,170,0.85)" fontSize={11}>
                {formatValue(value)}
              </text>
            </g>
          )
        })}

        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="rgba(113,113,122,0.5)" />

        {labels.map((label, index) => {
          if (index % xTickStep !== 0 && index !== labels.length - 1) {
            return null
          }

          const x = padding.left + index * groupWidth + groupWidth / 2
          return (
            <text key={`${label}-${index}`} x={x} y={height - 20} fill="rgba(161,161,170,0.85)" fontSize={11} textAnchor="middle">
              {label}
            </text>
          )
        })}

        {labels.map((label, labelIndex) => {
          const groupLeft = padding.left + labelIndex * groupWidth + (groupWidth - barCount * barWidth) / 2

          return series.map((entry, seriesIndex) => {
            const value = entry.values[labelIndex] ?? 0
            const barHeight = (value / safeMax) * plotHeight
            const x = groupLeft + seriesIndex * barWidth
            const y = height - padding.bottom - barHeight

            return (
              <g key={`${label}-${entry.name}`}>
                <rect x={x} y={y} width={barWidth - 2} height={barHeight} rx={4} fill={entry.color} opacity={0.92} />
              </g>
            )
          })
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {series.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
