import BarChart from '@/components/charts/BarChart'
import KpiTile from '@/components/kpi/KpiTile'
import { getAssociateCurrentPerformance, getAssociateSkillMatrix } from '@/lib/queries/associates'
import type { AssociatePerformanceRow, AssociateSkillEntry, AssociateSkillMatrixRow } from '@/types/associates'

function titleCase(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown'
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatSkillList(skills: AssociateSkillEntry[]): string {
  if (skills.length === 0) {
    return 'None recorded'
  }

  return skills.map((skill) => skill.label).join(', ')
}

function performanceTone(value: string | null | undefined): string {
  if (value === 'below') {
    return 'border-rose-400/40 bg-rose-500/15 text-rose-100'
  }
  if (value === 'at_risk') {
    return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
  }
  if (value === 'on_target') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
  }
  if (value === 'above') {
    return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
  }

  return 'border-zinc-500/50 bg-zinc-700/30 text-zinc-100'
}

function summarizeWorkforce(
  matrixRows: AssociateSkillMatrixRow[],
  performanceRows: AssociatePerformanceRow[]
): {
  totalAssociates: number
  trackedAssociates: number
  belowTarget: number
  aboveTarget: number
  forkliftCertified: number
  clampCertified: number
} {
  const forkliftCertified = matrixRows.filter((row) => row.equipment_skills.some((skill) => skill.code === 'forklift_standard')).length
  const clampCertified = matrixRows.filter((row) => row.attachment_skills.some((skill) => skill.code === 'clamp_attachment')).length

  return {
    totalAssociates: matrixRows.length,
    trackedAssociates: performanceRows.length,
    belowTarget: performanceRows.filter((row) => row.performance_band === 'below' || row.performance_band === 'at_risk').length,
    aboveTarget: performanceRows.filter((row) => row.performance_band === 'above').length,
    forkliftCertified,
    clampCertified,
  }
}

function topPerformers(rows: AssociatePerformanceRow[]): AssociatePerformanceRow[] {
  const rankedRows = [...rows]
    .filter((row) => row.uph !== null && row.uph !== undefined)
    .sort((a, b) => (b.uph ?? 0) - (a.uph ?? 0))

  const preferredRows = rankedRows.filter((row) => row.performance_band === 'above' || row.performance_band === 'on_target')

  return (preferredRows.length > 0 ? preferredRows : rankedRows).slice(0, 6)
}

function atRiskPerformers(rows: AssociatePerformanceRow[]): AssociatePerformanceRow[] {
  return [...rows]
    .filter((row) => row.performance_band === 'below' || row.performance_band === 'at_risk')
    .sort((a, b) => (a.variance_to_target ?? 0) - (b.variance_to_target ?? 0))
    .slice(0, 8)
}

