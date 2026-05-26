"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useState } from 'react'

export type AssociateDirectoryRow = {
  associateId: string
  employeeId: string
  fullName: string
  status: string
  shift: string
  manager: string
  department: string
  zone: string
  photoPath: string
  uph: number
  targetUph: number
  varianceToTarget: number
  performanceBand: string
  roleSummary: string
}

type Props = {
  rows: AssociateDirectoryRow[]
}

const ALL = 'All'

function unique(values: string[]): string[] {
  return [ALL, ...Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))]
}

function bandTone(value: string): string {
  if (value === 'above') return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
  if (value === 'on_target') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
  if (value === 'at_risk') return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
  if (value === 'below') return 'border-rose-400/40 bg-rose-500/15 text-rose-100'
  return 'border-zinc-500/50 bg-zinc-700/30 text-zinc-100'
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

export default function AssociatesTable({ rows }: Props) {
  const [shift, setShift] = useState(ALL)
  const [manager, setManager] = useState(ALL)
  const [department, setDepartment] = useState(ALL)
  const [zone, setZone] = useState(ALL)

  const options = useMemo(
    () => ({
      shifts: unique(rows.map((row) => row.shift)),
      managers: unique(rows.map((row) => row.manager)),
      departments: unique(rows.map((row) => row.department)),
      zones: unique(rows.map((row) => row.zone)),
    }),
    [rows]
  )

  const filteredRows = rows.filter((row) => {
    return (
      (shift === ALL || row.shift === shift) &&
      (manager === ALL || row.manager === manager) &&
      (department === ALL || row.department === department) &&
      (zone === ALL || row.zone === zone)
    )
  })

  const controls = [
    { label: 'Shift', value: shift, setValue: setShift, options: options.shifts },
    { label: 'Manager', value: manager, setValue: setManager, options: options.managers },
    { label: 'Department', value: department, setValue: setDepartment, options: options.departments },
    { label: 'Zone', value: zone, setValue: setZone, options: options.zones },
  ]

  return (
    <section className="ops-card rounded-2xl border border-zinc-700/70 bg-[linear-gradient(150deg,rgba(3,7,18,0.95),rgba(15,23,42,0.88))] p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Associate Roster</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {controls.map((control) => (
            <label key={control.label} className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              {control.label}
              <select
                value={control.value}
                onChange={(event) => control.setValue(event.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm normal-case tracking-normal text-zinc-100 outline-none transition-colors focus:border-blue-400"
              >
                {control.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-zinc-300">
              <th className="px-4 py-3 font-semibold">Associate</th>
              <th className="px-4 py-3 font-semibold">Shift</th>
              <th className="px-4 py-3 font-semibold">Manager</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Zone</th>
              <th className="px-4 py-3 font-semibold">UPH</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Band</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.associateId} className="border-b border-white/5 text-zinc-200 transition-colors hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/associates/${encodeURIComponent(row.employeeId)}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-300/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.45),rgba(20,184,166,0.35))] text-sm font-semibold text-white">
                      <Image
                        src={row.photoPath}
                        alt={`${row.fullName} associate thumbnail`}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-full object-cover"
                      />
                      <span className="sr-only">{initials(row.fullName)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-zinc-100">{row.fullName}</div>
                      <div className="text-xs text-zinc-400">{row.employeeId}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">{row.shift}</td>
                <td className="px-4 py-3">{row.manager}</td>
                <td className="px-4 py-3">{row.department}</td>
                <td className="px-4 py-3">{row.zone}</td>
                <td className="px-4 py-3">{row.uph.toFixed(1)}</td>
                <td className="px-4 py-3">{row.targetUph.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${bandTone(row.performanceBand)}`}>
                    {labelize(row.performanceBand)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
