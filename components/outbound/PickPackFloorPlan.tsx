"use client"

import Link from 'next/link'
import { useMemo, useState } from 'react'
import FacilityLayoutCanvas from '@/components/facility/FacilityLayoutCanvas'
import type { FacilityLayoutData, FacilityLayoutItem } from '@/types/layout'
import type { InboundQaQueueItem, OutboundFloorData, PackStation, PickTask } from '@/types/outbound'
import type { AssociatePerformanceRow } from '@/types/associates'

type Props = {
  layoutData: FacilityLayoutData
  data: OutboundFloorData
  associates: AssociatePerformanceRow[]
  readOnly?: boolean
}

type StationAssignment = {
  associateId: string
  employeeId: string
  name: string
  station: string
  uph: number
  department: 'Pick' | 'Pack'
  detailHref: string
}

function splitByHalf<T>(rows: T[]): { west: T[]; east: T[] } {
  const midpoint = Math.ceil(rows.length / 2)
  return {
    west: rows.slice(0, midpoint),
    east: rows.slice(midpoint),
  }
}

function cardTone(itemType: string): string {
  switch (itemType) {
    case 'pick_block':
    case 'pack_block':
      return 'border-slate-700 bg-slate-600 text-white'
    case 'staging':
    case 'qa':
    case 'flex_group':
      return 'border-yellow-700 bg-yellow-200 text-zinc-900'
    case 'conveyor':
    case 'aisle':
    case 'drive_lane':
      return 'border-zinc-600 bg-zinc-600 text-white'
    case 'wall':
      return 'border-zinc-700 bg-zinc-700 text-white'
    default:
      return 'border-zinc-500 bg-zinc-200 text-zinc-900'
  }
}

function itemStats(item: FacilityLayoutItem, data: OutboundFloorData): { line1?: string; line2?: string } {
  const openTasks = data.tasks.filter((task) => task.status !== 'completed')
  const stationSplit = splitByHalf([...data.stations].sort((a, b) => a.label.localeCompare(b.label)))
  const pickTaskSplit = splitByHalf([...openTasks].sort((a, b) => a.taskNumber.localeCompare(b.taskNumber)))
  const qaSplit = splitByHalf([...data.inboundQaQueue].sort((a, b) => a.shipmentId.localeCompare(b.shipmentId)))

  switch (item.item_code) {
    case 'pick_north_west':
      return summarizePickZone(pickTaskSplit.west)
    case 'pick_north_east':
      return summarizePickZone(pickTaskSplit.east)
    case 'pack_south_west':
      return summarizePackZone(stationSplit.west)
    case 'pack_south_east':
      return summarizePackZone(stationSplit.east)
    case 'qa_west':
      return summarizeQaZone(qaSplit.west)
    case 'qa_east':
      return summarizeQaZone(qaSplit.east)
    case 'staging_north_west':
      return summarizeStagingZone(pickTaskSplit.west)
    case 'staging_north_east':
      return summarizeStagingZone(pickTaskSplit.east)
    default:
      return {}
  }
}

function summarizePickZone(tasks: PickTask[]): { line1?: string; line2?: string } {
  const open = tasks.length
  const units = tasks.reduce((sum, task) => sum + task.remainingQty, 0)
  return {
    line1: `${open} open tasks`,
    line2: `${units} units remaining`,
  }
}

function summarizePackZone(stations: PackStation[]): { line1?: string; line2?: string } {
  const active = stations.filter((station) => station.status === 'active').length
  const avgUtil = stations.length > 0 ? stations.reduce((sum, station) => sum + station.utilization, 0) / stations.length : 0
  return {
    line1: `${active}/${stations.length} active`,
    line2: `${avgUtil.toFixed(0)}% avg util`,
  }
}

function summarizeQaZone(queue: InboundQaQueueItem[]): { line1?: string; line2?: string } {
  const pending = queue.filter((entry) => entry.queueState === 'qa_pending').length
  const blocked = queue.filter((entry) => entry.queueState === 'blocked').length
  return {
    line1: `${pending} pending`,
    line2: `${blocked} blocked`,
  }
}

