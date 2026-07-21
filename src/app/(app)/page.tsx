import { createServerSupabase } from '@/lib/supabase/server'
import { Card, StatCard, Badge } from '@/components/ui'
import { formatarMoeda, formatarData, diasParaEvento, labelData } from '@/lib/utils'
import { STATUS_CORES, STATUS_LABELS, TIPO_EVENTO_LABELS } from '@/types'
import Link from 'next/link'
import { ArrowRight, AlertCircle } from 'lucide-react'
import TarefasPendentes from '@/components/dashboard/TarefasPendentes'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = createServerSupabase()
  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  const em30dias = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  // Eventos próximos (30 dias)
  const { data: eventosProximos } = await supabase
    .from('eventos')
    .select('*, cliente:clientes(nome, telefone)')
    .gte('data_evento', hoje)
    .lte('data_evento', em30dias)
    .neq('status', 'cancelado')
    .order('data_evento')
    .limit(5)

  // Resumo financeiro do mês
  const { data: lancamentos } = await supabase
    .from('lancamentos')
    .select('tipo, valor')
    .gte('data', inicioMes)
    .lte('data', fimMes)

  const receita = lancamentos?.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0) ?? 0
  const custos  = lancamentos?.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0) ?? 0

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

  // Eventos de hoje
  const eventosHoje = eventosProximos?.filter(e => e.data_evento === hoje) ?? []

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

  return (
    <div className="space-y-6 fade-in">
      {/* Saudação */}
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: '#E8E8F0' }}>
          Eae Clara 🎉
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8888AA' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
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

      {/* Stats financeiros */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icone="💰" label="Receita do mês" valor={formatarMoeda(receita)} cor="#4ADE80" />
        <StatCard icone="⏳" label="A receber" valor={formatarMoeda(totalAReceber)} cor="#FFB400" />
        <StatCard icone="📉" label="Custos do mês" valor={formatarMoeda(custos)} cor="#F87171" />
        <StatCard icone="🌟" label="Leads abertos" valor={String(leadsAbertos ?? 0)} cor="#7C3AED"
                  sub="oportunidades" />
      </div>

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
