import { getExecutiveKpiSnapshot } from '@/lib/queries/executive'

export async function GET() {
  const snapshot = await getExecutiveKpiSnapshot()

  if (!snapshot) {
    return Response.json(
      {
        error: 'not_found',
        message: 'No executive KPI snapshot was found.',
      },
      { status: 404 }
    )
  }

  return Response.json({
    source_view: 'executive_kpi_snapshot',
    ...snapshot,
  })
}
