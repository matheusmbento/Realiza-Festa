import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const busca  = searchParams.get('busca')
  const inicio = searchParams.get('inicio')
  const fim    = searchParams.get('fim')

  let query = supabase
    .from('eventos')
    .select(`
      *,
      cliente:clientes(id, nome, telefone),
      alocacoes:alocacoes_evento(
        id, quantidade, confirmado,
        item:itens_estoque(id, nome, categoria_id,
          categoria:categorias_estoque(nome, cor))
      ),
      checklist:checklist_evento(id, descricao, concluido, prazo)
    `)
    .order('data_evento', { ascending: true })

  if (status) query = query.eq('status', status)
  if (busca)  query = query.ilike('nome', `%${busca}%`)
  if (inicio) query = query.gte('data_evento', inicio)
  if (fim)    query = query.lte('data_evento', fim)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('eventos')
    .insert(body)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
