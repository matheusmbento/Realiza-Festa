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

interface ContatoEvento {
  id: string
  evento_id: string
  cliente_id?: string
  tipo: 'confirmacao' | 'pre_evento' | 'feedback' | 'pos_venda'
  status: 'pendente' | 'enviado' | 'ignorado'
  data_prevista: string
  mensagem_gerada?: string
  data_envio?: string
  criado_em: string
}

export default function DetalheEvento() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalPag, setModalPag] = useState<'sinal' | 'final' | null>(null)
  const [modalDesp, setModalDesp] = useState(false)
  const [novoItem, setNovoItem] = useState('')
  const [adicionandoItem, setAdicionandoItem] = useState(false)
  const [contatos, setContatos] = useState<ContatoEvento[]>([])
  const [mostrarRomaneioTudo, setMostrarRomaneioTudo] = useState(false)

  const carregar = useCallback(async () => {
    const [eventoRes, contatosRes] = await Promise.all([
      fetch(`/api/eventos/${id}`),
      fetch(`/api/eventos/${id}/contatos`),
    ])
    const data = await eventoRes.json()
    setEvento(data)
    
    const contatosData = await contatosRes.json()
    setContatos(Array.isArray(contatosData) ? contatosData : [])
    
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

  async function removerDespesa(idDespesa: string) {
    if (!confirm('Apagar esta despesa?')) return
    await fetch(`/api/financeiro/${idDespesa}?force=true`, { method: 'DELETE' })
    carregar()
  }

  async function apagarEvento() {
    if (!confirm('Apagar este evento? Essa ação não pode ser desfeita.')) return
    const res = await fetch(`/api/eventos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const errorData = await res.json()
      toast.error(errorData.error || 'Falha ao remover evento')
      return
    }
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
  
  const alocacoesPorCategoria = alocacoes.reduce((acc: any, aloc: any) => {
    const item = aloc.item || {}
    const categoria = item.categoria?.nome ?? 'Outros'
    if (!acc[categoria]) acc[categoria] = []
    acc[categoria].push(aloc)
    return acc
  }, {} as Record<string, any[]>)
  const categoriasUnicas = Object.keys(alocacoesPorCategoria)
  const saldo = evento.valor_total - evento.valor_sinal
  
  // Financeiro
  const despesas = evento.lancamentos?.filter((l: any) => l.tipo === 'saida' && !l.deleted_at) || []
  const totalDespesas = despesas.reduce((acc: number, d: any) => acc + Number(d.valor), 0)
  const lucroReal = evento.valor_total - totalDespesas

  // Gera o texto de confirmação para WhatsApp
  function gerarMensagemConfirmacao(): string {
    if (!evento) return ''

    const fmtData = (d: string) =>
      new Date(d + 'T12:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric',
        month: 'long', year: 'numeric',
      })

    const fmtMoeda = (v: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
      }).format(v)

    const cliente = (evento as any).cliente
    const nomeCliente = cliente?.nome?.split(' ')[0] ?? 'cliente'
    const saldo = evento.valor_total - evento.valor_sinal

    const linhaLocal = [
      evento.local_nome,
      evento.local_endereco,
    ].filter(Boolean).join(' — ')

    const tipoEntregaLabel: Record<string, string> = {
      leva_monta: 'Leva e monta',
      leva_sem_monta: 'Leva sem montagem',
      busca_cliente: 'Cliente busca',
    }

    const partes = [
      `\u2705 *Confirma\u00E7\u00E3o de Evento \u2014 Realiza Festa*`,
      ``,
      `Ol\u00E1, ${nomeCliente}! \u{1F389}`,
      `Segue o resumo da sua festa confirmada:`,
      ``,
      `\u{1F4C5} *Data:* ${fmtData(evento.data_evento)}`,
      evento.hora_inicio
        ? `\u{1F552} *Hor\u00E1rio:* ${evento.hora_inicio.slice(0,5)}${evento.hora_montagem ? ` (montagem a partir das ${evento.hora_montagem.slice(0,5)})` : ''}`
        : null,
      linhaLocal ? `\u{1F4CD} *Local:* ${linhaLocal}` : null,
      evento.tema ? `\u{1F3A8} *Tema:* ${evento.tema}` : null,
      evento.cores?.length
        ? `\u{1F380} *Cores:* ${evento.cores.join(', ')}`
        : null,
      `\u{1F69A} *Entrega:* ${tipoEntregaLabel[evento.tipo_entrega] ?? evento.tipo_entrega}`,
      ``,
      `\u{1F4B0} *Valor total:* ${fmtMoeda(evento.valor_total)}`,
      evento.sinal_recebido
        ? `\u2705 *Sinal pago:* ${fmtMoeda(evento.valor_sinal)}${evento.data_sinal ? ` (${new Date(evento.data_sinal + 'T12:00').toLocaleDateString('pt-BR')})` : ''}`
        : `\u23F3 *Sinal:* ${fmtMoeda(evento.valor_sinal)} (aguardando)`,
      saldo > 0
        ? `\u23F3 *Restante:* ${fmtMoeda(saldo)} (a pagar no dia)`
        : `\u2705 *Pagamento:* Quitado`,
      ``,
      `Qualquer d\u00FAvida, pode chamar! \u{1F495}`,
      `Acompanhe as novidades no nosso Instagram: @realizafesta1 \u{1F4F8}`,
      `\u2014 Realiza Festa`,
    ].filter((l): l is string => l !== null)

    return partes.join('\n')
  }

  // Gera textos variados dependendo do tipo de contato
  function gerarMensagemContato(tipo: string): string {
    const cliente = (evento as any).cliente
    const nomeCliente = cliente?.nome?.split(' ')[0] ?? 'cliente'

    if (tipo === 'confirmacao') return gerarMensagemConfirmacao()

    if (tipo === 'pre_evento') {
      return `Ol\u00E1, ${nomeCliente}! \u{1F389}\n\nPassando aqui para lembrar que faltam poucos dias para a nossa festa! Est\u00E1 tudo preparadinho por aqui.\n\nSe tiver alguma d\u00FAvida de \u00FAltima hora ou precisar ajustar algum detalhe, \u00E9 s\u00F3 me chamar! \u{1F495}\n\nAproveite e acompanhe nossas montagens no Instagram @realizafesta1 \u{1F4F8}\n\n\u2014 Realiza Festa`
    }

    if (tipo === 'feedback') {
      return `Ol\u00E1, ${nomeCliente}! Tudo bem? \u{1F31F}\n\nPassando para agradecer mais uma vez a confian\u00E7a no nosso trabalho! Como foi a festa? Deu tudo certo com os nossos itens? \n\nNosso maior objetivo \u00E9 sempre garantir a alegria da festa, ent\u00E3o adorar\u00EDamos saber o que voc\u00EA achou!\n\nAh, e se tiver alguma foto linda da decora\u00E7\u00E3o, n\u00E3o esque\u00E7a de nos marcar no Instagram @realizafesta1 \u{1F4F8} Vamos adorar ver e repostar!\n\nUm abra\u00E7o,\n\u2014 Realiza Festa`
    }

    if (tipo === 'pos_venda') {
      return `Ol\u00E1, ${nomeCliente}! Tudo bem? \u{1F382}\n\nLogo logo vai fazer 1 ano daquela festa linda que fizemos juntos! Como o tempo voa, n\u00E9?\n\nPassando s\u00F3 pra avisar que estamos com v\u00E1rias novidades incr\u00EDveis para o pr\u00F3ximo evento. Se j\u00E1 estiver planejando algo, me d\u00E1 um toque pra j\u00E1 garantirmos a sua data!\n\nVoc\u00EA pode espiar as decora\u00E7\u00F5es novas l\u00E1 no nosso Instagram @realizafesta1 \u{1F4F8}\n\nUm abra\u00E7o,\n\u2014 Realiza Festa`
    }

    return ''
  }

  // Abre WhatsApp com mensagem pré-preenchida
  function abrirWhatsApp(telefone?: string, mensagem?: string) {
    const tel = telefone?.replace(/\D/g, '') ?? ''
    const msg = encodeURIComponent(mensagem ?? gerarMensagemConfirmacao())
    const url = tel
      ? `https://wa.me/55${tel}?text=${msg}`
      : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  // Label e emoji por tipo de contato
  const CONTATO_CONFIG = {
    confirmacao: { label: 'Confirmação',      emoji: '✅', cor: '#4ADE80' },
    pre_evento:  { label: 'Lembrete 3 dias',  emoji: '🔔', cor: '#FFB400' },
    feedback:    { label: 'Feedback pós-festa',emoji: '💬', cor: '#7C3AED' },
    pos_venda:   { label: 'Pós-venda',        emoji: '🌟', cor: '#FF6B9D' },
  } as const

  async function marcarEnviado(contato: ContatoEvento) {
    await fetch(`/api/eventos/${id}/contatos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contato.id, status: 'enviado' }),
    })
    carregar()
  }

  async function ignorarContato(contato: ContatoEvento) {
    await fetch(`/api/eventos/${id}/contatos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contato.id, status: 'ignorado' }),
    })
    carregar()
  }

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
          </h2>
          <div className="flex items-center gap-3">
            <Link href={`/eventos/${id}/itens`}>
              <button className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:bg-white/5" style={{ background: '#2A2A38', color: '#E8E8F0' }}>
                <Plus size={12} className="inline mr-1" />
                Adicionar
              </button>
            </Link>
          </div>
        </div>

        {/* Resumo e Barra de Progresso */}
        {alocacoes.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#8888AA' }}>
              <span>{categoriasUnicas.length} categoria{categoriasUnicas.length !== 1 ? 's' : ''} • {alocacoes.length} item{alocacoes.length !== 1 ? 's' : ''}</span>
              <span style={{ color: alocacoesConcluidas === alocacoes.length ? '#4ADE80' : '#E8E8F0' }}>
                {alocacoesConcluidas} confirmados
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: '#2A2A38' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${(alocacoesConcluidas / alocacoes.length) * 100}%`,
                background: alocacoesConcluidas === alocacoes.length ? '#4ADE80' : '#FFB400',
              }} />
            </div>
          </div>
        )}

        {alocacoes.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#8888AA' }}>
            Nenhum item alocado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {(mostrarRomaneioTudo ? categoriasUnicas : categoriasUnicas.slice(0, 5)).map(cat => {
              const itens = alocacoesPorCategoria[cat]
              const concluidosCat = itens.filter((a: any) => a.confirmado).length
              return (
                <details key={cat} className="group" open>
                  <summary className="cursor-pointer outline-none select-none">
                    <div className="flex items-center gap-2 mb-2 mt-4">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: itens[0]?.item?.categoria?.cor ?? '#8888AA' }}
                      />
                      <span
                        className="text-sm font-semibold tracking-wide capitalize"
                        style={{ color: '#E8E8F0' }}
                      >
                        {cat}
                      </span>
                      <span
                        className="text-xs ml-auto font-medium"
                        style={{ color: concluidosCat === itens.length ? '#4ADE80' : (concluidosCat > 0 ? '#FFB400' : '#F87171') }}
                      >
                        ({concluidosCat}/{itens.length} ✓)
                      </span>
                    </div>
                  </summary>
                  
                  <div className="space-y-1 mt-2 pl-2 border-l-2 ml-1" style={{ borderColor: '#2A2A38' }}>
                    {itens.map((aloc: any) => {
                      const item = aloc.item || {}
                      return (
                        <div key={aloc.id} className="flex items-center justify-between py-1.5 pl-3 border-b last:border-0 group/item hover:bg-white/5 rounded-lg transition-colors"
                             style={{ borderColor: '#2A2A38' }}>
                          <div className="flex items-center gap-2.5">
                            <p className="text-sm" style={{ color: '#E8E8F0' }}>{item.nome || 'Item Desconhecido'}</p>
                          </div>
                          <div className="flex items-center gap-4 pr-2">
                            <span className="text-xs font-medium" style={{ color: '#8888AA' }}>
                              × {aloc.quantidade}
                            </span>
                            <button onClick={() => toggleAlocacao(aloc)} className="flex-shrink-0 transition-transform active:scale-95 p-2 -mr-2">
                              {aloc.confirmado
                                ? <CheckCircle2 size={24} style={{ color: '#4ADE80' }} />
                                : <Circle size={24} style={{ color: '#3A3A50' }} />}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </details>
              )
            })}
            
            {categoriasUnicas.length > 5 && !mostrarRomaneioTudo && (
              <button onClick={() => setMostrarRomaneioTudo(true)}
                className="w-full py-2 mt-2 text-xs font-medium rounded-lg transition-colors hover:bg-white/5"
                style={{ color: '#8888AA', border: '1px dashed #2A2A38' }}>
                Mostrar + {categoriasUnicas.length - 5} categorias
              </button>
            )}
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
              <div key={despesa.id} className="flex items-center justify-between py-2 border-b last:border-0 group" style={{ borderColor: '#2A2A38' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: '#F8717122' }}>
                    📉
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E8E8F0' }}>{despesa.descricao}</p>
                    <span className="text-xs" style={{ color: '#8888AA' }}>{formatarData(despesa.data)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: '#F87171' }}>
                    -{formatarMoeda(despesa.valor)}
                  </span>
                  <button onClick={() => removerDespesa(despesa.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
                    <Trash2 size={14} style={{ color: '#F87171' }} />
                  </button>
                </div>
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
              <button onClick={() => toggleChecklist(item)} className="flex-shrink-0 p-1.5 -ml-1.5">
                {item.concluido
                  ? <CheckCircle2 size={24} style={{ color: '#4ADE80' }} />
                  : <Circle size={24} style={{ color: '#3A3A50' }} />}
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

      {/* ── Resumo de confirmação ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
            📋 Resumo para cliente
          </h2>
          <button
            onClick={() => {
              const cliente = (evento as any).cliente
              abrirWhatsApp(cliente?.telefone, gerarMensagemConfirmacao())
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: '#25D36622',
              color: '#25D366',
              border: '1px solid #25D36644',
            }}
          >
            <span>📲</span> Enviar por WhatsApp
          </button>
        </div>

        {/* Preview da mensagem */}
        <pre
          className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl p-3 select-all"
          style={{
            background: '#0F0F14',
            color: '#8888AA',
            border: '1px solid #2A2A38',
            fontFamily: 'inherit',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {gerarMensagemConfirmacao()}
        </pre>

        <p
          className="text-xs mt-2 text-center"
          style={{ color: '#3A3A50' }}
        >
          Toque no texto acima para selecionar e copiar
        </p>
      </div>

      {/* ── Contatos do cliente ── */}
      {contatos.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#E8E8F0' }}>
            📞 Contatos com a cliente
          </h2>

          <div className="space-y-2">
            {contatos.map(contato => {
              const cfg = CONTATO_CONFIG[contato.tipo]
              const vencido =
                contato.status === 'pendente' &&
                contato.data_prevista < new Date().toISOString().split('T')[0]
              const cliente = (evento as any).cliente

              return (
                <div
                  key={contato.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                  style={{
                    background: vencido ? '#F8717118' : '#0F0F14',
                    border: `1px solid ${
                      vencido
                        ? '#F8717144'
                        : contato.status === 'enviado'
                        ? '#4ADE8033'
                        : '#2A2A38'
                    }`,
                  }}
                >
                  <span className="text-lg flex-shrink-0">{cfg.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: '#E8E8F0' }}
                    >
                      {cfg.label}
                    </p>
                    <p className="text-xs" style={{ color: vencido ? '#F87171' : '#8888AA' }}>
                      {vencido ? '⚠️ Vencido — ' : ''}
                      {new Date(contato.data_prevista + 'T12:00')
                        .toLocaleDateString('pt-BR', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      {contato.data_envio &&
                        ` • Enviado em ${new Date(contato.data_envio)
                          .toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  {contato.status === 'enviado' ? (
                    <span className="text-xs font-medium" style={{ color: '#4ADE80' }}>
                      ✓ Enviado
                    </span>
                  ) : contato.status === 'ignorado' ? (
                    <span className="text-xs" style={{ color: '#3A3A50' }}>
                      Ignorado
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => abrirWhatsApp(cliente?.telefone, gerarMensagemContato(contato.tipo))}
                        className="p-1.5 rounded-lg text-sm"
                        style={{ background: '#25D36622', color: '#25D366' }}
                        title="Abrir WhatsApp"
                      >
                        📲
                      </button>
                      <button
                        onClick={() => marcarEnviado(contato)}
                        className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: '#4ADE8022', color: '#4ADE80' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => ignorarContato(contato)}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: '#2A2A38', color: '#8888AA' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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
