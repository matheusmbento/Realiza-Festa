import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase.from('clientes').select('*, eventos:eventos(*)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const eventosValidos = data.eventos?.filter((e: any) => e.status !== 'cancelado') || []
  const ltv = eventosValidos.reduce((acc: number, e: any) => acc + (Number(e.valor_total) || 0), 0)
  const ticket_medio = eventosValidos.length > 0 ? ltv / eventosValidos.length : 0

  return NextResponse.json({ ...data, ltv, ticket_medio, total_eventos: eventosValidos.length })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const body = await req.json()
  const { data, error } = await supabase.from('clientes').update(body).eq('id', params.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const { error } = await supabase.from('clientes').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
