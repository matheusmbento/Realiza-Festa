'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Plus } from 'lucide-react'
import { Card, Badge, Loading, SectionHeader, StatCard, Textarea, Button } from '@/components/ui'
import { formatarMoeda, formatarData, telWhatsapp } from '@/lib/utils'
import { STATUS_CORES, STATUS_LABELS, TIPO_EVENTO_LABELS, type Evento, type Cliente } from '@/types'
import { toast } from 'sonner'

export default function ClienteDetalhes() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente & { eventos: Evento[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filhos, setFilhos] = useState('')
  const [observacoes, setObservacoes] = useState('')

  useEffect(() => {
    fetch(`/api/clientes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setCliente(data)
        setFilhos(data.filhos || '')
        setObservacoes(data.observacoes || '')
        setLoading(false)
      })
  }, [params.id])

  async function salvarAnotacoes() {
    setSaving(true)
    try {
      const res = await fetch(`/api/clientes/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filhos, observacoes })
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Anotações salvas com sucesso!')
    } catch (err) {
      toast.error('Erro ao salvar anotações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="mt-10"><Loading /></div>
  if (!cliente) return <div className="mt-10 text-center text-[#8888AA]">Cliente não encontrado</div>

  const isVip = (cliente.total_eventos || 0) >= 3

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: '#8888AA' }}>
            <ArrowLeft size={20} />
          </Link>
          <SectionHeader titulo={cliente.nome} />
          {isVip && <Badge color="#FFB400">🌟 VIP</Badge>}
        </div>
        <Link href={`/eventos/novo?cliente_id=${cliente.id}`}>
          <Button><Plus size={16} /> Novo Evento</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#8888AA' }}>
        {cliente.telefone && (
          <a href={telWhatsapp(cliente.telefone)} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1.5 hover:text-green-400 transition-colors">
            <Phone size={14} /> {cliente.telefone}
          </a>
        )}
        {cliente.email && <span>✉️ {cliente.email}</span>}
        {cliente.cidade && <span>📍 {cliente.cidade}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icone="💰" 
          label="LTV (Total Gasto)" 
          valor={formatarMoeda(cliente.ltv || 0)} 
          cor="#4ADE80" 
        />
        <StatCard 
          icone="📊" 
          label="Ticket Médio" 
          valor={formatarMoeda(cliente.ticket_medio || 0)} 
          cor="#7C3AED" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Histórico de Eventos */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>Histórico de Eventos ({cliente.total_eventos})</h2>
          {!cliente.eventos || cliente.eventos.length === 0 ? (
            <Card>
              <p className="text-center text-sm py-4" style={{ color: '#8888AA' }}>Nenhum evento registrado.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {[...cliente.eventos].sort((a,b) => b.data_evento.localeCompare(a.data_evento)).map(evento => (
                <Link key={evento.id} href={`/eventos/${evento.id}`}>
                  <Card className="hover:border-pink-500/20 transition-colors"
                        style={{ borderLeft: `3px solid ${STATUS_CORES[evento.status]}` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#E8E8F0' }}>{evento.nome}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>
                          {TIPO_EVENTO_LABELS[evento.tipo_evento]} • {formatarData(evento.data_evento)}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge color={STATUS_CORES[evento.status]}>{STATUS_LABELS[evento.status]}</Badge>
                        <span className="text-xs font-medium" style={{ color: '#E8E8F0' }}>{formatarMoeda(evento.valor_total || 0)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Dossiê */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#FF6B9D' }}>
            Dossiê do Cliente
          </h2>
          <Card className="space-y-4">
            <Textarea 
              label="Filhos (Nome e Data de Nascimento)" 
              value={filhos} 
              onChange={e => setFilhos(e.target.value)} 
              placeholder="Ex: Kaio (10/05/2018), Marina (22/11/2021)"
              rows={2}
            />
            <Textarea 
              label="Anotações Importantes" 
              value={observacoes} 
              onChange={e => setObservacoes(e.target.value)} 
              placeholder="Ex: Mora em condomínio chato, gosta muito de temas da Disney..."
              rows={4}
            />
            <Button onClick={salvarAnotacoes} loading={saving} className="w-full">
              Salvar Dossiê
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