function summarizeStagingZone(tasks: PickTask[]): { line1?: string; line2?: string } {
  const queued = tasks.filter((task) => task.status === 'queued').length
  const late = tasks.filter((task) => task.status !== 'completed' && task.dueAt && Date.parse(task.dueAt) < Date.now()).length
  return {
    line1: `${queued} queued`,
    line2: `${late} late`,
  }
}

function zoneTasks(itemCode: string, data: OutboundFloorData): PickTask[] {
  const openTasks = data.tasks.filter((task) => task.status !== 'completed')
  const pickTaskSplit = splitByHalf([...openTasks].sort((a, b) => a.taskNumber.localeCompare(b.taskNumber)))

  if (itemCode === 'pick_north_west' || itemCode === 'staging_north_west') {
    return pickTaskSplit.west
  }

  if (itemCode === 'pick_north_east' || itemCode === 'staging_north_east') {
    return pickTaskSplit.east
  }

  return []
}

function zoneStations(itemCode: string, data: OutboundFloorData): PackStation[] {
  const stationSplit = splitByHalf([...data.stations].sort((a, b) => a.label.localeCompare(b.label)))

  if (itemCode === 'pack_south_west') {
    return stationSplit.west
  }

  if (itemCode === 'pack_south_east') {
    return stationSplit.east
  }

  return []
}

function zoneQa(itemCode: string, data: OutboundFloorData): InboundQaQueueItem[] {
  const qaSplit = splitByHalf([...data.inboundQaQueue].sort((a, b) => a.shipmentId.localeCompare(b.shipmentId)))

  if (itemCode === 'qa_west') {
    return qaSplit.west
  }

  if (itemCode === 'qa_east') {
    return qaSplit.east
  }

  return []
}

function chipTone(kind: 'station' | 'task' | 'qa', status: string): string {
  if (kind === 'station') {
    if (status === 'active') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50'
    if (status === 'blocked') return 'border-rose-400/40 bg-rose-500/15 text-rose-50'
    if (status === 'maintenance') return 'border-amber-400/40 bg-amber-500/15 text-amber-50'
    return 'border-sky-400/40 bg-sky-500/15 text-sky-50'
  }

  if (kind === 'task') {
    if (status === 'blocked') return 'border-rose-400/40 bg-rose-500/15 text-rose-50'
    if (status === 'picking') return 'border-blue-400/40 bg-blue-500/15 text-blue-50'
    if (status === 'queued') return 'border-amber-400/40 bg-amber-500/15 text-amber-50'
    return 'border-zinc-400/40 bg-zinc-700/30 text-zinc-50'
  }

  if (status === 'blocked') return 'border-rose-400/40 bg-rose-500/15 text-rose-50'
  if (status === 'qa_pending') return 'border-amber-400/40 bg-amber-500/15 text-amber-50'
  return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50'
}

function chipToneOnLight(kind: 'task' | 'qa', status: string): string {
  if (kind === 'task') {
    if (status === 'blocked') return 'border-rose-700/40 bg-rose-200/85 text-zinc-900'
    if (status === 'picking') return 'border-blue-700/40 bg-blue-200/85 text-zinc-900'
    if (status === 'queued') return 'border-amber-700/40 bg-amber-200/85 text-zinc-900'
    return 'border-zinc-600/40 bg-yellow-900/15 text-zinc-900'
  }

  if (status === 'blocked') return 'border-rose-700/40 bg-rose-200/85 text-zinc-900'
  if (status === 'qa_pending') return 'border-amber-700/40 bg-amber-200/85 text-zinc-900'
  return 'border-emerald-700/40 bg-emerald-200/85 text-zinc-900'
}

function compactTaskLabel(task: PickTask): string {
  const preferred = task.assignedStation ?? task.orderNumber ?? task.sku ?? task.taskNumber

  if (preferred.includes('-') && preferred.length > 16) {
    return preferred.slice(0, 8)
  }

  return preferred.length > 14 ? preferred.slice(0, 14) : preferred
}

