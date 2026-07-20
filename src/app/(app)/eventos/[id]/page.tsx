'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Phone, CheckCircle2,
  Circle, Plus, Trash2, ExternalLink, Edit2,
} from 'lucide-react'
import { Card, Badge, Button, Loading } from '@/components/ui'
import { formatarMoeda, formatarData, formatarHora, telWhatsapp } from '@/lib/utils'
import {
  STATUS_CORES, STATUS_LABELS, TIPO_EVENTO_LABELS,
  type Evento, type StatusEvento, type ChecklistItem,
} from '@/types'
import { toast } from 'sonner'
import ModalPagamento from '@/components/eventos/ModalPagamento'
import ModalDespesa from '@/components/eventos/ModalDespesa'

export default function DetalheEvento() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalPag, setModalPag] = useState<'sinal' | 'final' | null>(null)
  const [modalDesp, setModalDesp] = useState(false)
  const [novoItem, setNovoItem] = useState('')
  const [adicionandoItem, setAdicionandoItem] = useState(false)

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/eventos/${id}`)
    const data = await res.json()
    setEvento(data)
    setLoading(false)
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function atualizarStatus(status: StatusEvento) {
    const res = await fetch(`/api/eventos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { toast.success('Status atualizado'); carregar() }
  }

  async function toggleAlocacao(aloc: any) {
    await fetch('/api/alocacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: aloc.id, confirmado: !aloc.confirmado }),
    })
    carregar()
  }

  async function toggleChecklist(item: ChecklistItem) {
    await fetch('/api/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, concluido: !item.concluido }),
    })
    carregar()
  }

  async function adicionarChecklist() {
    if (!novoItem.trim()) return
    setAdicionandoItem(true)
    await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento_id: id, descricao: novoItem }),
    })
    setNovoItem('')
    setAdicionandoItem(false)
    carregar()
  }

  async function removerChecklist(itemId: string) {
    await fetch('/api/checklist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId }),
    })
    carregar()
  }

  async function apagarEvento() {
    if (!confirm('Apagar este evento? Essa ação não pode ser desfeita.')) return
    await fetch(`/api/eventos/${id}`, { method: 'DELETE' })
    toast.success('Evento removido')
    router.push('/eventos')
  }

  if (loading) return <Loading />
  if (!evento) return <p style={{ color: '#F87171' }}>Evento não encontrado</p>

  const corStatus = STATUS_CORES[evento.status]
  const checklist = evento.checklist ?? []
  const concluidos = checklist.filter(i => i.concluido).length
  const alocacoes = evento.alocacoes ?? []
  const alocacoesConcluidas = alocacoes.filter((a: any) => a.confirmado).length
  const saldo = evento.valor_total - evento.valor_sinal
  
  // Financeiro
  const despesas = evento.lancamentos?.filter((l: any) => l.tipo === 'saida') || []
  const totalDespesas = despesas.reduce((acc: number, d: any) => acc + Number(d.valor), 0)
  const lucroReal = evento.valor_total - totalDespesas

  return (
    <div className="space-y-4 fade-in pb-10">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/eventos" className="p-2 rounded-xl hover:bg-white/5 mt-0.5"
              style={{ color: '#8888AA' }}>
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold" style={{ color: '#E8E8F0' }}>
            {evento.nome}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge color={corStatus}>{STATUS_LABELS[evento.status]}</Badge>
            <span className="text-xs" style={{ color: '#8888AA' }}>
              {TIPO_EVENTO_LABELS[evento.tipo_evento]}
            </span>
          </div>
        </div>
        <Link href={`/eventos/${id}/editar`} className="p-2 rounded-xl hover:bg-white/5"
              style={{ color: '#8888AA' }}>
          <Edit2 size={18} />
        </Link>
      </div>

      {/* Status + Pagamento — integrados */}
      <Card style={{ border: `1px solid ${corStatus}44` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>Status do evento</h2>
          <select
            value={evento.status}
            onChange={e => atualizarStatus(e.target.value as StatusEvento)}
            className="text-xs rounded-lg px-2 py-1.5 outline-none"
            style={{ background: `${corStatus}22`, color: corStatus, border: `1px solid ${corStatus}44` }}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Barra de progresso financeiro */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 text-xs mb-2">
            <div className="flex items-center justify-between" style={{ color: '#8888AA' }}>
              <span>Total cobrado: {formatarMoeda(evento.valor_total)}</span>
              <span>
                {evento.pagamento_final ? 'Quitado ✅'
                 : evento.sinal_recebido ? `Saldo a receber: ${formatarMoeda(saldo)}`
                 : 'Aguardando pagamento'}
              </span>
            </div>
            
            {/* Lucro Real */}
            <div className="flex items-center justify-between font-medium pt-1 mt-1 border-t" style={{ borderColor: '#2A2A38', color: '#E8E8F0' }}>
              <span>Lucro Líquido: <span style={{ color: '#4ADE80' }}>{formatarMoeda(lucroReal)}</span></span>
              <span>Despesas: <span style={{ color: '#F87171' }}>{formatarMoeda(totalDespesas)}</span></span>
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: '#2A2A38' }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{
                   width: evento.pagamento_final ? '100%'
                        : evento.sinal_recebido ? `${(evento.valor_sinal / evento.valor_total) * 100}%`
                        : '0%',
                   background: evento.pagamento_final
                     ? 'linear-gradient(90deg, #4ADE80, #22c55e)'
                     : 'linear-gradient(90deg, #FFB400, #ff9500)',
                 }} />
          </div>

          {/* Botões de pagamento */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => !evento.sinal_recebido && setModalPag('sinal')}
              disabled={evento.sinal_recebido}
              className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all text-center"
              style={evento.sinal_recebido
                ? { background: '#4ADE8022', border: '1px solid #4ADE8044' }
                : { background: '#FFB40022', border: '1px solid #FFB40044', cursor: 'pointer' }}
            >
              <span className="text-lg">{evento.sinal_recebido ? '✅' : '💳'}</span>
              <span className="text-xs font-semibold" style={{ color: evento.sinal_recebido ? '#4ADE80' : '#FFB400' }}>
                {evento.sinal_recebido ? 'Sinal recebido' : 'Registrar sinal'}
              </span>
              <span className="text-xs" style={{ color: '#8888AA' }}>
                {formatarMoeda(evento.valor_sinal)}
              </span>
              {evento.data_sinal && (
                <span className="text-xs" style={{ color: '#8888AA' }}>
                  {formatarData(evento.data_sinal)}
                </span>
              )}
            </button>

            <button
              onClick={() => !evento.pagamento_final && setModalPag('final')}
              disabled={evento.pagamento_final || !evento.sinal_recebido}
              className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all text-center"
              style={evento.pagamento_final
                ? { background: '#4ADE8022', border: '1px solid #4ADE8044' }
                : evento.sinal_recebido
                  ? { background: '#FF6B9D22', border: '1px solid #FF6B9D44', cursor: 'pointer' }
                  : { background: '#2A2A38', border: '1px solid #3A3A50', opacity: 0.5 }}
            >
              <span className="text-lg">{evento.pagamento_final ? '🎉' : '💰'}</span>
              <span className="text-xs font-semibold"
                    style={{ color: evento.pagamento_final ? '#4ADE80' : '#FF6B9D' }}>
                {evento.pagamento_final ? 'Quitado!' : 'Pagto. final'}
              </span>
              <span className="text-xs" style={{ color: '#8888AA' }}>
                {formatarMoeda(saldo)}
              </span>
              {evento.data_pagamento_final && (
                <span className="text-xs" style={{ color: '#8888AA' }}>
                  {formatarData(evento.data_pagamento_final)}
                </span>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Dados do evento */}
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#8888AA' }}>Detalhes</h2>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📅</span>
            <div>
              <p className="text-sm" style={{ color: '#E8E8F0' }}>
                {formatarData(evento.data_evento, "EEEE, dd 'de' MMMM 'de' yyyy")}
              </p>
              {evento.hora_inicio && (
                <p className="text-xs" style={{ color: '#8888AA' }}>
                  Início: {formatarHora(evento.hora_inicio)}
                  {evento.hora_montagem && ` · Montagem: ${formatarHora(evento.hora_montagem)}`}
                </p>
              )}
            </div>
          </div>

          {(evento.local_nome || evento.local_endereco) && (
            <div className="flex items-center gap-2.5">
              <MapPin size={16} style={{ color: '#8888AA', flexShrink: 0 }} />
              <div>
                {evento.local_nome && (
                  <p className="text-sm" style={{ color: '#E8E8F0' }}>{evento.local_nome}</p>
                )}
                {evento.local_endereco && (
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(evento.local_endereco)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 hover:underline"
                    style={{ color: '#FF6B9D' }}>
                    {evento.local_endereco} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          )}

          {evento.tema && (
            <div className="flex items-center gap-2.5">
              <span className="text-base">🎨</span>
              <p className="text-sm" style={{ color: '#E8E8F0' }}>
                Tema: <strong>{evento.tema}</strong>
                {evento.cores?.length ? ` · ${evento.cores.join(', ')}` : ''}
              </p>
            </div>
          )}

          {(evento as unknown as { cliente?: { nome: string; telefone?: string } }).cliente && (
            <div className="flex items-center gap-2.5">
              <span className="text-base">👤</span>
              <div className="flex items-center gap-2">
                <p className="text-sm" style={{ color: '#E8E8F0' }}>
                  {(evento as unknown as { cliente?: { nome: string } }).cliente?.nome}
                </p>
                {(evento as unknown as { cliente?: { telefone?: string } }).cliente?.telefone && (
                  <a href={telWhatsapp((evento as unknown as { cliente?: { telefone: string } }).cliente!.telefone)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#25D36622', color: '#25D366' }}>
                    <Phone size={10} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {evento.observacoes && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: '#2A2A38' }}>
            <p className="text-xs font-medium mb-1" style={{ color: '#8888AA' }}>Observações</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#E8E8F0' }}>
              {evento.observacoes}
            </p>
          </div>
        )}
      </Card>

      {/* Romaneio de Carga */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
            Romaneio de Carga
            <span className="ml-2 text-xs font-normal" style={{ color: '#8888AA' }}>
              {alocacoesConcluidas}/{alocacoes.length}
            </span>
          </h2>
          <div className="flex items-center gap-3">
            {alocacoes.length > 0 && (
              <div className="w-16 h-1.5 rounded-full hidden sm:block" style={{ background: '#2A2A38' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${(alocacoesConcluidas / alocacoes.length) * 100}%`,
                  background: '#4ADE80',
                }} />
              </div>
            )}
            <Link href={`/eventos/${id}/itens`}>
              <button className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-white/5" style={{ background: '#2A2A38', color: '#E8E8F0' }}>
                <Plus size={12} className="inline mr-1" />
                Adicionar
              </button>
            </Link>
          </div>
        </div>
        {alocacoes.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#8888AA' }}>
            Nenhum item alocado ainda
          </p>
        ) : (
          <div className="space-y-2">
            {alocacoes.map(aloc => {
              const item = (aloc as unknown as { item?: { nome: string; categoria?: { nome: string; cor: string } } }).item
              return (
                <div key={aloc.id} className="flex items-center justify-between py-2 border-b last:border-0"
                     style={{ borderColor: '#2A2A38' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                         style={{ background: `${item?.categoria?.cor || '#FF6B9D'}22` }}>
                      📦
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#E8E8F0' }}>{item?.nome}</p>
                      {item?.categoria && (
                        <Badge color={item.categoria.cor}>{item.categoria.nome}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: '#E8E8F0' }}>
                      × {aloc.quantidade}
                    </span>
                    <button onClick={() => toggleAlocacao(aloc)} className="flex-shrink-0 transition-transform active:scale-95">
                      {aloc.confirmado
                        ? <CheckCircle2 size={24} style={{ color: '#4ADE80' }} />
                        : <Circle size={24} style={{ color: '#3A3A50' }} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Despesas do Evento */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#F87171' }}>
            Despesas do Evento
          </h2>
          <button onClick={() => setModalDesp(true)} className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-white/5" style={{ background: '#F8717122', color: '#F87171' }}>
            <Plus size={12} className="inline mr-1" />
            Adicionar
          </button>
        </div>
        {despesas.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#8888AA' }}>
            Nenhuma despesa registrada
          </p>
        ) : (
          <div className="space-y-2">
            {despesas.map((despesa: any) => (
              <div key={despesa.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#2A2A38' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: '#F8717122' }}>
                    📉
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E8E8F0' }}>{despesa.descricao}</p>
                    <span className="text-xs" style={{ color: '#8888AA' }}>{formatarData(despesa.data)}</span>
                  </div>
                </div>
                <span className="text-sm font-medium" style={{ color: '#F87171' }}>
                  -{formatarMoeda(despesa.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Checklist de Tarefas Extras */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
            Tarefas Extras
            <span className="ml-2 text-xs font-normal" style={{ color: '#8888AA' }}>
              {concluidos}/{checklist.length}
            </span>
          </h2>
          {checklist.length > 0 && (
            <div className="w-16 h-1.5 rounded-full" style={{ background: '#2A2A38' }}>
              <div className="h-full rounded-full" style={{
                width: `${(concluidos / checklist.length) * 100}%`,
                background: '#4ADE80',
              }} />
            </div>
          )}
        </div>

        <div className="space-y-2 mb-3">
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-2.5 group">
              <button onClick={() => toggleChecklist(item)} className="flex-shrink-0">
                {item.concluido
                  ? <CheckCircle2 size={20} style={{ color: '#4ADE80' }} />
                  : <Circle size={20} style={{ color: '#3A3A50' }} />}
              </button>
              <div className="flex-1">
                <p className="text-sm" style={{
                  color: item.concluido ? '#8888AA' : '#E8E8F0',
                  textDecoration: item.concluido ? 'line-through' : 'none',
                }}>
                  {item.descricao}
                </p>
                {item.prazo && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: item.concluido ? '#8888AA' : (new Date(item.prazo) < new Date() ? '#F87171' : '#FFB400') }}>
                    Prazo: {formatarData(item.prazo)}
                  </p>
                )}
              </div>
              <button onClick={() => removerChecklist(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
                <Trash2 size={14} style={{ color: '#F87171' }} />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar item */}
        <div className="flex gap-2">
          <input
            value={novoItem}
            onChange={e => setNovoItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarChecklist())}
            placeholder="Adicionar item ao checklist..."
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: '#0F0F14', border: '1px solid #2A2A38', color: '#E8E8F0' }}
          />
          <button onClick={adicionarChecklist} disabled={adicionandoItem}
            className="px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#FF6B9D22', color: '#FF6B9D', border: '1px solid #FF6B9D44' }}>
            <Plus size={16} />
          </button>
        </div>
      </Card>

      {/* Ações */}
      <div className="flex gap-2 pt-2">
        <Button variante="perigo" tamanho="sm" onClick={apagarEvento} className="ml-auto">
          <Trash2 size={14} />
          Apagar evento
        </Button>
      </div>

      {/* Modal de pagamento */}
      {modalPag && (
        <ModalPagamento
          tipo={modalPag}
          evento={evento}
          onClose={() => setModalPag(null)}
          onSuccess={() => { setModalPag(null); carregar() }}
        />
      )}

      {/* Modal de Despesa */}
      {modalDesp && (
        <ModalDespesa
          eventoId={evento.id}
          onClose={() => setModalDesp(false)}
          onSuccess={() => { setModalDesp(false); carregar() }}
        />
      )}
    </div>
  )
}
