import { getExecutiveKpiMaxLines } from '@/lib/queries/executive'

export async function GET() {
  const data = await getExecutiveKpiMaxLines(48)

  return Response.json({
    source_view: 'executive_kpi_max_lines',
    grain: 'hourly',
    data,
  })
}