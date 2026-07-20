import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

/**
 * POST /api/eventos/:id/pagamento
 * Body: { tipo: 'sinal' | 'final', data?: string, forma?: string }
 * 
 * Atualiza o status do evento E cria o lançamento financeiro num único fluxo.
 * O trigger do banco também lança automaticamente — esta rota é o ponto de controle
 * para validações extras antes de chamar o trigger.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createServerSupabase()
  const body = await req.json()
  const { tipo, data, forma } = body as {
    tipo: 'sinal' | 'final'
    data?: string
    forma?: string
  }

  // Buscar evento atual
  const { data: evento, error: erroBusca } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (erroBusca || !evento) {
    return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  }

  // Validações
  if (tipo === 'sinal' && evento.sinal_recebido) {
    return NextResponse.json({ error: 'Sinal já foi registrado' }, { status: 400 })
  }
  if (tipo === 'final' && evento.pagamento_final) {
    return NextResponse.json({ error: 'Pagamento final já foi registrado' }, { status: 400 })
  }
  if (tipo === 'final' && !evento.sinal_recebido && evento.valor_sinal > 0) {
    return NextResponse.json({ error: 'Registre o sinal primeiro' }, { status: 400 })
  }

  const dataHoje = new Date().toISOString().split('T')[0]

  if (tipo === 'sinal') {
    const { data: atualizado, error } = await supabase
      .from('eventos')
      .update({
        sinal_recebido: true,
        data_sinal: data || dataHoje,
        forma_pagamento: forma || evento.forma_pagamento,
        status: 'sinal_recebido',
      })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      evento: atualizado,
      mensagem: `Sinal de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(evento.valor_sinal)} registrado com sucesso!`,
    })
  }

  if (tipo === 'final') {
    const { data: atualizado, error } = await supabase
      .from('eventos')
      .update({
        pagamento_final: true,
        data_pagamento_final: data || dataHoje,
        forma_pagamento: forma || evento.forma_pagamento,
        status: 'concluido',
      })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    const saldo = evento.valor_total - evento.valor_sinal
    return NextResponse.json({
      ok: true,
      evento: atualizado,
      mensagem: `Pagamento final de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)} registrado! Evento concluído. 🎉`,
    })
  }

  return NextResponse.json({ error: 'Tipo inválido. Use "sinal" ou "final".' }, { status: 400 })
}
