import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Status que realmente comprometem o estoque (orçamento e cancelado ignorados)
const STATUS_QUE_BLOQUEIAM = ['confirmado', 'concluido']

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)

  const item_id        = searchParams.get('item_id')
  const data_evento    = searchParams.get('data_evento')
  const hora_montagem  = searchParams.get('hora_montagem') ?? '00:00'
  const hora_inicio    = searchParams.get('hora_inicio') ?? '00:00'
  const evento_id_atual = searchParams.get('evento_id_atual')

  if (!item_id || !data_evento) {
    return NextResponse.json({ error: 'item_id e data_evento são obrigatórios' }, { status: 400 })
  }

  // Janela de ocupação do evento atual
  // Começa na hora de montagem (ou início), termina 36h depois para cobrir a desmontagem
  const horaOcupacao = hora_montagem || hora_inicio || '00:00'
  const windowStart = new Date(`${data_evento}T${horaOcupacao}:00`)
  const windowEnd   = new Date(windowStart.getTime() + 36 * 60 * 60 * 1000) // +36h

  // 1. Buscar estoque total do item
  const { data: itemData } = await supabase
    .from('itens_estoque')
    .select('quantidade')
    .eq('id', item_id)
    .single()

  const totalEstoque = itemData?.quantidade ?? 0

  // 2. Buscar todas as alocações desse item em outros eventos (que bloqueiam estoque)
  let query = supabase
    .from('alocacoes_evento')
    .select('quantidade, evento:eventos(id, data_evento, hora_montagem, hora_inicio, status)')
    .eq('item_id', item_id)

  if (evento_id_atual) {
    query = query.neq('evento_id', evento_id_atual)
  }

  const { data: alocacoes } = await query

  // 3. Filtrar apenas as alocações cujas janelas conflitam com a nossa
  let comprometido = 0
  const conflitos: { nome?: string; data: string; qtd: number }[] = []

  for (const aloc of (alocacoes ?? [])) {
    const ev = aloc.evento as any
    if (!ev || !STATUS_QUE_BLOQUEIAM.includes(ev.status)) continue

    const horaEv    = ev.hora_montagem || ev.hora_inicio || '00:00'
    const evStart   = new Date(`${ev.data_evento}T${horaEv}:00`)
    const evEnd     = new Date(evStart.getTime() + 36 * 60 * 60 * 1000)

    // Sobreposição: os intervalos conflitam se um começa antes do outro terminar
    const conflita = windowStart < evEnd && windowEnd > evStart
    if (conflita) {
      comprometido += Number(aloc.quantidade)
      conflitos.push({ data: ev.data_evento, qtd: aloc.quantidade })
    }
  }

  const disponivel = Math.max(0, totalEstoque - comprometido)

  return NextResponse.json({ total: totalEstoque, comprometido, disponivel, conflitos })
}
