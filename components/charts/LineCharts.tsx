type LineSeries = {
  name: string
  color: string
  values: number[]
}

type LineChartsProps = {
  title: string
  labels: string[]
  series: LineSeries[]
  description?: string
  ySuffix?: string
}

function formatTick(value: number, suffix?: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${suffix ?? ''}`
  }

  return `${value.toFixed(0)}${suffix ?? ''}`
}

export default function LineCharts({ title, labels, series, description, ySuffix }: LineChartsProps) {
  if (labels.length === 0 || series.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{description ?? 'No chart data available yet.'}</p>
      </section>
    )
  }

  const width = 800
  const height = 300
  const padding = { top: 20, right: 18, bottom: 44, left: 46 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const allValues = series.flatMap((line) => line.values)
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues, 1)
  const range = maxValue - minValue || 1
  const gridLines = 4

  const toX = (index: number): number => {
    if (labels.length === 1) {
      return padding.left + chartWidth / 2
    }

    return padding.left + (index / (labels.length - 1)) * chartWidth
  }

  const toY = (value: number): number => padding.top + ((maxValue - value) / range) * chartHeight

  const xTickStep = Math.max(1, Math.ceil(labels.length / 8))

  return (
    <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {Array.from({ length: gridLines + 1 }, (_, lineIndex) => {
          const y = padding.top + (lineIndex / gridLines) * chartHeight
          const value = maxValue - (lineIndex / gridLines) * range
          return (
            <g key={`grid-${lineIndex}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(113,113,122,0.35)" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="rgba(161,161,170,0.85)" fontSize={11}>
                {formatTick(value, ySuffix)}
              </text>
            </g>
          )
        })}

        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="rgba(113,113,122,0.5)" />

        {labels.map((label, index) => {
          if (index % xTickStep !== 0 && index !== labels.length - 1) {
            return null
          }

          return (
            <text key={`${label}-${index}`} x={toX(index)} y={height - 16} fill="rgba(161,161,170,0.85)" fontSize={11} textAnchor="middle">
              {label}
            </text>
          )
        })}

        {series.map((line) => {
          const points = line.values.map((value, index) => `${toX(index)},${toY(value)}`).join(' ')
          return <polyline key={line.name} fill="none" stroke={line.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
        })}

        {series.map((line) =>
          line.values.map((value, index) => (
            <circle key={`${line.name}-${index}`} cx={toX(index)} cy={toY(value)} r="3.2" fill={line.color} stroke="rgba(2,6,23,0.95)" strokeWidth="1.2" />
          ))
        )}
      </svg>

      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {series.map((line) => (
          <div key={line.name} className="flex items-center gap-2 text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            <span>{line.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
