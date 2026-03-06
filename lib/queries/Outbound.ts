import { supabase } from '@/lib/supabase'
import { getInboundItems, getInboundShipments } from '@/lib/queries/inbound'
import { getQaInspections } from '@/lib/queries/qa'
import type {
  InboundQaQueueItem,
  InboundQueueState,
  InventoryItem,
  InventoryRisk,
  OutboundFloorData,
  PackStation,
  PackStationStatus,
  PickTask,
  PickTaskStatus,
} from '@/types/outbound'
import type { QaInspection, QaResult } from '@/types/qa'

type RawRow = Record<string, unknown>

const STATUS_SORT_ORDER: Record<PickTaskStatus, number> = {
  blocked: 0,
  picking: 1,
  queued: 2,
  packed: 3,
  unknown: 4,
  completed: 5,
}

const QUEUE_STATE_ORDER: Record<InboundQueueState, number> = {
  blocked: 0,
  qa_pending: 1,
  arrived: 2,
  received: 3,
  scheduled: 4,
  released: 5,
  unknown: 6,
}

function pickString(row: RawRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return null
}

function pickNumber(row: RawRow, keys: string[]): number | null {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function toTime(value: string | null): number {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function parseGridCoordinate(label: string | null): { row: number | null; column: number | null } {
  if (!label) {
    return { row: null, column: null }
  }

  const normalized = label.trim().toUpperCase()
  const match = normalized.match(/^([A-Z])[-\s]?(\d{1,2})$/)
  if (!match) {
    return { row: null, column: null }
  }

  const row = match[1].charCodeAt(0) - 64
  const column = Number(match[2])
  if (!Number.isFinite(row) || !Number.isFinite(column)) {
    return { row: null, column: null }
  }

  return { row, column }
}

function normalizePickTaskStatus(value: string | null): PickTaskStatus {
  const normalized = value?.toLowerCase()
  if (!normalized) {
    return 'unknown'
  }

  if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('closed')) {
    return 'completed'
  }

  if (normalized.includes('block') || normalized.includes('hold') || normalized.includes('exception')) {
    return 'blocked'
  }

  if (normalized.includes('pack')) {
    return 'packed'
  }

  if (normalized.includes('progress') || normalized.includes('active') || normalized.includes('pick')) {
    return 'picking'
  }

  if (normalized.includes('queue') || normalized.includes('new') || normalized.includes('ready') || normalized.includes('open')) {
    return 'queued'
  }

  return 'unknown'
}

function normalizeStationStatus(value: string | null): PackStationStatus {
  const normalized = value?.toLowerCase()
  if (!normalized) {
    return 'unknown'
  }

  if (normalized.includes('maint') || normalized.includes('repair') || normalized.includes('service')) {
    return 'maintenance'
  }

  if (normalized.includes('off') || normalized.includes('down')) {
    return 'offline'
  }

  if (normalized.includes('block') || normalized.includes('hold') || normalized.includes('error')) {
    return 'blocked'
  }

  if (normalized.includes('idle') || normalized.includes('ready') || normalized.includes('standby')) {
    return 'idle'
  }

  if (normalized.includes('active') || normalized.includes('busy') || normalized.includes('running')) {
    return 'active'
  }

  return 'unknown'
}

function normalizePriority(value: number | null, label: string | null): number {
  if (value !== null) {
    return Math.max(1, Math.round(value))
  }

  const normalized = label?.toLowerCase()
  if (!normalized) {
    return 2
  }

  if (normalized.includes('critical') || normalized.includes('urgent') || normalized.includes('high')) {
    return 4
  }

  if (normalized.includes('medium')) {
    return 3
  }

  if (normalized.includes('low')) {
    return 1
  }

  return 2
}

function normalizeInventoryRisk(netQty: number, reorderPoint: number): InventoryRisk {
  if (netQty <= reorderPoint) {
    return 'critical'
  }

  if (netQty <= reorderPoint * 1.5) {
    return 'watch'
  }

  return 'healthy'
}

function normalizePickTask(row: RawRow, index: number): PickTask {
  const id = pickString(row, ['id', 'task_id']) ?? `task-${index + 1}`
  const taskNumber = pickString(row, ['task_number', 'wave_task', 'pick_id', 'id']) ?? `TASK-${index + 1}`
  const orderNumber = pickString(row, ['order_number', 'order_id', 'shipment_id'])
  const sku = pickString(row, ['sku', 'product_id', 'item_id']) ?? 'Unknown SKU'
  const zone = pickString(row, ['zone', 'pick_zone', 'aisle', 'area']) ?? 'General'
  const quantity = Math.max(1, pickNumber(row, ['qty', 'quantity', 'expected_qty']) ?? 1)
  const pickedQty = Math.max(0, pickNumber(row, ['picked_qty', 'completed_qty', 'done_qty']) ?? 0)
  const remainingQty = Math.max(quantity - pickedQty, 0)
  const status = normalizePickTaskStatus(pickString(row, ['status', 'task_status']))
  const priority = normalizePriority(
    pickNumber(row, ['priority', 'priority_score', 'priority_rank']),
    pickString(row, ['priority_label', 'priority_bucket'])
  )

  return {
    id,
    taskNumber,
    orderNumber,
    sku,
    zone,
    status,
    priority,
    quantity,
    pickedQty,
    remainingQty,
    assignedStation: pickString(row, ['pack_station', 'station_code', 'station_id', 'assigned_station']),
    dueAt: pickString(row, ['due_at', 'sla_at', 'ship_by', 'needed_by']),
    updatedAt: pickString(row, ['updated_at', 'started_at', 'created_at']),
  }
}

function normalizeStation(row: RawRow, index: number): PackStation {
  const id = pickString(row, ['id', 'station_id']) ?? `station-${index + 1}`
  const label = pickString(row, ['station_code', 'name', 'label', 'id']) ?? `ST-${index + 1}`
  const queueDepth = Math.max(0, pickNumber(row, ['queue_depth', 'queue', 'active_task_count', 'pending_tasks']) ?? 0)

  const rawUtilization = pickNumber(row, ['utilization', 'utilization_pct', 'utilization_percent'])
  const utilization = Math.max(
    0,
    Math.min(100, rawUtilization === null ? queueDepth * 12 : rawUtilization <= 1 ? rawUtilization * 100 : rawUtilization)
  )

  const grid = parseGridCoordinate(label)

  return {
    id,
    label,
    status: normalizeStationStatus(pickString(row, ['status', 'station_status', 'state'])),
    operator: pickString(row, ['operator_name', 'associate_name', 'user_name', 'current_operator']),
    queueDepth,
    utilization: Number(utilization.toFixed(1)),
    row: pickNumber(row, ['row', 'row_index', 'y']) ?? grid.row,
    column: pickNumber(row, ['column', 'col', 'col_index', 'x']) ?? grid.column,
    activeTaskNumber: pickString(row, ['current_task', 'active_task', 'current_order']),
    updatedAt: pickString(row, ['updated_at', 'last_scan_at', 'last_activity_at']),
  }
}

function normalizeInventoryItem(row: RawRow, index: number): InventoryItem {
  const id = pickString(row, ['id', 'inventory_id']) ?? `inventory-${index + 1}`
  const sku = pickString(row, ['sku', 'product_id', 'item_id']) ?? `SKU-${index + 1}`
  const availableQty = Math.max(0, pickNumber(row, ['available_qty', 'on_hand_qty', 'quantity']) ?? 0)
  const reservedQty = Math.max(0, pickNumber(row, ['reserved_qty', 'allocated_qty', 'hold_qty']) ?? 0)
  const netQty = availableQty - reservedQty
  const reorderPoint = Math.max(1, pickNumber(row, ['reorder_point', 'min_qty', 'safety_stock']) ?? 10)

  return {
    id,
    sku,
    location: pickString(row, ['location', 'bin_location', 'zone', 'aisle']) ?? 'Unknown location',
    availableQty,
    reservedQty,
    netQty,
    reorderPoint,
    velocity: pickString(row, ['velocity_class', 'velocity', 'abc_class']),
    risk: normalizeInventoryRisk(netQty, reorderPoint),
    updatedAt: pickString(row, ['updated_at', 'last_counted_at', 'created_at']),
  }
}

function queueStateFrom(shipmentStatus: string, qaResult: QaResult): InboundQueueState {
  if (qaResult === 'fail') {
    return 'blocked'
  }

  if (qaResult === 'pass') {
    return 'released'
  }

  if (qaResult === 'pending') {
    return 'qa_pending'
  }

  if (shipmentStatus === 'scheduled') {
    return 'scheduled'
  }

  if (shipmentStatus === 'arrived') {
    return 'arrived'
  }

  if (shipmentStatus === 'received') {
    return 'qa_pending'
  }

  return 'unknown'
}

async function getTableRows(table: string): Promise<RawRow[]> {
  const { data, error } = await supabase.from(table).select('*')
  if (error) {
    console.error(`Supabase fetch error for ${table}:`, error)
    return []
  }

  return (data as RawRow[] | null) ?? []
}

function latestQaByKey(inspections: QaInspection[]): {
  byShipmentProduct: Map<string, QaInspection>
  byShipment: Map<string, QaInspection>
} {
  const byShipmentProduct = new Map<string, QaInspection>()
  const byShipment = new Map<string, QaInspection>()

  for (const inspection of inspections) {
    const shipmentId = inspection.shipmentId ?? ''
    const productId = inspection.productId ?? ''

    if (!shipmentId) {
      continue
    }

    const compositeKey = `${shipmentId}::${productId}`
    const currentByComposite = byShipmentProduct.get(compositeKey)
    if (!currentByComposite || toTime(inspection.inspectedAt) > toTime(currentByComposite.inspectedAt)) {
      byShipmentProduct.set(compositeKey, inspection)
    }

    const currentByShipment = byShipment.get(shipmentId)
    if (!currentByShipment || toTime(inspection.inspectedAt) > toTime(currentByShipment.inspectedAt)) {
      byShipment.set(shipmentId, inspection)
    }
  }

  return { byShipmentProduct, byShipment }
}

export async function getPickTasks(): Promise<PickTask[]> {
  const rows = await getTableRows('pick_tasks')
  const tasks = rows.map(normalizePickTask)

  return tasks.sort((a, b) => {
    const statusRank = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]
    if (statusRank !== 0) {
      return statusRank
    }

    if (a.priority !== b.priority) {
      return b.priority - a.priority
    }

    return toTime(a.dueAt) - toTime(b.dueAt)
  })
}

