import { createServerSupabase } from '@/lib/supabase/server'
import { Card, StatCard, Badge } from '@/components/ui'
import { formatarMoeda, formatarData, diasParaEvento, labelData } from '@/lib/utils'
import { STATUS_CORES, STATUS_LABELS, TIPO_EVENTO_LABELS } from '@/types'
import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'
import TarefasPendentes from '@/components/dashboard/TarefasPendentes'
import GraficoMensal from '@/components/dashboard/GraficoMensal'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = createServerSupabase()
  const dataHoje = new Date()
  const hoje = dataHoje.toISOString().split('T')[0]
  const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const inicioMes = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(dataHoje.getFullYear(), dataHoje.getMonth() + 1, 0).toISOString().split('T')[0]
  const em30dias = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const inicioMesPassado = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - 1, 1).toISOString().split('T')[0]
  const fimMesPassado = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), 0).toISOString().split('T')[0]

  // Eventos próximos (30 dias)
  const { data: eventosProximos } = await supabase
    .from('eventos')
    .select('*, cliente:clientes(nome, telefone)')
    .gte('data_evento', hoje)
    .lte('data_evento', em30dias)
    .neq('status', 'concluido')
    .neq('status', 'cancelado')
    .order('data_evento')
    .limit(10)

  // Resumo financeiro do mês
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('tipo, valor')
    .gte('data', inicioMes)
    .lte('data', fimMes)

  const receita = lancamentos?.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0) ?? 0
  const custos  = lancamentos?.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0) ?? 0
  const lucro = receita - custos

  const { data: lancamentosMesPassado } = await supabase
    .from('lancamentos')
    .select('tipo, valor')
    .gte('data', inicioMesPassado)
    .lte('data', fimMesPassado)

  const receitaMesPassado = lancamentosMesPassado?.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0) ?? 0
  const custosMesPassado  = lancamentosMesPassado?.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0) ?? 0
  const lucroMesPassado = receitaMesPassado - custosMesPassado

  // Eventos do mês atual e anterior (contagem)
  const { count: eventosMesAtual } = await supabase
    .from('eventos')
    .select('*', { count: 'exact', head: true })
    .gte('data_evento', inicioMes)
    .lte('data_evento', fimMes)
    .neq('status', 'cancelado')

  const { count: eventosMesPassadoCount } = await supabase
    .from('eventos')
    .select('*', { count: 'exact', head: true })
    .gte('data_evento', inicioMesPassado)
    .lte('data_evento', fimMesPassado)
    .neq('status', 'cancelado')

  const nEventos = eventosMesAtual ?? 0
  const nEventosPassado = eventosMesPassadoCount ?? 0
  const ticketMedio = nEventos > 0 ? receita / nEventos : 0
  const ticketMedioPassado = nEventosPassado > 0 ? receitaMesPassado / nEventosPassado : 0

  function calcDelta(atual: number, anterior: number): { texto: string; positivo: boolean } | null {
    if (anterior === 0 && atual === 0) return null
    if (anterior === 0) return { texto: '\u2191 novo', positivo: true }
    const pct = Math.round(((atual - anterior) / anterior) * 100)
    const positivo = pct >= 0
    return { texto: `${positivo ? '\u2191' : '\u2193'} ${Math.abs(pct)}% vs m\u00EAs ant.`, positivo }
  }

  const deltaReceita = calcDelta(receita, receitaMesPassado)
  const deltaLucro = calcDelta(lucro, lucroMesPassado)
  const deltaTicket = calcDelta(ticketMedio, ticketMedioPassado)
  const deltaEventos = calcDelta(nEventos, nEventosPassado)

  // Dados para gráfico de 6 meses
  const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const dadosGrafico: { label: string; receita: number; custos: number; lucro: number }[] = []

  // Buscar últimos 6 meses de lançamentos de uma vez
  const inicio6m = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - 5, 1).toISOString().split('T')[0]
  const { data: lancamentos6m } = await supabase
    .from('lancamentos')
    .select('tipo, valor, data')
    .gte('data', inicio6m)
    .lte('data', fimMes)

  for (let i = 5; i >= 0; i--) {
    const d = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - i, 1)
    const mIni = d.toISOString().split('T')[0]
    const mFim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
    const doMes = lancamentos6m?.filter(l => l.data >= mIni && l.data <= mFim) ?? []
    const r = doMes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
    const c = doMes.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
    dadosGrafico.push({ label: MESES_LABEL[d.getMonth()], receita: r, custos: c, lucro: r - c })
  }

  // A receber (eventos com saldo)
  const { data: aReceber } = await supabase
    .from('eventos')
    .select('valor_total, valor_sinal, sinal_recebido, pagamento_final')
    .eq('pagamento_final', false)
    .neq('status', 'cancelado')

  const totalAReceber = aReceber?.reduce((s, e) => {
    const saldo = e.sinal_recebido ? e.valor_total - e.valor_sinal : e.valor_total
    return s + saldo
  }, 0) ?? 0

  // Leads abertos
  const { count: leadsAbertos } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'aberto')

  // Eventos de hoje e amanhã
  const eventosHoje = eventosProximos?.filter(e => e.data_evento === hoje) ?? []
  const eventosAmanha = eventosProximos?.filter(e => e.data_evento === amanha) ?? []

  // Avisos pendentes (Checklist com prazos próximos, até 7 dias)
  const seteDiasFrente = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const { data: avisos } = await supabase
    .from('checklist_evento')
    .select('*, evento:eventos(id, nome)')
    .eq('concluido', false)
    .not('prazo', 'is', null)
    .lte('prazo', seteDiasFrente)
    .order('prazo')
    .limit(5)

  function gerarSaudacao(): { titulo: string; subtitulo: string } {
    if (eventosHoje.length === 1) {
      return {
        titulo: `Dia de festa! 🎪`,
        subtitulo: `${eventosHoje[0].nome} está na agenda de hoje`,
      }
    }
    if (eventosHoje.length > 1) {
      return {
        titulo: `Dia cheio! 🎪`,
        subtitulo: `${eventosHoje.length} eventos hoje — bora lá`,
      }
    }
    if (eventosAmanha.length === 1) {
      return {
        titulo: `Bom dia! 👋`,
        subtitulo: `Amanhã tem ${eventosAmanha[0].nome} — prepare a carga`,
      }
    }
    if (eventosAmanha.length > 1) {
      return {
        titulo: `Bom dia! 👋`,
        subtitulo: `${eventosAmanha.length} eventos amanhã — hora de preparar`,
      }
    }
    return {
      titulo: `Bom dia! ✨`,
      subtitulo: new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
      }),
    }
  }

  const saudacao = gerarSaudacao()

  return (
    <div className="space-y-6 fade-in">
      {/* Saudação */}
      <div>
        <h1 className="font-display text-2xl font-bold" style={{ color: '#E8E8F0' }}>
          {saudacao.titulo}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8888AA' }}>
          {saudacao.subtitulo}
        </p>
      </div>

      {/* Alertas do dia */}
      {eventosHoje.length > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
             style={{ background: '#FF6B9D18', border: '1px solid #FF6B9D44' }}>
          <AlertCircle size={20} style={{ color: '#FF6B9D', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#FF6B9D' }}>
              {eventosHoje.length === 1 ? '1 evento hoje!' : `${eventosHoje.length} eventos hoje!`}
            </p>
            {eventosHoje.map(e => (
              <p key={e.id} className="text-xs mt-0.5" style={{ color: '#E8E8F0' }}>
                📍 {e.nome} — {e.hora_montagem ? `Montagem ${e.hora_montagem.slice(0,5)}` : e.hora_inicio?.slice(0,5)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Avisos Importantes (Tarefas Pendentes) */}
      <TarefasPendentes avisosIniciais={avisos || []} />

      {/* Stats financeiros — Linha 1: com comparação */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icone="💰" 
          label="Receita do mês" 
          valor={formatarMoeda(receita)} 
          cor="#4ADE80" 
          sub={deltaReceita?.texto}
          subCor={deltaReceita ? (deltaReceita.positivo ? '#4ADE80' : '#F87171') : undefined}
        />
        <StatCard 
          icone="💎" 
          label="Lucro líquido" 
          valor={formatarMoeda(lucro)} 
          cor={lucro >= 0 ? '#4ADE80' : '#F87171'}
          sub={deltaLucro?.texto}
          subCor={deltaLucro ? (deltaLucro.positivo ? '#4ADE80' : '#F87171') : undefined}
        />
        <StatCard 
          icone="🎯" 
          label="Ticket Médio" 
          valor={formatarMoeda(ticketMedio)} 
          cor="#FF6B9D" 
          sub={deltaTicket?.texto}
          subCor={deltaTicket ? (deltaTicket.positivo ? '#4ADE80' : '#F87171') : undefined}
        />
        <StatCard 
          icone="🎉" 
          label="Eventos do mês" 
          valor={String(nEventos)} 
          cor="#7C3AED"
          sub={deltaEventos?.texto}
          subCor={deltaEventos ? (deltaEventos.positivo ? '#4ADE80' : '#F87171') : undefined}
        />
      </div>

      {/* Stats secundários — Linha 2: sem comparação */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icone="⏳" 
          label="A receber" 
          valor={formatarMoeda(totalAReceber)} 
          cor="#FFB400" 
          sub={totalAReceber === 0 ? 'Tudo quitado ✅' : undefined}
          subCor={totalAReceber === 0 ? '#4ADE80' : undefined}
        />
        <StatCard 
          icone="✨" 
          label="Leads abertos" 
          valor={String(leadsAbertos ?? 0)} 
          cor="#7C3AED"
          sub="oportunidades" 
        />
      </div>

      {/* Gráfico de 6 meses */}
      <GraficoMensal dados={dadosGrafico} />

      {/* Próximos eventos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>
            Próximos 30 dias
          </h2>
          <Link href="/eventos" className="flex items-center gap-1 text-xs font-medium"
                style={{ color: '#FF6B9D' }}>
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-2.5">
          {!eventosProximos?.length ? (
            <Card>
              <p className="text-center text-sm py-4" style={{ color: '#8888AA' }}>
                Nenhum evento nos próximos 30 dias
              </p>
            </Card>
          ) : eventosProximos.map(evento => {
            const dias = diasParaEvento(evento.data_evento)
            return (
              <Link key={evento.id} href={`/eventos/${evento.id}`}>
                <Card className="hover:border-pink-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate" style={{ color: '#E8E8F0' }}>
                          {evento.nome}
                        </span>
                        <Badge color={STATUS_CORES[evento.status as keyof typeof STATUS_CORES]}>
                          {STATUS_LABELS[evento.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                        {TIPO_EVENTO_LABELS[evento.tipo_evento as keyof typeof TIPO_EVENTO_LABELS]} •{' '}
                        {evento.cliente?.nome}
                      </p>
                      {evento.local_nome && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#8888AA' }}>
                          📍 {evento.local_nome}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{
                        color: dias === 0 ? '#F87171' : dias <= 3 ? '#FFB400' : '#4ADE80'
                      }}>
                        {labelData(evento.data_evento)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                        {formatarMoeda(evento.valor_total)}
                      </p>
                    </div>
                  </div>

                  {/* Barra de pagamento */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: '#2A2A38' }}>
                      <div className="h-full rounded-full transition-all"
                           style={{
                             width: evento.pagamento_final ? '100%'
                                  : evento.sinal_recebido ? `${(evento.valor_sinal / evento.valor_total) * 100}%`
                                  : '0%',
                             background: evento.pagamento_final ? '#4ADE80' : '#FFB400',
                           }} />
                    </div>
                    <span className="text-xs" style={{ color: '#8888AA' }}>
                      {evento.pagamento_final ? 'Pago' : evento.sinal_recebido ? 'Sinal ok' : 'Sem pagto'}
                    </span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
