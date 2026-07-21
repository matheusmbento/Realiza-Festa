import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('eventos')
    .select(`
      *,
      cliente:clientes(id, nome, telefone, email, endereco),
      alocacoes:alocacoes_evento(
        id, quantidade, confirmado, observacao,
        item:itens_estoque(id, nome, foto_url, quantidade,
          categoria:categorias_estoque(id, nome, cor, icone))
      ),
      checklist:checklist_evento(id, descricao, concluido, prazo),
      lancamentos:lancamentos(id, tipo, valor, descricao, data, categoria, deleted_at)
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('eventos')
    .update(body)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()

  // Deletar dependências primeiro para evitar erro de Foreign Key
  await supabase.from('alocacoes_evento').delete().eq('evento_id', params.id)
  await supabase.from('checklist_evento').delete().eq('evento_id', params.id)
  await supabase.from('lancamentos').delete().eq('evento_id', params.id)
  await supabase.from('leads').delete().eq('evento_origem_id', params.id)

  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
