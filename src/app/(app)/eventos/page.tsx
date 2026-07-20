'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Loading, SectionHeader } from '@/components/ui'
import { formatarMoeda, labelData, diasParaEvento } from '@/lib/utils'
import { STATUS_CORES, STATUS_LABELS, TIPO_EVENTO_LABELS, type Evento, type StatusEvento } from '@/types'

const FILTROS: { label: string; valor: string }[] = [
  { label: 'Todos',     valor: '' },
  { label: 'Orçamento', valor: 'orcamento' },
  { label: 'Confirmado',valor: 'confirmado' },
  { label: 'Sinal ✓',  valor: 'sinal_recebido' },
  { label: 'Prep.',     valor: 'preparacao' },
  { label: 'Concluído', valor: 'concluido' },
]

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const buscarEventos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (filtroStatus) params.set('status', filtroStatus)

    const res = await fetch(`/api/eventos?${params}`)
    const data = await res.json()
    setEventos(data)
    setLoading(false)
  }, [busca, filtroStatus])

  useEffect(() => {
    const timer = setTimeout(buscarEventos, 300)
    return () => clearTimeout(timer)
  }, [buscarEventos])

  return (
    <div className="space-y-5 fade-in">
      <SectionHeader
        titulo="Eventos"
        subtitulo={`${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`}
        acao={
          <Link href="/eventos/novo">
            <Button>
              <Plus size={16} />
              Novo evento
            </Button>
          </Link>
        }
      />

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: '#8888AA' }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome do evento..."
          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
          style={{ background: '#1A1A24', border: '1px solid #2A2A38', color: '#E8E8F0' }}
          onFocus={e => e.target.style.borderColor = '#FF6B9D'}
          onBlur={e => e.target.style.borderColor = '#2A2A38'}
        />
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTROS.map(f => (
          <button
            key={f.valor}
            onClick={() => setFiltroStatus(f.valor)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={filtroStatus === f.valor
              ? { background: '#FF6B9D', color: '#0F0F14' }
              : { background: '#1A1A24', color: '#8888AA', border: '1px solid #2A2A38' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <Loading />
      ) : eventos.length === 0 ? (
        <EmptyState
          icone="🎉"
          titulo="Nenhum evento encontrado"
          descricao="Crie seu primeiro evento para começar"
          acao={
            <Link href="/eventos/novo">
              <Button><Plus size={14} /> Criar evento</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {eventos.map(evento => {
            const dias = diasParaEvento(evento.data_evento)
            const corStatus = STATUS_CORES[evento.status as StatusEvento]
            return (
              <Link key={evento.id} href={`/eventos/${evento.id}`}>
                <Card className="hover:border-pink-500/20 transition-colors active:scale-[0.99]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: '#E8E8F0' }}>
                        {evento.nome}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                        {TIPO_EVENTO_LABELS[evento.tipo_evento as keyof typeof TIPO_EVENTO_LABELS]} •{' '}
                        {(evento as unknown as { cliente?: { nome: string } }).cliente?.nome}
                      </p>
                    </div>
                    <Badge color={corStatus}>
                      {STATUS_LABELS[evento.status as StatusEvento]}
                    </Badge>
                  </div>

                  {/* Detalhes */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs" style={{ color: '#8888AA' }}>Data</p>
                        <p className="text-sm font-medium" style={{
                          color: dias < 0 ? '#8888AA' : dias === 0 ? '#F87171' : dias <= 3 ? '#FFB400' : '#E8E8F0'
                        }}>
                          {labelData(evento.data_evento)}
                        </p>
                      </div>
                      {evento.hora_montagem && (
                        <div>
                          <p className="text-xs" style={{ color: '#8888AA' }}>Montagem</p>
                          <p className="text-sm font-medium" style={{ color: '#E8E8F0' }}>
                            {evento.hora_montagem.slice(0, 5)}
                          </p>
                        </div>
                      )}
                      {evento.tema && (
                        <div>
                          <p className="text-xs" style={{ color: '#8888AA' }}>Tema</p>
                          <p className="text-sm font-medium truncate max-w-[100px]" style={{ color: '#E8E8F0' }}>
                            {evento.tema}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold" style={{ color: '#4ADE80' }}>
                        {formatarMoeda(evento.valor_total)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                        {evento.pagamento_final ? '✅ Quitado'
                         : evento.sinal_recebido ? `Saldo: ${formatarMoeda(evento.valor_total - evento.valor_sinal)}`
                         : 'Sem pagto'}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
