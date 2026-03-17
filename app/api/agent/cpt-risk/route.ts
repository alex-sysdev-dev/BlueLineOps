import { getExecutiveCptRiskOrders } from '@/lib/queries/executive'

const ALLOWED_BUCKETS = ['all', 'safe', 'watch', 'risk', 'missed', 'shipped_on_time', 'shipped_late']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bucket = searchParams.get('bucket') ?? 'all'
  const limit = parseInt(searchParams.get('limit') ?? '10', 10)

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return Response.json(
      { error: 'bad_request', message: 'Invalid bucket.', hint: `Allowed: ${ALLOWED_BUCKETS.join(', ')}` },
      { status: 400 }
    )
  }

  const data = await getExecutiveCptRiskOrders(limit)
  const filtered = bucket === 'all' ? data : data.filter((o) => o.risk_bucket === bucket)

  return Response.json({
    source_view: 'order_cpt_risk',
    bucket,
    limit,
    count: filtered.length,
    data: filtered,
  })
}