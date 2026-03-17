import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const order_number = searchParams.get('order_number')

  if (!id && !order_number) {
    return Response.json(
      { error: 'bad_request', message: 'Provide id or order_number.', hint: 'At least one identifier is required.' },
      { status: 400 }
    )
  }

  let query = supabase.from('order_cpt_risk').select('*')
  if (id) query = query.eq('order_id', id)
  else query = query.eq('order_number', order_number!)

  const { data, error } = await query.maybeSingle()

  if (error) {
    return Response.json({ error: 'server_error', message: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({ found: false, data: null }, { status: 404 })
  }

  return Response.json({
    source_view: 'order_cpt_risk',
    found: true,
    data,
  })
}