function compactStationLabel(station: PackStation): string {
  return station.label.length > 12 ? station.label.slice(0, 12) : station.label
}

function compactShipmentLabel(entry: InboundQaQueueItem): string {
  return entry.shipmentId.length > 12 ? entry.shipmentId.slice(-12) : entry.shipmentId
}

function buildAssignments(data: OutboundFloorData, associates: AssociatePerformanceRow[]): StationAssignment[] {
  const activeAssociates = associates.length > 0 ? associates : []
  const pickStationNames = Array.from(new Set(data.tasks.filter((task) => task.status !== 'completed').map((task) => task.assignedStation ?? `Pick ${task.zone}`))).slice(0, 12)
  const packStationNames = data.stations.map((station) => station.label).slice(0, 12)
  const balancedStations = [...pickStationNames, ...packStationNames]

  return balancedStations.map((station, index) => {
    const source = activeAssociates[index % Math.max(activeAssociates.length, 1)]
    const employeeId = source?.employee_id ?? `EMP-${String(4100 + index).padStart(4, '0')}`
    const name = source?.full_name ?? ['Jordan Ellis', 'Taylor Brooks', 'Morgan Lee', 'Casey Rivera'][index % 4]
    const target = source?.target_uph ?? 88

    return {
      associateId: source?.associate_id ?? `demo-associate-${index + 1}`,
      employeeId,
      name,
      station,
      uph: source?.uph ?? target + ((index % 5) - 2) * 3,
      department: index < pickStationNames.length ? 'Pick' : 'Pack',
      detailHref: source ? `/associates/${encodeURIComponent(employeeId)}` : '/associates',
    }
  })
}

function stationForItem(item: FacilityLayoutItem, data: OutboundFloorData): string {
  if (item.item_type === 'pack_block') {
    return zoneStations(item.item_code, data)[0]?.label ?? item.item_label.replaceAll('_', ' ')
  }

  if (item.item_type === 'pick_block') {
    return zoneTasks(item.item_code, data)[0]?.assignedStation ?? item.item_label.replaceAll('_', ' ')
  }

  return item.item_label.replaceAll('_', ' ')
}

