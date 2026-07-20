import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase.from('clientes').select('*, eventos:eventos(*)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
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
