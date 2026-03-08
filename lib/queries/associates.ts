import { supabase } from '@/lib/supabase'
import type { AssociatePerformanceRow, AssociateSkillMatrixRow } from '@/types/associates'

function normalizeSkillArray(value: unknown): AssociateSkillMatrixRow['role_skills'] {
  return Array.isArray(value) ? (value as AssociateSkillMatrixRow['role_skills']) : []
}

export async function getAssociateSkillMatrix(): Promise<AssociateSkillMatrixRow[]> {
  const { data, error } = await supabase
    .from('associate_skill_matrix')
    .select('associate_id, employee_id, full_name, status, shift, team, role_skills, equipment_skills, attachment_skills')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Associate skill matrix fetch error:', error)
    return []
  }

  return ((data as Record<string, unknown>[] | null) ?? []).map((row) => ({
    associate_id: String(row.associate_id ?? ''),
    employee_id: String(row.employee_id ?? ''),
    full_name: String(row.full_name ?? 'Unknown Associate'),
    status: String(row.status ?? 'unknown'),
    shift: typeof row.shift === 'string' ? row.shift : null,
    team: typeof row.team === 'string' ? row.team : null,
    role_skills: normalizeSkillArray(row.role_skills),
    equipment_skills: normalizeSkillArray(row.equipment_skills),
    attachment_skills: normalizeSkillArray(row.attachment_skills),
  }))
}

export async function getAssociateCurrentPerformance(): Promise<AssociatePerformanceRow[]> {
  const { data, error } = await supabase
    .from('associate_current_performance')
    .select(
      'associate_id, employee_id, full_name, shift, team, skill_id, skill_code, skill_label, performance_date, units_completed, tasks_completed, hours_worked, uph, target_uph, variance_to_target, performance_band'
    )
    .order('uph', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Associate current performance fetch error:', error)
    return []
  }

  return (data as AssociatePerformanceRow[] | null) ?? []
}
