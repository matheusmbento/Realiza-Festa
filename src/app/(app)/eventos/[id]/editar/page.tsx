'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { Input, Select, Textarea, Button, Loading } from '@/components/ui'
import { toast } from 'sonner'
import { TIPO_EVENTO_LABELS, type Evento, type Cliente } from '@/types'

export default function EditarEvento() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cor, setCor] = useState('')
  const [cores, setCores] = useState<string[]>([])
  const [form, setForm] = useState({
    nome: '', cliente_id: '', tipo_evento: 'aniversario',
    data_evento: '', hora_inicio: '', hora_montagem: '',
    local_nome: '', local_endereco: '', tema: '',
    tipo_entrega: 'leva_monta', valor_total: '', valor_sinal: '',
    valor_decoracao: '', valor_brinquedos: '', valor_frete: '',
    forma_pagamento: 'pix', observacoes: '',
  })

  const carregar = useCallback(async () => {
    const [evRes, clRes] = await Promise.all([
      fetch(`/api/eventos/${id}`).then(r => r.json()),
      fetch('/api/clientes').then(r => r.json()),
    ])
    const e: Evento = evRes
    setForm({
      nome: e.nome ?? '', cliente_id: e.cliente_id ?? '', tipo_evento: e.tipo_evento ?? 'aniversario',
      data_evento: e.data_evento ?? '', hora_inicio: e.hora_inicio?.slice(0,5) ?? '',
      hora_montagem: e.hora_montagem?.slice(0,5) ?? '', local_nome: e.local_nome ?? '',
      local_endereco: e.local_endereco ?? '', tema: e.tema ?? '',
      tipo_entrega: e.tipo_entrega ?? 'leva_monta',
      valor_total: String(e.valor_total ?? ''), valor_sinal: String(e.valor_sinal ?? ''),
      valor_decoracao: String(e.valor_decoracao ?? ''),
      valor_brinquedos: String(e.valor_brinquedos ?? ''),
      valor_frete: String(e.valor_frete ?? ''),
      forma_pagamento: e.forma_pagamento ?? 'pix', observacoes: e.observacoes ?? '',
    })
    setCores(e.cores ?? [])
    setClientes(clRes)
    setLoading(false)
  }, [id])

  useEffect(() => { carregar() }, [carregar])
  function campo(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const val_dec = parseFloat(form.valor_decoracao.replace(',', '.')) || 0
      const val_bri = parseFloat(form.valor_brinquedos.replace(',', '.')) || 0
      const val_fre = parseFloat(form.valor_frete.replace(',', '.')) || 0
      const val_tot = val_dec + val_bri + val_fre

      const res = await fetch(`/api/eventos/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form, cores,
          valor_decoracao: val_dec,
          valor_brinquedos: val_bri,
          valor_frete: val_fre,
          valor_total: val_tot,
          valor_sinal: parseFloat(form.valor_sinal.replace(',', '.')) || 0,
          cliente_id: form.cliente_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Evento atualizado!')
      router.push(`/eventos/${id}`)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4 fade-in pb-10">
      <div className="flex items-center gap-3">
        <Link href={`/eventos/${id}`} className="p-2 rounded-xl hover:bg-white/5" style={{ color: '#8888AA' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-xl font-bold" style={{ color: '#E8E8F0' }}>Editar Evento</h1>
      </div>
      <form onSubmit={salvar} className="space-y-4">
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#FF6B9D' }}>Dados do evento</h2>
          <Input label="Nome *" value={form.nome} onChange={e => campo('nome', e.target.value)} required />
          <Select label="Cliente" value={form.cliente_id} onChange={e => campo('cliente_id', e.target.value)}>
            <option value="">Sem cliente vinculado</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <Select label="Tipo" value={form.tipo_evento} onChange={e => campo('tipo_evento', e.target.value)}>
            {Object.entries(TIPO_EVENTO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#FFB400' }}>Data e local</h2>
          <Input label="Data *" type="date" value={form.data_evento} onChange={e => campo('data_evento', e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hora evento" type="time" value={form.hora_inicio} onChange={e => campo('hora_inicio', e.target.value)} />
            <Input label="Hora montagem" type="time" value={form.hora_montagem} onChange={e => campo('hora_montagem', e.target.value)} />
          </div>
          <Input label="Local" value={form.local_nome} onChange={e => campo('local_nome', e.target.value)} placeholder="Nome do salão" />
          <Input label="Endereço" value={form.local_endereco} onChange={e => campo('local_endereco', e.target.value)} />
          <Input label="Tema" value={form.tema} onChange={e => campo('tema', e.target.value)} />
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8888AA' }}>Cores</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {cores.map(c => (
                <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                      style={{ background: '#2A2A38', color: '#E8E8F0' }}>
                  {c} <button type="button" onClick={() => setCores(p => p.filter(x => x !== c))}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={cor} onChange={e => setCor(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (cor.trim()) { setCores(p => [...p, cor.trim()]); setCor('') } } }}
                placeholder="Adicionar cor..." className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: '#0F0F14', border: '1px solid #2A2A38', color: '#E8E8F0' }} />
              <button type="button" onClick={() => { if (cor.trim()) { setCores(p => [...p, cor.trim()]); setCor('') } }}
                className="px-3 py-2 rounded-xl" style={{ background: '#2A2A38', color: '#E8E8F0' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
          <Select label="Tipo de entrega" value={form.tipo_entrega} onChange={e => campo('tipo_entrega', e.target.value)}>
            <option value="leva_monta">Leva e monta</option>
            <option value="leva_sem_monta">Leva sem montagem</option>
            <option value="busca_cliente">Cliente busca</option>
          </Select>
        </div>
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Financeiro</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="Decoração" value={form.valor_decoracao} onChange={e => campo('valor_decoracao', e.target.value)} inputMode="decimal" />
            <Input label="Brinquedos" value={form.valor_brinquedos} onChange={e => campo('valor_brinquedos', e.target.value)} inputMode="decimal" />
            <Input label="Frete" value={form.valor_frete} onChange={e => campo('valor_frete', e.target.value)} inputMode="decimal" />
            <Input label="Valor sinal" value={form.valor_sinal} onChange={e => campo('valor_sinal', e.target.value)} inputMode="decimal" />
          </div>
          <Select label="Pagamento" value={form.forma_pagamento} onChange={e => campo('forma_pagamento', e.target.value)}>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="transferencia">Transferência</option>
          </Select>
        </div>
        <Textarea label="Observações" value={form.observacoes} onChange={e => campo('observacoes', e.target.value)} rows={3} />
        <Button type="submit" tamanho="lg" loading={salvando} className="w-full">Salvar alterações</Button>
      </form>
    </div>
  )
}
