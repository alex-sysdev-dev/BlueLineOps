import BarChart from '@/components/charts/BarChart'
import LineCharts from '@/components/charts/LineCharts'
import KpiTile from '@/components/kpi/KpiTile'
import {
  getExecutiveKpiForecastDaily,
  getExecutiveKpiHistoryDaily,
  getExecutiveKpiHistoryHourly,
  getExecutiveKpiMaxLines,
  getExecutiveKpiSnapshot,
} from '@/lib/queries/executive'
import type { ExecutiveKpiForecastRow, ExecutiveKpiHistoryRow } from '@/types/executive'

function formatDateLabel(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeLabel(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDelta(current: number | null | undefined, previous: number | null | undefined, suffix = ''): string {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return 'N/A'
  }

  const delta = current - previous
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}${suffix}`
}

function latest<T>(rows: T[]): T | null {
  return rows.length > 0 ? rows[rows.length - 1] : null
}

function previous<T>(rows: T[]): T | null {
  return rows.length > 1 ? rows[rows.length - 2] : null
}

function buildTrendNarrative(
  snapshotThroughput: number | null | undefined,
  latestDaily: ExecutiveKpiHistoryRow | null,
  previousDaily: ExecutiveKpiHistoryRow | null,
  nextForecast: ExecutiveKpiForecastRow | null
): string[] {
  const notes: string[] = []

  if (snapshotThroughput !== null && snapshotThroughput !== undefined) {
    notes.push(`Current throughput is ${snapshotThroughput.toFixed(1)} per hour based on the live executive snapshot.`)
  }

  if (latestDaily) {
    notes.push(
      `Latest daily rollup shows ${latestDaily.active_orders_max ?? 0} active orders at peak, ${latestDaily.cpt_risk_orders_max ?? 0} CPT-risk orders at peak, and ${latestDaily.quality_score_pct_avg?.toFixed(1) ?? '0.0'}% average quality.`
    )
  }

  if (latestDaily && previousDaily) {
    notes.push(
      `Versus the previous day, throughput moved ${formatDelta(latestDaily.throughput_per_hour_avg, previousDaily.throughput_per_hour_avg)}, on-time ship moved ${formatDelta(latestDaily.on_time_ship_pct_avg, previousDaily.on_time_ship_pct_avg, '%')}, and labor productivity moved ${formatDelta(latestDaily.productivity_per_labor_hour_avg, previousDaily.productivity_per_labor_hour_avg)}.`
    )
  }

  if (nextForecast) {
    notes.push(
      `Tomorrow is forecast at ${nextForecast.active_orders_forecast ?? 0} active orders, ${nextForecast.cpt_risk_orders_forecast ?? 0} CPT-risk orders, and ${nextForecast.throughput_per_hour_forecast?.toFixed(2) ?? '0.00'} throughput per hour.`
    )
  }

  return notes
}

export default async function Page() {
  const [snapshot, hourlyHistory, dailyHistory, maxLines, forecastRows] = await Promise.all([
    getExecutiveKpiSnapshot(),
    getExecutiveKpiHistoryHourly(24),
    getExecutiveKpiHistoryDaily(30),
    getExecutiveKpiMaxLines(24),
    getExecutiveKpiForecastDaily(14),
  ])

  const latestDaily = latest(dailyHistory)
  const previousDaily = previous(dailyHistory)
  const latestHourly = latest(hourlyHistory)
  const previousHourly = previous(hourlyHistory)
  const nextForecast = forecastRows[0] ?? null
  const nextForecastThroughput =
    nextForecast?.throughput_per_hour_forecast !== null && nextForecast?.throughput_per_hour_forecast !== undefined
      ? nextForecast.throughput_per_hour_forecast.toFixed(2)
      : 'N/A'

  const signalTiles = [
    {
      title: 'Throughput Delta',
      value: formatDelta(latestHourly?.throughput_per_hour_avg, previousHourly?.throughput_per_hour_avg),
      accent: 'text-cyan-100 group-hover:text-cyan-50',
    },
    {
      title: 'On-Time Delta',
      value: formatDelta(latestDaily?.on_time_ship_pct_avg, previousDaily?.on_time_ship_pct_avg, '%'),
      accent: 'text-emerald-100 group-hover:text-emerald-50',
    },
    {
      title: 'Tomorrow Orders',
      value: nextForecast?.active_orders_forecast ?? 'N/A',
      accent: 'text-blue-100 group-hover:text-blue-50',
    },
    {
      title: 'Tomorrow CPT Risk',
      value: nextForecast?.cpt_risk_orders_forecast ?? 'N/A',
      accent: 'text-rose-100 group-hover:text-rose-50',
    },
  ]

  const serviceTrendLabels = dailyHistory.map((row) => formatDateLabel(row.bucket_at))
  const serviceTrendSeries = [
    {
      name: 'On-Time Ship %',
      color: '#34d399',
      values: dailyHistory.map((row) => row.on_time_ship_pct_avg ?? 0),
    },
    {
      name: 'Quality %',
      color: '#38bdf8',
      values: dailyHistory.map((row) => row.quality_score_pct_avg ?? 0),
    },
    {
      name: 'Yard Occupancy %',
      color: '#f59e0b',
      values: dailyHistory.map((row) => row.yard_occupancy_pct_avg ?? 0),
    },
  ]

  const outputLabels = dailyHistory.map((row) => formatDateLabel(row.bucket_at))
  const outputSeries = [
    {
      name: 'Throughput / Hr',
      color: '#60a5fa',
      values: dailyHistory.map((row) => row.throughput_per_hour_avg ?? 0),
    },
    {
      name: 'Productivity / Labor Hr',
      color: '#a78bfa',
      values: dailyHistory.map((row) => row.productivity_per_labor_hour_avg ?? 0),
    },
  ]

  const maxLineLabels = maxLines.map((row) => formatTimeLabel(row.bucket_at))
  const maxLineSeries = [
    {
      name: 'Active Orders',
      color: '#38bdf8',
      values: maxLines.map((row) => row.active_orders_max ?? 0),
    },
    {
      name: 'CPT Risk',
      color: '#fb7185',
      values: maxLines.map((row) => row.cpt_risk_orders_max ?? 0),
    },
    {
      name: 'Safety (30d)',
      color: '#f59e0b',
      values: maxLines.map((row) => row.safety_incidents_30d_max ?? 0),
    },
  ]

  const forecastLabels = forecastRows.map((row) => formatDateLabel(row.forecast_date))
  const forecastSeries = [
    {
      name: 'Active Orders Forecast',
      color: '#38bdf8',
      values: forecastRows.map((row) => row.active_orders_forecast ?? 0),
    },
    {
      name: 'CPT Risk Forecast',
      color: '#fb7185',
      values: forecastRows.map((row) => row.cpt_risk_orders_forecast ?? 0),
    },
    {
      name: 'Throughput / Hr Forecast',
      color: '#f59e0b',
      values: forecastRows.map((row) => row.throughput_per_hour_forecast ?? 0),
    },
  ]

  const trendNarrative = buildTrendNarrative(snapshot?.throughput_per_hour, latestDaily, previousDaily, nextForecast)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-blue-500">Forecasting</span>{' '}
            <span className="text-[var(--foreground)]">Trend Intelligence</span>
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            This page now combines hourly pressure, daily history, and a 14-day operational forecast from the Supabase history backfill and forecast view.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.92),rgba(15,23,42,0.84))] px-5 py-4 text-sm text-zinc-300">
          <div className="text-zinc-400">Trend windows</div>
          <div className="mt-1 font-semibold text-zinc-100">24 hourly buckets | 30 daily actuals | 14 daily forecast</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {signalTiles.map((tile) => (
          <KpiTile key={tile.title} title={tile.title} value={tile.value} accent={tile.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
        <LineCharts
          title="Hourly Pressure Signals"
          description="Rolling hourly pressure lines for active orders, CPT risk, and safety. These are max-line series from the executive history views."
          labels={maxLineLabels}
          series={maxLineSeries}
        />

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Trend Readout</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Narrative briefing from the latest actuals and the next forecasted day.
          </p>

          <div className="mt-5 space-y-3">
            {trendNarrative.map((entry, index) => (
              <div key={`forecast-note-${index + 1}`} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4 text-sm text-zinc-200">
                {entry}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LineCharts
          title="Daily Service Levels"
          description="Daily averages for on-time ship, quality, and yard occupancy from the executive KPI history rollups."
          labels={serviceTrendLabels}
          series={serviceTrendSeries}
          ySuffix="%"
        />

        <BarChart
          title="Daily Output and Productivity"
          description="Daily average throughput and labor productivity over the 30-day actual history window."
          labels={outputLabels}
          series={outputSeries}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <LineCharts
          title="14-Day Forecast Outlook"
          description="Daily forecast for active orders, CPT risk, and throughput per hour from public.executive_kpi_forecast_daily."
          labels={forecastLabels}
          series={forecastSeries}
        />

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Tomorrow Outlook</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Forecast baseline for the next operating day.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4">
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active Orders</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-100">{nextForecast?.active_orders_forecast ?? 'N/A'}</div>
              <div className="mt-1 text-xs text-zinc-400">
                Range {nextForecast?.active_orders_low ?? 'N/A'} - {nextForecast?.active_orders_high ?? 'N/A'}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">CPT Risk Orders</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-100">{nextForecast?.cpt_risk_orders_forecast ?? 'N/A'}</div>
              <div className="mt-1 text-xs text-zinc-400">
                Range {nextForecast?.cpt_risk_orders_low ?? 'N/A'} - {nextForecast?.cpt_risk_orders_high ?? 'N/A'}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Throughput / Hr</div>
              <div className="mt-2 text-2xl font-semibold text-zinc-100">{nextForecastThroughput}</div>
              <div className="mt-1 text-xs text-zinc-400">
                Range {nextForecast?.throughput_per_hour_low?.toFixed(2) ?? 'N/A'} - {nextForecast?.throughput_per_hour_high?.toFixed(2) ?? 'N/A'}
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/30 p-4 text-sm text-zinc-400">
              Method: {nextForecast?.forecast_method ?? 'N/A'}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
