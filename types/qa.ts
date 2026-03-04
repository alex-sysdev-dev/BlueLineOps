export type QaResult = 'pass' | 'fail' | 'pending' | 'unknown'

export interface QaInspection {
  id: string
  productId: string | null
  shipmentId: string | null
  inspector: string
  result: QaResult
  inspectedQty: number
  damagedQty: number
  inspectedAt: string
}

export interface QaKpi {
  totalInspections: number
  passed: number
  failed: number
  passRate: number
}
