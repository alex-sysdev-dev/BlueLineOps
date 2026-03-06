import type { QaResult } from '@/types/qa'

export type PickTaskStatus = 'queued' | 'picking' | 'packed' | 'blocked' | 'completed' | 'unknown'

export type PackStationStatus = 'active' | 'idle' | 'blocked' | 'offline' | 'maintenance' | 'unknown'

export type InventoryRisk = 'healthy' | 'watch' | 'critical'

export type InboundQueueState =
  | 'scheduled'
  | 'arrived'
  | 'received'
  | 'qa_pending'
  | 'released'
  | 'blocked'
  | 'unknown'

export interface PickTask {
  id: string
  taskNumber: string
  orderNumber: string | null
  sku: string
  zone: string
  status: PickTaskStatus
  priority: number
  quantity: number
  pickedQty: number
  remainingQty: number
  assignedStation: string | null
  dueAt: string | null
  updatedAt: string | null
}

export interface PackStation {
  id: string
  label: string
  status: PackStationStatus
  operator: string | null
  queueDepth: number
  utilization: number
  row: number | null
  column: number | null
  activeTaskNumber: string | null
  updatedAt: string | null
}

export interface InventoryItem {
  id: string
  sku: string
  location: string
  availableQty: number
  reservedQty: number
  netQty: number
  reorderPoint: number
  velocity: string | null
  risk: InventoryRisk
  updatedAt: string | null
}

export interface InboundQaQueueItem {
  id: string
  shipmentId: string
  supplier: string
  eta: string | null
  productId: string
  expectedQty: number
  receivedQty: number
  varianceQty: number
  shipmentStatus: string
  qaResult: QaResult
  queueState: InboundQueueState
  inspector: string | null
  inspectedAt: string | null
}

export interface StationHeatCell {
  id: string
  label: string
  row: number
  column: number
  status: PackStationStatus
  load: number
  utilization: number
  intensity: number
  assignedTasks: number
}

export interface OutboundFloorData {
  tasks: PickTask[]
  stations: PackStation[]
  inventory: InventoryItem[]
  inboundQaQueue: InboundQaQueueItem[]
}

export interface OutboundFloorKpis {
  openTasks: number
  lateTasks: number
  unitsRemaining: number
  activeStations: number
  avgUtilization: number
  inventoryRisk: number
  qaPending: number
  qaBlocked: number
}
