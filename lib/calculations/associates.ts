import type { AssociateDirectoryRow } from '@/components/associates/AssociatesTable'
import type { AssociatePerformanceRow, AssociateSkillEntry, AssociateSkillMatrixRow } from '@/types/associates'

const MANAGERS = ['M. Carter', 'R. Nguyen', 'D. Brooks', 'S. Patel']
const DEPARTMENTS = ['Outbound', 'Inbound', 'Quality', 'Yard']
const ZONES = ['Pick North', 'Pack South', 'Dock East', 'Yard West']
const SHIFTS = ['A Shift', 'B Shift', 'Weekend']
const ASSOCIATE_PHOTO_COUNT = 140

const FIRST_NAMES = [
  'Marcus', 'Darius', 'Keisha', 'Tamara', 'Carlos', 'Rosa', 'Miguel', 'Vanessa',
  'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
  'David', 'Susan', 'Richard', 'Dorothy', 'Joseph', 'Lisa', 'Thomas', 'Nancy',
  'Charles', 'Karen', 'Christopher', 'Betty', 'Daniel', 'Helen', 'Matthew', 'Sandra',
  'Anthony', 'Donna', 'Mark', 'Carol', 'Donald', 'Ruth', 'Steven', 'Sharon',
  'Paul', 'Michelle', 'Andrew', 'Laura', 'Joshua', 'Sarah', 'Kenneth', 'Kimberly',
  'Kevin', 'Deborah', 'Brian', 'Jessica', 'George', 'Stephanie', 'Timothy', 'Rebecca',
  'Ronald', 'Angela', 'Edward', 'Kelly', 'Jason', 'Teresa', 'Jeffrey', 'Christine',
  'Ryan', 'Catherine', 'Gary', 'Brenda', 'Nicholas', 'Amy', 'Eric', 'Anna',
  'Jonathan', 'Virginia', 'Larry', 'Cynthia', 'Justin', 'Heather', 'Terry', 'Diane',
]

const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Roberts', 'Phillips', 'Evans', 'Turner', 'Parker', 'Collins', 'Edwards', 'Stewart',
  'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed',
  'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard', 'Ward', 'Cox', 'Diaz',
  'Richardson', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James', 'Reyes',
]

const MOCK_ROLE_SKILLS: AssociateSkillEntry[][] = [
  [{ code: 'pick_general', label: 'General Picking', status: 'active', trained_at: '2024-01-15', certified_at: '2024-02-01', expires_at: null }],
  [{ code: 'pack_standard', label: 'Pack Standard', status: 'active', trained_at: '2024-03-10', certified_at: '2024-03-20', expires_at: null }],
  [{ code: 'receive_inbound', label: 'Inbound Receiving', status: 'active', trained_at: '2024-02-05', certified_at: '2024-02-18', expires_at: null }],
  [{ code: 'quality_check', label: 'Quality Check', status: 'active', trained_at: '2024-04-01', certified_at: '2024-04-14', expires_at: null }],
  [{ code: 'stow_bulk', label: 'Bulk Stow', status: 'active', trained_at: '2024-01-20', certified_at: '2024-02-05', expires_at: null }],
  [{ code: 'sort_outbound', label: 'Outbound Sort', status: 'active', trained_at: '2024-03-25', certified_at: '2024-04-05', expires_at: null }],
  [
    { code: 'pick_general', label: 'General Picking', status: 'active', trained_at: '2024-01-10', certified_at: '2024-01-24', expires_at: null },
    { code: 'pack_standard', label: 'Pack Standard', status: 'active', trained_at: '2024-02-12', certified_at: '2024-02-25', expires_at: null },
  ],
]

const MOCK_EQUIPMENT_SKILLS: AssociateSkillEntry[][] = [
  [],
  [],
  [],
  [{ code: 'forklift_standard', label: 'Forklift Standard', status: 'certified', trained_at: '2023-06-10', certified_at: '2023-07-01', expires_at: '2025-07-01' }],
  [{ code: 'reach_truck', label: 'Reach Truck', status: 'certified', trained_at: '2023-08-15', certified_at: '2023-09-01', expires_at: '2025-09-01' }],
  [{ code: 'forklift_standard', label: 'Forklift Standard', status: 'certified', trained_at: '2023-05-20', certified_at: '2023-06-10', expires_at: '2025-06-10' }, { code: 'reach_truck', label: 'Reach Truck', status: 'certified', trained_at: '2023-07-10', certified_at: '2023-08-01', expires_at: '2025-08-01' }],
  [{ code: 'pallet_jack', label: 'Pallet Jack', status: 'active', trained_at: '2024-01-05', certified_at: '2024-01-15', expires_at: null }],
]

