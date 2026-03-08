export type FacilityLayout = {
  id: string
  code: string
  name: string
  facility_area: string | null
  width_units: number
  height_units: number
}

export type FacilityLayoutItem = {
  id: string
  layout_id: string
  item_code: string
  item_label: string
  item_type: string
  x: number
  y: number
  w: number
  h: number
  rotation_deg: number | null
  zone: string | null
  shape: string | null
  color: string | null
  sort_order: number
  metadata: Record<string, unknown> | null
}

export type FacilityLayoutData = {
  layout: FacilityLayout | null
  items: FacilityLayoutItem[]
}
