'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Phone, ChevronRight } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Loading, SectionHeader } from '@/components/ui'
import { iniciais, telWhatsapp, formatarData, labelData } from '@/lib/utils'
import { TIPO_EVENTO_LABELS } from '@/types'
import type { Cliente } from '@/types'
import ModalCliente from '@/components/clientes/ModalCliente'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [leads, setLeads] = useState<{ id: string; data_estimada: string; tipo_sugerido: string; cliente?: { nome: string } }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState<Cliente | null | 'novo'>(null)
  const [aba, setAba] = useState<'clientes' | 'leads'>('clientes')

  const carregarInicial = useCallback(async () => {
    setLoading(true)
    const limit = busca ? 15 : 5
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    params.set('limit', limit.toString())
    params.set('offset', '0')

    const [cRes, lRes] = await Promise.all([
      fetch(`/api/clientes?${params}`).then(r => r.json()),
      fetch('/api/clientes/leads?status=aberto').then(r => r.json()),
    ])
    setHasMore(cRes.length === limit)
    setClientes(cRes)
    setLeads(lRes)
    setLoading(false)
  }, [busca])

  useEffect(() => { const t = setTimeout(carregarInicial, 300); return () => clearTimeout(t) }, [carregarInicial])

  async function carregarMais() {
    setLoadingMore(true)
    const limit = 15
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    params.set('limit', limit.toString())
    params.set('offset', clientes.length.toString())

    const cRes = await fetch(`/api/clientes?${params}`).then(r => r.json())
    
    setHasMore(cRes.length === limit)
    setClientes(prev => [...prev, ...cRes])
    setLoadingMore(false)
  }

  async function atualizarLead(id: string, status: string) {
    await fetch('/api/clientes/leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    carregarInicial()
  }

  return (
    <div className="space-y-5 fade-in">
      <SectionHeader titulo="Clientes"
        subtitulo={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} • ${leads.length} oportunidade${leads.length !== 1 ? 's' : ''}`}
        acao={<Button onClick={() => setModal('novo')}><Plus size={16} /> Novo cliente</Button>}
      />

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#1A1A24' }}>
        {(['clientes', 'leads'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={aba === a ? { background: '#FF6B9D', color: '#0F0F14' } : { color: '#8888AA' }}>
            {a === 'clientes' ? `👥 Clientes` : `✨ Oportunidades ${leads.length > 0 ? `(${leads.length})` : ''}`}
          </button>
        ))}
      </div>

      {aba === 'clientes' && <>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8888AA' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
            className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
            style={{ background: '#1A1A24', border: '1px solid #2A2A38', color: '#E8E8F0' }}
            onFocus={e => e.target.style.borderColor = '#FF6B9D'}
            onBlur={e => e.target.style.borderColor = '#2A2A38'} />
        </div>
        {loading ? <Loading /> : clientes.length === 0 ? (
          <EmptyState icone="👥" titulo="Nenhum cliente ainda"
            descricao="Cadastre seus clientes para ter um histórico completo"
            acao={<Button onClick={() => setModal('novo')}><Plus size={14} /> Cadastrar cliente</Button>} />
        ) : (
          <div className="space-y-2">
            {clientes.map(cliente => {
              const eventos = (cliente as unknown as { eventos?: { id: string; nome: string; data_evento: string; tipo_evento: string }[] }).eventos ?? []
              const ultimo = eventos.sort((a, b) => b.data_evento.localeCompare(a.data_evento))[0]
              return (
                <Card key={cliente.id} onClick={() => setModal(cliente)}
                  className="cursor-pointer hover:border-pink-500/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, #FF6B9D, #FFB400)', color: '#0F0F14' }}>
                      {iniciais(cliente.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: '#E8E8F0' }}>{cliente.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cliente.telefone && (
                          <a href={telWhatsapp(cliente.telefone)} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs" style={{ color: '#25D366' }}>
                            <Phone size={10} /> {cliente.telefone}
                          </a>
                        )}
                      </div>
                      {ultimo && (
                        <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                          Último: {ultimo.nome} • {labelData(ultimo.data_evento)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="#7C3AED">{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</Badge>
                      <ChevronRight size={16} style={{ color: '#3A3A50' }} />
                    </div>
                  </div>
                </Card>
              )
            })}
            
            {hasMore && (
              <Button 
                variante="secundario" 
                className="w-full mt-4" 
                onClick={carregarMais} 
                loading={loadingMore}
              >
                Carregar mais clientes ▾
              </Button>
            )}
          </div>
        )}
      </>}

      {aba === 'leads' && (
        <div className="space-y-2">
          {leads.length === 0 ? (
            <EmptyState icone="✨" titulo="Sem oportunidades abertas"
              descricao="As oportunidades aparecem automaticamente quando eventos são concluídos" />
          ) : leads.map(lead => (
            <Card key={lead.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#E8E8F0' }}>
                    {lead.cliente?.nome}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                    {TIPO_EVENTO_LABELS[lead.tipo_sugerido as keyof typeof TIPO_EVENTO_LABELS]}
                  </p>
                  {lead.data_estimada && (
                    <p className="text-xs mt-0.5" style={{ color: '#FFB400' }}>
                      📅 Estimado: {formatarData(lead.data_estimada)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => atualizarLead(lead.id, 'contatado')}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: '#FFB40022', color: '#FFB400', border: '1px solid #FFB40044' }}>
                    Contatado
                  </button>
                  <button onClick={() => atualizarLead(lead.id, 'ignorado')}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: '#2A2A38', color: '#8888AA' }}>
                    Ignorar
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalCliente cliente={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)} onSuccess={() => { setModal(null); carregarInicial() }} />
      )}
    </div>
  )
}
