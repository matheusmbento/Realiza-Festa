'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, Badge, Loading } from '@/components/ui'
import { formatarHora, diasParaEvento } from '@/lib/utils'
import { STATUS_CORES, STATUS_LABELS, type Evento, type StatusEvento } from '@/types'
import Link from 'next/link'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function AgendaPage() {
  const hoje = new Date()
  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(hoje.toISOString().split('T')[0])

  useEffect(() => {
    const inicio = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-01`
    const fim = new Date(anoAtual, mesAtual + 1, 0).toISOString().split('T')[0]
    setLoading(true)
    fetch(`/api/eventos?inicio=${inicio}&fim=${fim}`)
      .then(r => r.json()).then(data => { setEventos(data); setLoading(false) })
  }, [mesAtual, anoAtual])

  // Gerar dias do calendário
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay()
  const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate()
  const dias: (number | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: ultimoDia }, (_, i) => i + 1)]

  function dataStr(dia: number) {
    return `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function eventosNoDia(dia: number) {
    return eventos.filter(e => e.data_evento === dataStr(dia))
  }

  const eventosDiaSelecionado = diaSelecionado
    ? eventos.filter(e => e.data_evento === diaSelecionado)
    : []

  function navMes(dir: number) {
    const novoMes = mesAtual + dir
    if (novoMes < 0) { setMesAtual(11); setAnoAtual(a => a - 1) }
    else if (novoMes > 11) { setMesAtual(0); setAnoAtual(a => a + 1) }
    else setMesAtual(novoMes)
  }

  return (
    <div className="space-y-5 fade-in">
      <h1 className="font-display text-xl font-bold" style={{ color: '#E8E8F0' }}>Agenda</h1>

      {/* Navegação do mês */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navMes(-1)} className="p-2 rounded-xl hover:bg-white/10" style={{ color: '#8888AA' }}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>
            {MESES[mesAtual]} {anoAtual}
          </h2>
          <button onClick={() => navMes(1)} className="p-2 rounded-xl hover:bg-white/10" style={{ color: '#8888AA' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: '#8888AA' }}>{d}</div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia, i) => {
            if (!dia) return <div key={i} />
            const ds = dataStr(dia)
            const isHoje = ds === hoje.toISOString().split('T')[0]
            const isSelecionado = ds === diaSelecionado
            const evs = eventosNoDia(dia)
            return (
              <button key={i} onClick={() => setDiaSelecionado(ds)}
                className="aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative"
                style={isSelecionado
                  ? { background: '#FF6B9D', color: '#0F0F14' }
                  : isHoje
                    ? { background: '#FF6B9D22', color: '#FF6B9D', border: '1px solid #FF6B9D44' }
                    : { color: evs.length > 0 ? '#E8E8F0' : '#8888AA' }}>
                {dia}
                {evs.length > 0 && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {evs.slice(0, 3).map((e, j) => (
                      <span key={j} className="w-1 h-1 rounded-full"
                            style={{ background: isSelecionado ? '#0F0F14' : STATUS_CORES[e.status as StatusEvento] }} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Eventos do dia selecionado */}
      {diaSelecionado && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#8888AA' }}>
            {new Date(diaSelecionado + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {loading ? <Loading /> : eventosDiaSelecionado.length === 0 ? (
            <Card>
              <p className="text-center text-sm py-4" style={{ color: '#8888AA' }}>
                Nenhum evento neste dia
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {eventosDiaSelecionado.map(evento => {
                const dias = diasParaEvento(evento.data_evento)
                return (
                  <Link key={evento.id} href={`/eventos/${evento.id}`}>
                    <Card className="hover:border-pink-500/20 transition-colors"
                          style={{ borderLeft: `3px solid ${STATUS_CORES[evento.status as StatusEvento]}` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: '#E8E8F0' }}>{evento.nome}</p>
                          {evento.hora_montagem && (
                            <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                              🔧 Montagem: {formatarHora(evento.hora_montagem)}
                              {evento.hora_inicio ? ` · Evento: ${formatarHora(evento.hora_inicio)}` : ''}
                            </p>
                          )}
                          {evento.local_nome && (
                            <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                              📍 {evento.local_nome}
                            </p>
                          )}
                        </div>
                        <Badge color={STATUS_CORES[evento.status as StatusEvento]}>
                          {STATUS_LABELS[evento.status as StatusEvento]}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
