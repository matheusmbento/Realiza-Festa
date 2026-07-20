import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const body = await req.json()
  const { data, error } = await supabase.from('itens_estoque').update(body).eq('id', params.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const { error } = await supabase.from('itens_estoque').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
