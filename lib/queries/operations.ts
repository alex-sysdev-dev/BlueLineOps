import { supabase } from '@/lib/supabase'
import { getInboundItems } from '@/lib/queries/inbound'
import { getInboundQaQueue, getInventoryView } from '@/lib/queries/outbound'
import { getYmsDashboardData } from '@/lib/queries/yms'

type TaskStatusRow = {
  status?: string | null
}

function isOpenTaskStatus(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return !(
    normalized.includes('complete') ||
    normalized.includes('closed') ||
    normalized.includes('done') ||
    normalized.includes('cancel')
  )
}

function normalizeDockType(value: string | null | undefined): 'outbound' | 'inbound' | 'other' {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return 'other'
  }

  if (normalized.includes('outbound') || normalized.includes('ship')) {
    return 'outbound'
  }

  if (normalized.includes('inbound') || normalized.includes('receiv') || normalized.includes('unload')) {
    return 'inbound'
  }

  return 'other'
}

async function getFirstOpenTaskCount(tableNames: string[]): Promise<number | null> {
  for (const tableName of tableNames) {
    const result = await supabase.from(tableName).select('status')
    if (result.error) {
      continue
    }

    const rows = (result.data as TaskStatusRow[] | null) ?? []
    return rows.filter((row) => isOpenTaskStatus(row.status)).length
  }

  return null
}

export async function getCrossFunctionalKpis(): Promise<{
  inventoryRiskSkus: number
  inboundQaPending: number
  inboundQaBlocked: number
}> {
  const [inventory, inboundQaQueue] = await Promise.all([getInventoryView(), getInboundQaQueue()])

  return {
    inventoryRiskSkus: inventory.filter((item) => item.risk !== 'healthy').length,
    inboundQaPending: inboundQaQueue.filter((entry) => entry.queueState === 'qa_pending').length,
    inboundQaBlocked: inboundQaQueue.filter((entry) => entry.queueState === 'blocked').length,
  }
}

export async function getDockDoorCounts(): Promise<{ outboundDockDoors: number; inboundDockDoors: number }> {
  const { yardSpots } = await getYmsDashboardData()
  let outboundDockDoors = 0
  let inboundDockDoors = 0

  for (const spot of yardSpots) {
    const dockType = normalizeDockType(spot.type ?? spot.yard_section)
    if (dockType === 'outbound') {
      outboundDockDoors += 1
    } else if (dockType === 'inbound') {
      inboundDockDoors += 1
    }
  }

  return { outboundDockDoors, inboundDockDoors }
}

export async function getPutawayTasksCount(): Promise<number> {
  const countFromTables = await getFirstOpenTaskCount(['putaway_tasks', 'putaway_task'])
  if (countFromTables !== null) {
    return countFromTables
  }

  const items = await getInboundItems()
  return items.filter((item) => item.received_qty > 0).length
}

export async function getCycleCountTasksCount(): Promise<number> {
  const countFromTables = await getFirstOpenTaskCount(['cycle_counts', 'cycle_count_tasks', 'cyclecount_tasks'])
  if (countFromTables !== null) {
    return countFromTables
  }

  const inventory = await getInventoryView()
  return inventory.filter((item) => item.risk !== 'healthy').length
}