export default function PickPackFloorPlan({ layoutData, data, associates, readOnly = false }: Props) {
  const firstWorkstationCode = layoutData.items.find((item) => item.item_type === 'pick_block' || item.item_type === 'pack_block')?.item_code ?? null
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(firstWorkstationCode)
  const [assignments, setAssignments] = useState(() => buildAssignments(data, associates))
  const destinationOptions = useMemo(() => Array.from(new Set(assignments.map((assignment) => assignment.station))).sort(), [assignments])

  if (!layoutData.layout || layoutData.items.length === 0) {
    return null
  }

  const selectedItem = layoutData.items.find((item) => item.item_code === selectedItemCode) ?? null
  const selectedStation = selectedItem ? stationForItem(selectedItem, data) : null
  const selectedAssignment =
    assignments.find((assignment) => assignment.station === selectedStation) ??
    assignments.find((assignment) => assignment.department === (selectedItem?.item_type === 'pack_block' ? 'Pack' : 'Pick')) ??
    null

  function moveAssociate(associateId: string, station: string) {
    if (readOnly) {
      return
    }

    setAssignments((current) =>
      current.map((assignment) => (assignment.associateId === associateId ? { ...assignment, station } : assignment))
    )
  }

  return (
    <div className="space-y-4">
      <FacilityLayoutCanvas
        layout={layoutData.layout}
        items={layoutData.items}
        title="BlueLineOps Pick/Pack Floor Plan"
        renderItem={(item) => {
          const stats = itemStats(item, data)
          const tone = cardTone(item.item_type)
          const isLane = ['aisle', 'conveyor', 'wall'].includes(item.item_type)
          const isLightZone = ['staging', 'qa'].includes(item.item_type)
          const tasks = zoneTasks(item.item_code, data).slice(0, 4)
          const stations = zoneStations(item.item_code, data).slice(0, 6)
          const qaRows = zoneQa(item.item_code, data).slice(0, 4)
          const clickable = item.item_type === 'pick_block' || item.item_type === 'pack_block'

          return (
          <article
            className={`flex h-full w-full min-h-0 flex-col overflow-hidden rounded-md border px-2 py-1 ${tone} ${isLane ? 'justify-center' : 'justify-between'} shadow-sm ${clickable ? 'cursor-pointer ring-1 ring-transparent transition hover:ring-blue-300/70' : ''}`}
            onClick={() => {
              if (clickable) {
                setSelectedItemCode(item.item_code)
              }
            }}
          >
            <div
              className={`font-semibold leading-tight ${
                isLane ? 'text-center text-[9px] sm:text-[10px] md:text-xs' : 'text-[9px] sm:text-[10px] md:text-xs'
              }`}
            >
              {item.item_label.replaceAll('_', ' ')}
            </div>
            {!isLane && (stats.line1 || stats.line2) ? (
              <div className="mt-1 space-y-0.5 text-[9px] font-medium opacity-90 sm:text-[10px]">
                {stats.line1 ? <div>{stats.line1}</div> : null}
                {stats.line2 ? <div>{stats.line2}</div> : null}
              </div>
            ) : null}

            {!isLane && tasks.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded border px-1 py-0.5 text-[8px] font-medium leading-tight ${isLightZone ? chipToneOnLight('task', task.status) : chipTone('task', task.status)}`}
                    title={`${task.taskNumber} | ${task.remainingQty} units`}
                  >
                    <div className="truncate">{compactTaskLabel(task)}</div>
                    <div>{task.remainingQty} u</div>
                  </div>
                ))}
              </div>
            ) : null}

            {!isLane && stations.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className={`rounded border px-1 py-0.5 text-[8px] font-medium leading-tight ${chipTone('station', station.status)}`}
                    title={`${station.label} | ${station.utilization.toFixed(0)}%`}
                  >
                    <div className="truncate">{compactStationLabel(station)}</div>
                    <div>{station.utilization.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            ) : null}

            {!isLane && qaRows.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {qaRows.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded border px-1 py-0.5 text-[8px] font-medium leading-tight ${isLightZone ? chipToneOnLight('qa', entry.queueState) : chipTone('qa', entry.queueState)}`}
                    title={`${entry.shipmentId} | ${entry.queueState}`}
                  >
                    <div className="truncate">{compactShipmentLabel(entry)}</div>
                    <div className="truncate">{entry.queueState.replaceAll('_', ' ')}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
          )
        }}
      />

      {selectedItem && selectedAssignment ? (
        <section className="ops-card rounded-2xl border border-blue-400/40 bg-[linear-gradient(150deg,rgba(3,7,18,0.97),rgba(15,23,42,0.92))] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-zinc-100">{selectedStation}</h3>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                <div>Associate: <span className="font-semibold text-zinc-100">{selectedAssignment.name}</span></div>
                <div>Employee: <span className="font-semibold text-zinc-100">{selectedAssignment.employeeId}</span></div>
                <div>Station: <span className="font-semibold text-zinc-100">{selectedAssignment.station}</span></div>
                <div>UPH: <span className="font-semibold text-zinc-100">{selectedAssignment.uph.toFixed(1)}</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedItemCode(null)}
              className="rounded-lg border border-zinc-600/70 px-3 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Close
            </button>
          </div>

          {readOnly ? (
            <div className="mt-5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              View-only users can inspect floor assignments but cannot reassign associates.
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-sm font-medium text-zinc-300">
              Move associate to
              <select
                value={selectedAssignment.station}
                onChange={(event) => moveAssociate(selectedAssignment.associateId, event.target.value)}
                disabled={readOnly}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-400 sm:w-64"
              >
                {destinationOptions.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </label>

            <Link
              href={selectedAssignment.detailHref}
              className="rounded-lg border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-500/20"
            >
              {selectedAssignment.detailHref === '/associates' ? 'Open Associates Dashboard' : 'Open Associate Details'}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
