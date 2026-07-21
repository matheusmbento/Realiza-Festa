import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('contatos_evento')
    .select('*')
    .eq('evento_id', params.id)
    .order('data_prevista', { ascending: true })

  if (error) return NextResponse.json(
    { error: error.message }, { status: 500 }
  )
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const { id, ...body } = await req.json()

  // Se marcando como enviado, registrar timestamp
  if (body.status === 'enviado') {
    body.data_envio = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('contatos_evento')
    .update(body)
    .eq('id', id)
    .eq('evento_id', params.id) // segurança extra
    .select('*')
    .single()

  if (error) return NextResponse.json(
    { error: error.message }, { status: 500 }
  )
  return NextResponse.json(data)
}
