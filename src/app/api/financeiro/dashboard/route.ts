import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)

  const hoje = new Date()
  const ano = parseInt(searchParams.get('ano') || String(hoje.getFullYear()))
  const mes = parseInt(searchParams.get('mes') || String(hoje.getMonth() + 1))

  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
  const fim = new Date(ano, mes, 0).toISOString().split('T')[0]

  // Lançamentos do mês
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('tipo, valor, categoria, data, evento:eventos(valor_total, valor_decoracao, valor_brinquedos, valor_frete)')
    .is('deleted_at', null)
    .gte('data', inicio)
    .lte('data', fim)

  let receita_decoracao = 0
  let receita_brinquedos = 0
  let receita_frete = 0
  let receita_outros = 0

  const receita = lancamentos?.filter(l => l.tipo === 'entrada').reduce((s, l) => {
    const val = Number(l.valor)
    const ev = l.evento as any // Tipagem flexível para a resposta do join
    if (ev && ev.valor_total > 0) {
      const pDec = (ev.valor_decoracao || 0) / ev.valor_total
      const pBri = (ev.valor_brinquedos || 0) / ev.valor_total
      const pFre = (ev.valor_frete || 0) / ev.valor_total
      receita_decoracao += val * pDec
      receita_brinquedos += val * pBri
      receita_frete += val * pFre
    } else {
      receita_outros += val
    }
    return s + val
  }, 0) ?? 0

  const custos  = lancamentos?.filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0) ?? 0

  // A receber total (não apenas do mês)
  const { data: aReceber } = await supabase
    .from('eventos')
    .select('valor_total, valor_sinal, sinal_recebido, pagamento_final')
    .eq('pagamento_final', false)
    .neq('status', 'cancelado')

  const totalAReceber = aReceber?.reduce((s, e) => {
    const saldo = e.sinal_recebido ? e.valor_total - e.valor_sinal : e.valor_total
    return s + saldo
  }, 0) ?? 0

  // Eventos do mês
  const { data: eventosMes } = await supabase
    .from('eventos')
    .select('id, valor_total')
    .gte('data_evento', inicio)
    .lte('data_evento', fim)
    .neq('status', 'cancelado')

  const qtdEventos = eventosMes?.length ?? 0
  const ticketMedio = qtdEventos > 0 ? (eventosMes?.reduce((s, e) => s + e.valor_total, 0) ?? 0) / qtdEventos : 0

  // Histórico últimos 6 meses
  const historico = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1)
    const mInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const mFim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const { data: l } = await supabase
      .from('lancamentos')
      .select('tipo, valor')
      .is('deleted_at', null)
      .gte('data', mInicio)
      .lte('data', mFim)

    historico.push({
      mes: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      receita: l?.filter(x => x.tipo === 'entrada').reduce((s, x) => s + Number(x.valor), 0) ?? 0,
      custos:  l?.filter(x => x.tipo === 'saida').reduce((s, x) => s + Number(x.valor), 0) ?? 0,
    })
  }

  return NextResponse.json({
    receita,
    custos,
    lucro: receita - custos,
    a_receber: totalAReceber,
    eventos_mes: qtdEventos,
    ticket_medio: ticketMedio,
    receita_breakdown: {
      decoracao: receita_decoracao,
      brinquedos: receita_brinquedos,
      frete: receita_frete,
      outros: receita_outros
    },
    historico,
    periodo: { inicio, fim },
  })
}