export default async function AssociatesPage() {
  const [matrixRows, performanceRows] = await Promise.all([
    getAssociateSkillMatrix(),
    getAssociateCurrentPerformance(),
  ])

  const workforce = summarizeWorkforce(matrixRows, performanceRows)
  const topRows = topPerformers(performanceRows)
  const riskRows = atRiskPerformers(performanceRows)

  const topLabels = topRows.map((row) => row.full_name.split(' ')[0])
  const topSeries = [
    {
      name: 'Actual UPH',
      color: '#38bdf8',
      values: topRows.map((row) => row.uph ?? 0),
    },
    {
      name: 'Target UPH',
      color: '#f59e0b',
      values: topRows.map((row) => row.target_uph ?? 0),
    },
  ]

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-blue-500">Associates</span>{' '}
            <span className="text-[var(--foreground)]">Dashboard</span>
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-400">
            Live workforce readiness, certification coverage, and UPH performance from the new associate skills and performance views.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.92),rgba(15,23,42,0.84))] px-5 py-4 text-sm text-zinc-300">
          <div className="text-zinc-400">Performance basis</div>
          <div className="mt-1 font-semibold text-zinc-100">Today&apos;s tracked output by skill and UPH target</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
        <KpiTile title="Associates" value={workforce.totalAssociates} />
        <KpiTile title="Tracked Today" value={workforce.trackedAssociates} accent="text-cyan-100 group-hover:text-cyan-50" />
        <KpiTile title="Below Target" value={workforce.belowTarget} accent="text-rose-100 group-hover:text-rose-50" />
        <KpiTile title="Above Target" value={workforce.aboveTarget} accent="text-emerald-100 group-hover:text-emerald-50" />
        <KpiTile title="Forklift Cert" value={workforce.forkliftCertified} accent="text-blue-100 group-hover:text-blue-50" />
        <KpiTile title="Clamp Cert" value={workforce.clampCertified} accent="text-amber-100 group-hover:text-amber-50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-6">
          <BarChart
            title="Top Productivity vs Target"
            description="Highest tracked performers for today, prioritized to associates meeting or beating target UPH."
            labels={topLabels}
            series={topSeries}
          />

          <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
            <h2 className="text-xl font-semibold text-zinc-100">Top Performers</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Ranked associates with the strongest tracked UPH for today.
            </p>

            <div className="mt-5 space-y-3">
              {topRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/35 p-4 text-sm text-zinc-400">
                  No tracked performers returned yet. Load associate task events to activate this panel.
                </div>
              ) : (
                topRows.map((row, index) => (
                  <article key={`${row.associate_id}-${row.skill_code ?? 'untracked'}-top`} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">
                          {index + 1}. {row.full_name}
                        </div>
                        <div className="mt-1 text-xs text-zinc-400">
                          {row.skill_label ?? 'Untracked skill'} | {row.shift ?? 'No shift'}
                        </div>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${performanceTone(row.performance_band)}`}>
                        {titleCase(row.performance_band)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-zinc-300">
                      <div>
                        <div className="text-zinc-500">UPH</div>
                        <div className="mt-1 font-semibold text-zinc-100">{row.uph?.toFixed(1) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">Target</div>
                        <div className="mt-1 font-semibold text-zinc-100">{row.target_uph?.toFixed(1) ?? 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500">Variance</div>
                        <div className="mt-1 font-semibold text-zinc-100">{row.variance_to_target?.toFixed(1) ?? 'N/A'}</div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">At-Risk Performers</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Current associates below or trailing target UPH. Empty state is expected until task events are loaded.
          </p>

          <div className="mt-5 space-y-3">
            {riskRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/35 p-4 text-sm text-zinc-400">
                No below-target associates returned yet. Load demo task events to activate this panel.
              </div>
            ) : (
              riskRows.map((row) => (
                <article key={`${row.associate_id}-${row.skill_code ?? 'untracked'}`} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">{row.full_name}</div>
                      <div className="mt-1 text-xs text-zinc-400">{row.skill_label ?? 'Untracked skill'} | {row.shift ?? 'No shift'}</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${performanceTone(row.performance_band)}`}>
                      {titleCase(row.performance_band)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-zinc-300">
                    <div>
                      <div className="text-zinc-500">UPH</div>
                      <div className="mt-1 font-semibold text-zinc-100">{row.uph?.toFixed(1) ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Target</div>
                      <div className="mt-1 font-semibold text-zinc-100">{row.target_uph?.toFixed(1) ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Variance</div>
                      <div className="mt-1 font-semibold text-zinc-100">{row.variance_to_target?.toFixed(1) ?? 'N/A'}</div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">Certification Matrix</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Role training, equipment authorization, and attachment certification from `associate_skill_matrix`.
            </p>
          </div>
          <div className="text-sm text-zinc-400">Source: `associate_skill_matrix` + `associate_current_performance`</div>
        </div>

        {matrixRows.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-700/60 bg-zinc-900/35 p-6 text-sm text-zinc-400">
            No associates found yet. Add sample associates, assign skills, and log task events to populate this dashboard.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-300">
                  <th className="px-4 py-3 font-semibold">Associate</th>
                  <th className="px-4 py-3 font-semibold">Shift / Team</th>
                  <th className="px-4 py-3 font-semibold">Roles</th>
                  <th className="px-4 py-3 font-semibold">Equipment</th>
                  <th className="px-4 py-3 font-semibold">Attachments</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row) => (
                  <tr key={row.associate_id} className="border-b border-white/5 text-zinc-200 align-top hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">{row.full_name}</div>
                      <div className="text-xs text-zinc-400">{row.employee_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.shift ?? 'No shift'}</div>
                      <div className="text-xs text-zinc-400">{row.team ?? 'No team'}</div>
                    </td>
                    <td className="px-4 py-3">{formatSkillList(row.role_skills)}</td>
                    <td className="px-4 py-3">{formatSkillList(row.equipment_skills)}</td>
                    <td className="px-4 py-3">{formatSkillList(row.attachment_skills)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
