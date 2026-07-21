import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

export async function DELETE(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()

  // 1. Check if category is empty
  const { count, error: countError } = await supabase
    .from('itens_estoque')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_id', params.id)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Não é possível excluir. A categoria possui itens cadastrados.' },
      { status: 400 }
    )
  }

  // 2. Delete if empty
  const { error } = await supabase
    .from('categorias_estoque')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
