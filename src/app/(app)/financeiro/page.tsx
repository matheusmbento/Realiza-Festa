'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Card, StatCard, Badge, Button, EmptyState, Loading, SectionHeader } from '@/components/ui'
import { formatarMoeda, formatarData } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Lancamento } from '@/types'
import ModalLancamento from '@/components/financeiro/ModalLancamento'

interface Dashboard {
  receita: number; custos: number; lucro: number; a_receber: number
  eventos_mes: number; ticket_medio: number
  receita_breakdown?: { decoracao: number; brinquedos: number; frete: number; outros: number }
  historico: { mes: string; receita: number; custos: number }[]
}

const CAT_LABELS: Record<string, string> = {
  evento_sinal: 'Sinal de evento', evento_final: 'Pagamento final',
  material: 'Material', frete: 'Frete', marketing: 'Marketing',
  manutencao: 'Manutenção', outros: 'Outros',
}

export default function FinanceiroPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [aba, setAba] = useState<'resumo' | 'lancamentos'>('resumo')
  const hoje = new Date()

  const carregar = useCallback(async () => {
    setLoading(true)
    const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    const [dash, lanc] = await Promise.all([
      fetch(`/api/financeiro/dashboard?ano=${hoje.getFullYear()}&mes=${hoje.getMonth() + 1}`).then(r => r.json()),
      fetch(`/api/financeiro?inicio=${inicioMes}&fim=${fimMes}`).then(r => r.json()),
    ])
    setDashboard(dash)
    setLancamentos(lanc)
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (loading) return <Loading />

  return (
    <div className="space-y-5 fade-in">
      <SectionHeader titulo="Financeiro"
        subtitulo={hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        acao={<Button onClick={() => setModal(true)}><Plus size={16} /> Lançamento</Button>}
      />

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#1A1A24' }}>
        {(['resumo', 'lancamentos'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={aba === a ? { background: '#FF6B9D', color: '#0F0F14' } : { color: '#8888AA' }}>
            {a === 'resumo' ? '📊 Resumo' : '📋 Lançamentos'}
          </button>
        ))}
      </div>

      {aba === 'resumo' && dashboard && <>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icone="💚" label="Receita do mês" valor={formatarMoeda(dashboard.receita)} cor="#4ADE80" />
          <StatCard icone="🔴" label="Custos do mês" valor={formatarMoeda(dashboard.custos)} cor="#F87171" />
          <StatCard icone="💰" label="Lucro líquido" valor={formatarMoeda(dashboard.lucro)}
            cor={dashboard.lucro >= 0 ? '#4ADE80' : '#F87171'} />
          <StatCard icone="⏳" label="A receber" valor={formatarMoeda(dashboard.a_receber)} cor="#FFB400" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icone="🎉" label="Eventos no mês" valor={String(dashboard.eventos_mes)} cor="#7C3AED" />
          <StatCard icone="🎫" label="Ticket médio" valor={formatarMoeda(dashboard.ticket_medio)} cor="#FF6B9D" />
        </div>

        {/* Receitas por Categoria */}
        {dashboard.receita_breakdown && dashboard.receita > 0 && (
          <Card>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#E8E8F0' }}>Origem da Receita</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: '#8888AA' }}>🎈 Decoração</span>
                  <span className="font-medium" style={{ color: '#E8E8F0' }}>{formatarMoeda(dashboard.receita_breakdown.decoracao)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2A2A38' }}>
                  <div className="h-full rounded-full" style={{ width: `${(dashboard.receita_breakdown.decoracao / dashboard.receita) * 100}%`, background: '#FF6B9D' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: '#8888AA' }}>🏰 Brinquedos</span>
                  <span className="font-medium" style={{ color: '#E8E8F0' }}>{formatarMoeda(dashboard.receita_breakdown.brinquedos)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2A2A38' }}>
                  <div className="h-full rounded-full" style={{ width: `${(dashboard.receita_breakdown.brinquedos / dashboard.receita) * 100}%`, background: '#7C3AED' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: '#8888AA' }}>🚚 Frete e Outros</span>
                  <span className="font-medium" style={{ color: '#E8E8F0' }}>{formatarMoeda(dashboard.receita_breakdown.frete + dashboard.receita_breakdown.outros)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2A2A38' }}>
                  <div className="h-full rounded-full" style={{ width: `${((dashboard.receita_breakdown.frete + dashboard.receita_breakdown.outros) / dashboard.receita) * 100}%`, background: '#8888AA' }} />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Gráfico 6 meses */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#E8E8F0' }}>Últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dashboard.historico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: '#8888AA', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8888AA', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1A1A24', border: '1px solid #2A2A38', borderRadius: 12 }}
                labelStyle={{ color: '#E8E8F0' }}
                formatter={(v: number) => formatarMoeda(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8888AA' }} />
              <Bar dataKey="receita" name="Receita" fill="#4ADE80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custos" name="Custos" fill="#F87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </>}

      {aba === 'lancamentos' && (
        <div className="space-y-2">
          {lancamentos.length === 0 ? (
            <EmptyState icone="📋" titulo="Sem lançamentos este mês"
              descricao="Os pagamentos de eventos são registrados automaticamente"
              acao={<Button onClick={() => setModal(true)}><Plus size={14} /> Novo lançamento</Button>} />
          ) : lancamentos.map(lanc => (
            <Card key={lanc.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lanc.tipo === 'entrada' ? '💚' : '🔴'}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E8E8F0' }}>{lanc.descricao}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color="#8888AA">{CAT_LABELS[lanc.categoria] || lanc.categoria}</Badge>
                      <span className="text-xs" style={{ color: '#8888AA' }}>{formatarData(lanc.data)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-base font-bold flex-shrink-0"
                   style={{ color: lanc.tipo === 'entrada' ? '#4ADE80' : '#F87171' }}>
                  {lanc.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(lanc.valor)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && <ModalLancamento onClose={() => setModal(false)} onSuccess={() => { setModal(false); carregar() }} />}
    </div>
  )
}
