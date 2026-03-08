import { supabase } from '@/lib/supabase'
import type { FacilityLayout, FacilityLayoutData, FacilityLayoutItem } from '@/types/layout'

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeLayout(row: Record<string, unknown> | null): FacilityLayout | null {
  if (!row) {
    return null
  }

  return {
    id: String(row.id ?? ''),
    code: String(row.code ?? ''),
    name: String(row.name ?? 'Unnamed Layout'),
    facility_area: typeof row.facility_area === 'string' ? row.facility_area : null,
    width_units: Math.max(1, toNumber(row.width_units, 100)),
    height_units: Math.max(1, toNumber(row.height_units, 100)),
  }
}

function normalizeLayoutItem(row: Record<string, unknown>): FacilityLayoutItem {
  return {
    id: String(row.id ?? ''),
    layout_id: String(row.layout_id ?? ''),
    item_code: String(row.item_code ?? ''),
    item_label: String(row.item_label ?? 'Layout Item'),
    item_type: String(row.item_type ?? 'zone'),
    x: toNumber(row.x),
    y: toNumber(row.y),
    w: Math.max(1, toNumber(row.w, 1)),
    h: Math.max(1, toNumber(row.h, 1)),
    rotation_deg: row.rotation_deg === null || row.rotation_deg === undefined ? null : toNumber(row.rotation_deg),
    zone: typeof row.zone === 'string' ? row.zone : null,
    shape: typeof row.shape === 'string' ? row.shape : null,
    color: typeof row.color === 'string' ? row.color : null,
    sort_order: toNumber(row.sort_order, 0),
    metadata: row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : null,
  }
}

export async function getFacilityLayoutData(code: string): Promise<FacilityLayoutData> {
  const layoutResult = await supabase
    .from('facility_layouts')
    .select('id, code, name, facility_area, width_units, height_units')
    .eq('code', code)
    .maybeSingle()

  if (layoutResult.error) {
    console.error(`Facility layout fetch error for ${code}:`, layoutResult.error)
    return { layout: null, items: [] }
  }

  const layout = normalizeLayout(layoutResult.data as Record<string, unknown> | null)
  if (!layout) {
    return { layout: null, items: [] }
  }

  const itemsResult = await supabase
    .from('facility_layout_items')
    .select('id, layout_id, item_code, item_label, item_type, x, y, w, h, rotation_deg, zone, shape, color, sort_order, metadata')
    .eq('layout_id', layout.id)
    .order('sort_order', { ascending: true })

  if (itemsResult.error) {
    console.error(`Facility layout items fetch error for ${code}:`, itemsResult.error)
    return { layout, items: [] }
  }

  return {
    layout,
    items: ((itemsResult.data as Record<string, unknown>[] | null) ?? []).map(normalizeLayoutItem),
  }
}
