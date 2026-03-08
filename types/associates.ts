export type AssociateSkillEntry = {
  code: string
  label: string
  status: string | null
  trained_at: string | null
  certified_at: string | null
  expires_at: string | null
}

export type AssociateSkillMatrixRow = {
  associate_id: string
  employee_id: string
  full_name: string
  status: string
  shift: string | null
  team: string | null
  role_skills: AssociateSkillEntry[]
  equipment_skills: AssociateSkillEntry[]
  attachment_skills: AssociateSkillEntry[]
}

export type AssociatePerformanceRow = {
  associate_id: string
  employee_id: string
  full_name: string
  shift: string | null
  team: string | null
  skill_id: string | null
  skill_code: string | null
  skill_label: string | null
  performance_date: string
  units_completed: number | null
  tasks_completed: number | null
  hours_worked: number | null
  uph: number | null
  target_uph: number | null
  variance_to_target: number | null
  performance_band: string | null
}
