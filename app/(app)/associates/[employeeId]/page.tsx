import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import KpiTile from '@/components/kpi/KpiTile'
import { buildAssociateDirectoryRows, generateMockData, synthesizePerformanceRows } from '@/lib/calculations/associates'
import { getAssociateCurrentPerformance, getAssociateSkillMatrix } from '@/lib/queries/associates'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ employeeId: string }>
}

function labelize(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default async function AssociateDetailPage({ params }: Props) {
  const { employeeId } = await params
  const [rawMatrixRows, rawPerformanceRows] = await Promise.all([
    getAssociateSkillMatrix(),
    getAssociateCurrentPerformance(),
  ])

  let matrixRows = rawMatrixRows
  let performanceRows = rawPerformanceRows

  if (matrixRows.length === 0 && performanceRows.length === 0) {
    const mock = generateMockData()
    matrixRows = mock.matrixRows
    performanceRows = mock.performanceRows
  } else if (performanceRows.length === 0) {
    performanceRows = synthesizePerformanceRows(matrixRows)
  }

  const rows = buildAssociateDirectoryRows(matrixRows, performanceRows)
  const associate = rows.find((row) => row.employeeId === decodeURIComponent(employeeId))

  if (!associate) {
    notFound()
  }

  const performance = performanceRows.filter((row) => row.employee_id === associate.employeeId)
  const matrix = matrixRows.find((row) => row.employee_id === associate.employeeId)
  const completedUnits = performance.reduce((sum, row) => sum + (row.units_completed ?? 0), 0)
  const tasksCompleted = performance.reduce((sum, row) => sum + (row.tasks_completed ?? 0), 0)
  const hoursWorked = performance.reduce((sum, row) => sum + (row.hours_worked ?? 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-blue-300/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.45),rgba(20,184,166,0.35))] text-xl font-semibold text-white">
            <Image
              src={associate.photoPath}
              alt={`${associate.fullName} associate profile`}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
            <span className="sr-only">{initials(associate.fullName)}</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{associate.fullName}</h1>
            <div className="mt-1 text-sm text-zinc-400">
              {associate.employeeId} | {associate.shift} | {associate.department} | {associate.zone}
            </div>
          </div>
        </div>

        <Link
          href="/associates"
          className="rounded-xl border border-zinc-600/70 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700/70"
        >
          Back to Associates
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <KpiTile title="UPH" value={associate.uph} />
        <KpiTile title="Target UPH" value={associate.targetUph} />
        <KpiTile title="Variance" value={associate.varianceToTarget} />
        <KpiTile title="Units" value={completedUnits} />
        <KpiTile title="Tasks" value={tasksCompleted} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="ops-card rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Associate Profile</h2>
          <dl className="mt-5 grid grid-cols-1 gap-4 text-sm">
            {[
              ['Manager', associate.manager],
              ['Department', associate.department],
              ['Zone', associate.zone],
              ['Current Role', associate.roleSummary],
              ['Performance Band', labelize(associate.performanceBand)],
              ['Hours Worked', hoursWorked.toFixed(1)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-700/60 bg-zinc-900/45 px-4 py-3">
                <dt className="text-zinc-400">{label}</dt>
                <dd className="font-medium text-zinc-100">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="ops-card rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
          <h2 className="text-xl font-semibold text-zinc-100">Skills and Certifications</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['Roles', matrix?.role_skills.map((skill) => skill.label) ?? []],
              ['Equipment', matrix?.equipment_skills.map((skill) => skill.label) ?? []],
              ['Attachments', matrix?.attachment_skills.map((skill) => skill.label) ?? []],
            ].map(([label, values]) => (
              <div key={label as string} className="rounded-xl border border-zinc-700/60 bg-zinc-900/45 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">{label as string}</div>
                <div className="mt-3 space-y-2">
                  {(values as string[]).length > 0 ? (
                    (values as string[]).map((value) => (
                      <div key={value} className="rounded-lg border border-zinc-700/60 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200">
                        {value}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-zinc-700/60 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-400">
                      Training record open
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