const MOCK_ATTACHMENT_SKILLS: AssociateSkillEntry[][] = [
  [],
  [],
  [],
  [],
  [{ code: 'clamp_attachment', label: 'Clamp Attachment', status: 'certified', trained_at: '2023-09-10', certified_at: '2023-10-01', expires_at: '2025-10-01' }],
  [{ code: 'push_pull', label: 'Push/Pull', status: 'active', trained_at: '2024-02-20', certified_at: '2024-03-05', expires_at: null }],
]

function hash(value: string): number {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function fallbackFrom<T>(values: T[], seed: string): T {
  return values[hash(seed) % values.length]
}

function generateName(seed: string): string {
  const first = FIRST_NAMES[hash(seed) % FIRST_NAMES.length]
  const last = LAST_NAMES[hash(`${seed}-last`) % LAST_NAMES.length]
  return `${first} ${last}`
}

function isPlaceholderName(name: string): boolean {
  if (!name || name === 'Unknown Associate') return true
  if (/^(employee|associate)\s+\d+$/i.test(name.trim())) return true
  return false
}

function resolveName(rawName: string, seed: string): string {
  return isPlaceholderName(rawName) ? generateName(seed) : rawName
}

function firstRole(row: AssociateSkillMatrixRow): string {
  return row.role_skills[0]?.label ?? row.equipment_skills[0]?.label ?? row.attachment_skills[0]?.label ?? 'General Warehouse'
}

function photoPath(index: number): string {
  const fileNumber = (index % ASSOCIATE_PHOTO_COUNT) + 1
  return `/associates/${encodeURIComponent(`Employee ${fileNumber}.png`)}`
}

export function buildAssociateDirectoryRows(
  matrixRows: AssociateSkillMatrixRow[],
  performanceRows: AssociatePerformanceRow[]
): AssociateDirectoryRow[] {
  const performanceByAssociate = new Map<string, AssociatePerformanceRow>()

  for (const row of performanceRows) {
    const current = performanceByAssociate.get(row.associate_id)
    if (!current || (row.uph ?? 0) > (current.uph ?? 0)) {
      performanceByAssociate.set(row.associate_id, row)
    }
  }

  const matrixDirectory = matrixRows.map((row, index) => {
    const performance = performanceByAssociate.get(row.associate_id)
    const seed = row.associate_id || row.employee_id || row.full_name
    const targetUph = performance?.target_uph ?? 82 + (hash(seed) % 22)
    const uph = performance?.uph ?? targetUph - 4 + (hash(`${seed}-uph`) % 15)
    const resolvedName = resolveName(row.full_name, seed)

    return {
      associateId: row.associate_id,
      employeeId: row.employee_id,
      fullName: resolvedName,
      status: row.status,
      shift: row.shift ?? fallbackFrom(SHIFTS, seed),
      manager: fallbackFrom(MANAGERS, seed),
      department: row.team ?? fallbackFrom(DEPARTMENTS, seed),
      zone: fallbackFrom(ZONES, `${seed}-zone`),
      photoPath: photoPath(index),
      uph,
      targetUph,
      varianceToTarget: Number((uph - targetUph).toFixed(1)),
      performanceBand: performance?.performance_band ?? (uph >= targetUph ? 'on_target' : 'at_risk'),
      roleSummary: firstRole(row),
    } satisfies AssociateDirectoryRow
  })

  const matrixIds = new Set(matrixRows.map((row) => row.associate_id))
  const performanceOnlyRows = performanceRows
    .filter((row) => !matrixIds.has(row.associate_id))
    .map((row, index) => {
      const seed = row.associate_id || row.employee_id || row.full_name
      const targetUph = row.target_uph ?? 88
      const uph = row.uph ?? targetUph
      const resolvedName = resolveName(row.full_name, seed)

      return {
        associateId: row.associate_id,
        employeeId: row.employee_id,
        fullName: resolvedName,
        status: 'active',
        shift: row.shift ?? fallbackFrom(SHIFTS, seed),
        manager: fallbackFrom(MANAGERS, seed),
        department: row.team ?? row.skill_label ?? fallbackFrom(DEPARTMENTS, seed),
        zone: fallbackFrom(ZONES, `${seed}-zone`),
        photoPath: photoPath(matrixDirectory.length + index),
        uph,
        targetUph,
        varianceToTarget: Number((uph - targetUph).toFixed(1)),
        performanceBand: row.performance_band ?? (uph >= targetUph ? 'on_target' : 'at_risk'),
        roleSummary: row.skill_label ?? 'General Warehouse',
      } satisfies AssociateDirectoryRow
    })

  return [...matrixDirectory, ...performanceOnlyRows].sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export function resolveAssociateLinks(matrixRows: AssociateSkillMatrixRow[]): { employeeId: string; fullName: string }[] {
  const source = matrixRows.length > 0 ? matrixRows : generateMockData().matrixRows
  return source
    .map((row) => {
      const seed = row.associate_id || row.employee_id || row.full_name
      return {
        employeeId: row.employee_id,
        fullName: resolveName(row.full_name, seed),
      }
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export function normalizePerformanceNames(rows: AssociatePerformanceRow[]): AssociatePerformanceRow[] {
  return rows.map((row) => {
    const seed = row.associate_id || row.employee_id || row.full_name
    return isPlaceholderName(row.full_name) ? { ...row, full_name: generateName(seed) } : row
  })
}

export function synthesizePerformanceRows(matrixRows: AssociateSkillMatrixRow[]): AssociatePerformanceRow[] {
  const today = new Date().toISOString().split('T')[0]

  return matrixRows.map((row) => {
    const seed = row.associate_id || row.employee_id || row.full_name
    const resolvedName = resolveName(row.full_name, seed)

    const targetUph = 82 + (hash(seed) % 22)
    const uphOffset = (hash(`${seed}-uph`) % 32) - 8
    const uph = Math.max(55, targetUph + uphOffset)
    const variance = Number((uph - targetUph).toFixed(1))

    let performanceBand: string
    if (uph >= targetUph + 6) performanceBand = 'above'
    else if (uph >= targetUph) performanceBand = 'on_target'
    else if (uph >= targetUph - 10) performanceBand = 'at_risk'
    else performanceBand = 'below'

    const hoursWorked = 7 + (hash(`${seed}-hrs`) % 3)
    const unitsCompleted = Math.round(uph * hoursWorked)
    const tasksCompleted = Math.round(unitsCompleted / (3 + (hash(`${seed}-tasks`) % 3)))

    const roleSkill = row.role_skills[0] ?? row.equipment_skills[0] ?? null

    return {
      associate_id: row.associate_id,
      employee_id: row.employee_id,
      full_name: resolvedName,
      shift: row.shift ?? fallbackFrom(SHIFTS, seed),
      team: row.team ?? fallbackFrom(DEPARTMENTS, seed),
      skill_id: roleSkill?.code ?? null,
      skill_code: roleSkill?.code ?? null,
      skill_label: roleSkill?.label ?? 'General Warehouse',
      performance_date: today,
      units_completed: unitsCompleted,
      tasks_completed: tasksCompleted,
      hours_worked: hoursWorked,
      uph,
      target_uph: targetUph,
      variance_to_target: variance,
      performance_band: performanceBand,
    } satisfies AssociatePerformanceRow
  })
}

export function generateMockData(): { matrixRows: AssociateSkillMatrixRow[]; performanceRows: AssociatePerformanceRow[] } {
  const ASSOCIATE_COUNT = 60

  const matrixRows: AssociateSkillMatrixRow[] = Array.from({ length: ASSOCIATE_COUNT }, (_, i) => {
    const index = i + 1
    const seed = `mock-associate-${index}`
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]
    const lastName = LAST_NAMES[(i + 17) % LAST_NAMES.length]
    const fullName = `${firstName} ${lastName}`

    const deptIndex = i % DEPARTMENTS.length
    const shiftIndex = i % SHIFTS.length
    const equipIndex = hash(seed) % MOCK_EQUIPMENT_SKILLS.length
    const attachIndex = hash(`${seed}-attach`) % MOCK_ATTACHMENT_SKILLS.length
    const roleIndex = hash(`${seed}-role`) % MOCK_ROLE_SKILLS.length

    return {
      associate_id: `assoc-${String(index).padStart(3, '0')}`,
      employee_id: `EMP${String(1000 + index)}`,
      full_name: fullName,
      status: i < 54 ? 'active' : 'inactive',
      shift: SHIFTS[shiftIndex],
      team: DEPARTMENTS[deptIndex],
      role_skills: MOCK_ROLE_SKILLS[roleIndex],
      equipment_skills: MOCK_EQUIPMENT_SKILLS[equipIndex],
      attachment_skills: MOCK_ATTACHMENT_SKILLS[attachIndex],
    } satisfies AssociateSkillMatrixRow
  })

  const performanceRows = synthesizePerformanceRows(matrixRows)

  return { matrixRows, performanceRows }
}
