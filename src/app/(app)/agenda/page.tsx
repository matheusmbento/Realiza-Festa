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

  const hjStr = hoje.toISOString().split('T')[0]
  const proximosEventos = [...eventos]
    .filter(e => e.data_evento >= hjStr)
    .sort((a, b) => a.data_evento.localeCompare(b.data_evento))
    .slice(0, 5)

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
          {DIAS_SEMANA.map((d, i) => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: i === 0 || i === 6 ? '#FF6B9D88' : '#8888AA' }}>{d}</div>
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
            const diaSemana = new Date(ds + 'T12:00').getDay()
            const isFimDeSemana = diaSemana === 0 || diaSemana === 6
            return (
              <button key={i} onClick={() => setDiaSelecionado(ds)}
                className="flex flex-col items-center justify-start w-full min-h-[64px] py-1.5 rounded-xl transition-all gap-0.5"
                style={isSelecionado ? { background: '#ffffff05' } : { background: 'transparent' }}>
                
                {/* Número do dia */}
                <span className="text-sm font-medium w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
                  style={isSelecionado
                    ? { background: '#FF6B9D', color: '#0F0F14' }
                    : isHoje
                      ? { color: '#FF6B9D', border: '2px solid #FF6B9D', background: 'transparent' }
                      : { color: evs.length > 0 ? '#E8E8F0' : isFimDeSemana ? '#FF6B9D55' : '#8888AA' }
                  }>
                  {dia}
                </span>

                {/* Chips de evento */}
                {evs.length > 0 && (
                  <div className="flex flex-col w-full px-1 gap-0.5 mt-0.5">
                    {evs.slice(0, 2).map((e, idx) => (
                      <span key={idx}
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full w-full text-center truncate leading-tight"
                            style={{
                              background: STATUS_CORES[e.status as StatusEvento] + '33',
                              color: STATUS_CORES[e.status as StatusEvento],
                            }}>
                        {evs.length > 2 && idx === 1
                          ? `+${evs.length - 1}`
                          : e.nome.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Próximos eventos */}
      {proximosEventos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#8888AA' }}>
            Próximos eventos
          </h2>
          <div className="space-y-2">
            {proximosEventos.map(evento => (
              <Link key={evento.id} href={`/eventos/${evento.id}`}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-2"
                     style={{
                       background: '#1A1A24',
                       border: `1px solid ${STATUS_CORES[evento.status as StatusEvento]}44`,
                       borderLeft: `3px solid ${STATUS_CORES[evento.status as StatusEvento]}`,
                     }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#E8E8F0' }}>
                      {evento.nome}
                    </p>
                    <p className="text-xs" style={{ color: '#8888AA' }}>
                      {new Date(evento.data_evento + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      {evento.hora_montagem ? ` • montagem ${evento.hora_montagem.slice(0,5)}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium flex-shrink-0" style={{ color: STATUS_CORES[evento.status as StatusEvento] }}>
                    {STATUS_LABELS[evento.status as StatusEvento]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Eventos do dia selecionado */}
      {diaSelecionado && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#8888AA' }}>
            {new Date(diaSelecionado + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {loading ? <Loading /> : eventosDiaSelecionado.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: '#1A1A24', border: '1px dashed #2A2A38' }}>
              <p className="text-sm mb-3" style={{ color: '#8888AA' }}>
                Nenhum evento neste dia
              </p>
              <Link
                href={`/eventos/novo?data=${diaSelecionado}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(90deg, #FF6B9D, #FFB400)',
                  color: '#0F0F14',
                }}
              >
                + Criar evento neste dia
              </Link>
            </div>
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