export async function getPickPackStations(): Promise<PackStation[]> {
  const rows = await getTableRows('pick_pack_stations')

  return rows
    .map(normalizeStation)
    .sort((a, b) => {
      if (a.row !== null && b.row !== null && a.row !== b.row) {
        return a.row - b.row
      }
      if (a.column !== null && b.column !== null && a.column !== b.column) {
        return a.column - b.column
      }

      return a.label.localeCompare(b.label)
    })
}

export async function getInventoryView(): Promise<InventoryItem[]> {
  const rows = await getTableRows('inventory')
  const riskOrder: Record<InventoryRisk, number> = { critical: 0, watch: 1, healthy: 2 }

  return rows
    .map(normalizeInventoryItem)
    .sort((a, b) => {
      if (riskOrder[a.risk] !== riskOrder[b.risk]) {
        return riskOrder[a.risk] - riskOrder[b.risk]
      }

      return a.netQty - b.netQty
    })
}

export async function getInboundQaQueue(): Promise<InboundQaQueueItem[]> {
  try {
    const [shipments, items, inspections] = await Promise.all([
      getInboundShipments(),
      getInboundItems(),
      getQaInspections(),
    ])

    const shipmentById = new Map(shipments.map((shipment) => [shipment.id, shipment]))
    const qaMaps = latestQaByKey(inspections)

    const queue = items.map((item, index) => {
      const shipment = shipmentById.get(item.shipment_id)
      const compositeKey = `${item.shipment_id}::${item.product_id}`
      const inspection = qaMaps.byShipmentProduct.get(compositeKey) ?? qaMaps.byShipment.get(item.shipment_id)
      const qaResult = inspection?.result ?? 'pending'
      const shipmentStatus = item.status ?? shipment?.status ?? 'unknown'
      const queueState = queueStateFrom(shipmentStatus, qaResult)

      return {
        id: `${item.shipment_id}-${item.product_id}-${index + 1}`,
        shipmentId: item.shipment_id,
        supplier: item.supplier,
        eta: item.eta ?? shipment?.eta ?? null,
        productId: item.product_id,
        expectedQty: item.expected_qty,
        receivedQty: item.received_qty,
        varianceQty: item.received_qty - item.expected_qty,
        shipmentStatus,
        qaResult,
        queueState,
        inspector: inspection?.inspector ?? null,
        inspectedAt: inspection?.inspectedAt ?? null,
      } satisfies InboundQaQueueItem
    })

    return queue.sort((a, b) => {
      if (QUEUE_STATE_ORDER[a.queueState] !== QUEUE_STATE_ORDER[b.queueState]) {
        return QUEUE_STATE_ORDER[a.queueState] - QUEUE_STATE_ORDER[b.queueState]
      }

      return toTime(a.eta) - toTime(b.eta)
    })
  } catch (error) {
    console.error('Inbound/QA queue build error:', error)
    return []
  }
}

export async function getOutboundFloorData(): Promise<OutboundFloorData> {
  const [tasks, stations, inventory, inboundQaQueue] = await Promise.all([
    getPickTasks(),
    getPickPackStations(),
    getInventoryView(),
    getInboundQaQueue(),
  ])

  return {
    tasks,
    stations,
    inventory,
    inboundQaQueue,
  }
}
