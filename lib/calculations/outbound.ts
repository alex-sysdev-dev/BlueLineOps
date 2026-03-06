import type {
  OutboundFloorData,
  OutboundFloorKpis,
  PackStation,
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
