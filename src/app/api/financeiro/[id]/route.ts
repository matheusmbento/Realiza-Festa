import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === 'true'

  // Buscar lançamento para checar se pertence a evento
  const { data: lanc } = await supabase
    .from('lancamentos')
    .select('evento_id')
    .eq('id', params.id)
    .single()

  if (lanc?.evento_id && !force) {
    return NextResponse.json({ error: 'Este lançamento pertence a um evento e não pode ser apagado por aqui.' }, { status: 403 })
  }

  // Soft Delete
  const { error } = await supabase
    .from('lancamentos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
