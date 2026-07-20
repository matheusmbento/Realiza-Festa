import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria')
  const busca = searchParams.get('busca')

  let query = supabase
    .from('itens_estoque')
    .select('*, categoria:categorias_estoque(id, nome, cor, icone)')
    .neq('estado', 'baixado')
    .order('nome')

  if (categoria) query = query.eq('categoria_id', categoria)
  if (busca)     query = query.ilike('nome', `%${busca}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('itens_estoque')
    .insert(body)
    .select('*, categoria:categorias_estoque(id, nome, cor, icone)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
