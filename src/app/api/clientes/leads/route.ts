import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'aberto'

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      cliente:clientes(id, nome, telefone),
      evento_origem:eventos(id, nome, tipo_evento, data_evento)
    `)
    .eq('status', status)
    .order('data_estimada', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id, ...body } = await req.json()

  const { data, error } = await supabase
    .from('leads')
    .update(body)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
