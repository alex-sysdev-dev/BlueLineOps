import type { QaInspection } from '@/types/qa'

function toDayKey(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function toDayLabel(key: string): string {
  const date = new Date(`${key}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildDayWindow(days: number, latestKey: string | null): string[] {
  const todayKey = new Date().toISOString().slice(0, 10)
  const anchorKey = latestKey && latestKey > todayKey ? latestKey : latestKey ?? todayKey
  const anchorDate = new Date(`${anchorKey}T00:00:00`)

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(anchorDate)
    date.setDate(anchorDate.getDate() - (days - 1 - index))
    return date.toISOString().slice(0, 10)
  })
}

export function buildQaTrend(inspections: QaInspection[], days = 10): {
  labels: string[]
  passed: number[]
  failed: number[]
} {
  const byDay = new Map<string, { passed: number; failed: number }>()

  for (const inspection of inspections) {
    const dayKey = toDayKey(inspection.inspectedAt)
    if (!dayKey) {
      continue
    }

    const bucket = byDay.get(dayKey) ?? { passed: 0, failed: 0 }
    if (inspection.result === 'pass') {
      bucket.passed += 1
    }
    if (inspection.result === 'fail') {
      bucket.failed += 1
    }
    byDay.set(dayKey, bucket)
  }

  const latestKey = Array.from(byDay.keys()).sort((a, b) => a.localeCompare(b)).slice(-1)[0] ?? null
  const keys = buildDayWindow(days, latestKey)

  return {
    labels: keys.map(toDayLabel),
    passed: keys.map((key) => byDay.get(key)?.passed ?? 0),
    failed: keys.map((key) => byDay.get(key)?.failed ?? 0),
  }
}

export function buildInspectorBreakdown(inspections: QaInspection[], limit = 6): {
  labels: string[]
  inspected: number[]
  damaged: number[]
} {
  const byInspector = new Map<string, { inspected: number; damaged: number }>()

  for (const inspection of inspections) {
    const key = inspection.inspector || 'Unassigned'
    const bucket = byInspector.get(key) ?? { inspected: 0, damaged: 0 }
    bucket.inspected += inspection.inspectedQty
    bucket.damaged += inspection.damagedQty
    byInspector.set(key, bucket)
  }

  const top = Array.from(byInspector.entries())
    .sort((a, b) => b[1].inspected - a[1].inspected)
    .slice(0, limit)

  return {
    labels: top.map(([name]) => name),
    inspected: top.map(([, values]) => values.inspected),
    damaged: top.map(([, values]) => values.damaged),
  }
}

export function calculateQaKpis(inspections: QaInspection[]): {
  totalInspections: number
  passed: number
  failed: number
  passRate: number
} {
  const totalInspections = inspections.length
  const passed = inspections.filter((entry) => entry.result === 'pass').length
  const failed = inspections.filter((entry) => entry.result === 'fail').length
  const passRate = totalInspections > 0 ? Number(((passed / totalInspections) * 100).toFixed(1)) : 0

  return {
    totalInspections,
    passed,
    failed,
    passRate,
  }
}
