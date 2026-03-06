import type {
  OutboundFloorData,
  OutboundFloorKpis,
  PackStation,
  PickStationBoardRow,
  PickTask,
  StationHeatCell,
} from '@/types/outbound'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function toTime(value: string | null): number {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function toDayKey(value: string | null): string | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

function toDayLabel(key: string): string {
  const date = new Date(`${key}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function computeLayout(rows: Array<Pick<PackStation, 'row' | 'column'>>): {
  fallbackColumns: number
} {
  const withCoordinates = rows.filter((entry) => entry.row !== null && entry.column !== null).length
  const fallbackColumns = withCoordinates > 0 ? 10 : 6

  return { fallbackColumns }
}

export function calculateOutboundFloorKpis(data: OutboundFloorData): OutboundFloorKpis {
  const now = Date.now()
  const openTasks = data.tasks.filter((task) => task.status !== 'completed').length
  const lateTasks = data.tasks.filter((task) => task.status !== 'completed' && toTime(task.dueAt) > 0 && toTime(task.dueAt) < now).length
  const unitsRemaining = data.tasks.reduce((total, task) => total + Math.max(task.remainingQty, 0), 0)

  const activeStations = data.stations.filter((station) => station.status === 'active').length
  const avgUtilization =
    data.stations.length > 0
      ? Number(
          (
            data.stations.reduce((total, station) => total + clamp(station.utilization, 0, 100), 0) /
            data.stations.length
          ).toFixed(1)
        )
      : 0

  const inventoryRisk = data.inventory.filter((item) => item.risk !== 'healthy').length
  const qaPending = data.inboundQaQueue.filter((entry) => entry.queueState === 'qa_pending').length
  const qaBlocked = data.inboundQaQueue.filter((entry) => entry.queueState === 'blocked').length

  return {
    openTasks,
    lateTasks,
    unitsRemaining,
    activeStations,
    avgUtilization,
    inventoryRisk,
    qaPending,
    qaBlocked,
  }
}

export function buildStationHeatmap(stations: PackStation[], tasks: PickTask[]): StationHeatCell[] {
  const assignedTaskCount = new Map<string, number>()

  for (const task of tasks) {
    if (!task.assignedStation || task.status === 'completed') {
      continue
    }
    assignedTaskCount.set(task.assignedStation, (assignedTaskCount.get(task.assignedStation) ?? 0) + 1)
  }

  const { fallbackColumns } = computeLayout(stations)

  const cells = stations.map((station, index) => {
    const assignedTasks = assignedTaskCount.get(station.label) ?? assignedTaskCount.get(station.id) ?? 0
    const load = station.queueDepth + assignedTasks
    const utilization = clamp(station.utilization > 0 ? station.utilization : load * 13, 0, 100)
    const intensity = clamp(Math.round(utilization * 0.7 + load * 6), 8, 100)

    const row = station.row ?? Math.floor(index / fallbackColumns) + 1
    const column = station.column ?? (index % fallbackColumns) + 1

    return {
      id: station.id,
      label: station.label,
      row,
      column,
      status: station.status,
      load,
      utilization,
      intensity,
      assignedTasks,
    } satisfies StationHeatCell
  })

  return cells.sort((a, b) => a.row - b.row || a.column - b.column)
}

export function calculateThroughputUph(tasks: PickTask[]): number {
  const now = Date.now()
  const lookbackMs = 4 * 60 * 60 * 1000
  const recentCompleted = tasks.filter((task) => {
    if (task.status !== 'completed' && task.status !== 'packed') {
      return false
    }

    const updatedAt = toTime(task.updatedAt)
    return updatedAt > 0 && now - updatedAt <= lookbackMs
  })

  const units = recentCompleted.reduce((total, task) => total + Math.max(task.pickedQty, task.quantity), 0)
  if (units > 0) {
    return Math.round(units / 4)
  }

  const completedUnits = tasks
    .filter((task) => task.status === 'completed' || task.status === 'packed')
    .reduce((total, task) => total + Math.max(task.pickedQty, task.quantity), 0)

  return Math.round(completedUnits / 8)
}

export function buildTaskFlowTrend(tasks: PickTask[], days = 10): {
  labels: string[]
  open: number[]
  completed: number[]
  blocked: number[]
} {
  const byDay = new Map<string, { open: number; completed: number; blocked: number }>()

  for (const task of tasks) {
    const dayKey = toDayKey(task.updatedAt ?? task.dueAt)
    if (!dayKey) {
      continue
    }

    const bucket = byDay.get(dayKey) ?? { open: 0, completed: 0, blocked: 0 }
    if (task.status === 'completed' || task.status === 'packed') {
      bucket.completed += 1
    } else if (task.status === 'blocked') {
      bucket.blocked += 1
    } else {
      bucket.open += 1
    }

    byDay.set(dayKey, bucket)
  }

  const keys = Array.from(byDay.keys()).sort((a, b) => a.localeCompare(b)).slice(-days)

  return {
    labels: keys.map(toDayLabel),
    open: keys.map((key) => byDay.get(key)?.open ?? 0),
    completed: keys.map((key) => byDay.get(key)?.completed ?? 0),
    blocked: keys.map((key) => byDay.get(key)?.blocked ?? 0),
  }
}

export function buildStationWorkload(stations: PackStation[], limit = 8): {
  labels: string[]
  utilization: number[]
  queueDepth: number[]
} {
  const sorted = [...stations]
    .sort((a, b) => b.utilization - a.utilization || b.queueDepth - a.queueDepth)
    .slice(0, limit)

  return {
    labels: sorted.map((station) => station.label),
    utilization: sorted.map((station) => Number(station.utilization.toFixed(0))),
    queueDepth: sorted.map((station) => station.queueDepth),
  }
}

export function buildPickStationBoard(tasks: PickTask[], limit = 16): PickStationBoardRow[] {
  const byStation = new Map<string, PickStationBoardRow>()

  for (const task of tasks) {
    if (task.status === 'completed') {
      continue
    }

    const key = task.assignedStation ?? `Zone ${task.zone}`
    const current = byStation.get(key) ?? {
      station: key,
      zone: task.zone,
      openTasks: 0,
      unitsRemaining: 0,
      avgPriority: 0,
    }

    current.openTasks += 1
    current.unitsRemaining += task.remainingQty
    current.avgPriority += task.priority
    byStation.set(key, current)
  }

  const rows = Array.from(byStation.values()).map((row) => ({
    ...row,
    avgPriority: row.openTasks > 0 ? Number((row.avgPriority / row.openTasks).toFixed(1)) : 0,
  }))

  return rows
    .sort((a, b) => b.unitsRemaining - a.unitsRemaining || b.openTasks - a.openTasks)
    .slice(0, limit)
}
