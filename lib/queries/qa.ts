import { supabase } from '@/lib/supabase'
import type { QaInspection, QaResult } from '@/types/qa'

type RawQaRow = Record<string, unknown>

function pickString(row: RawQaRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function pickNumber(row: RawQaRow, keys: string[]): number | null {
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

function normalizeResult(value: string | null): QaResult {
  const normalized = value?.toLowerCase()
  if (!normalized) {
    return 'unknown'
  }

  if (normalized.includes('pass') || normalized.includes('accept')) {
    return 'pass'
  }

  if (normalized.includes('fail') || normalized.includes('reject') || normalized.includes('damage')) {
    return 'fail'
  }

  if (normalized.includes('pend') || normalized.includes('review') || normalized.includes('open')) {
    return 'pending'
  }

  return 'unknown'
}

function normalizeQaRow(row: RawQaRow): QaInspection {
  const id = pickString(row, ['id']) ?? crypto.randomUUID()
  const inspectedAt = pickString(row, ['inspected_at', 'created_at', 'updated_at']) ?? new Date().toISOString()
  const rawResult = pickString(row, ['result', 'status'])
  const inspectedQty = pickNumber(row, ['inspected_qty', 'quantity', 'received_qty', 'expected_qty']) ?? 1
  const damagedQty = pickNumber(row, ['damaged_qty', 'defect_qty', 'failed_qty']) ?? (normalizeResult(rawResult) === 'fail' ? 1 : 0)

  return {
    id,
    productId: pickString(row, ['product_id']),
    shipmentId: pickString(row, ['shipment_id']),
    inspector: pickString(row, ['inspector_name', 'inspected_by']) ?? 'Unassigned',
    result: normalizeResult(rawResult),
    inspectedQty,
    damagedQty,
    inspectedAt,
  }
}

export async function getQaInspections(): Promise<QaInspection[]> {
  const initial = await supabase.from('qa_inspections').select('*').order('inspected_at', { ascending: true })

  let data = initial.data
  let error = initial.error

  if (error) {
    const fallback = await supabase.from('qa_inspections').select('*').order('created_at', { ascending: true })
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error('QA inspections fetch error:', error)
    throw error
  }

  return ((data as RawQaRow[] | null) ?? []).map(normalizeQaRow)
}
