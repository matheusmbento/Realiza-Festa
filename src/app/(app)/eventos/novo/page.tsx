'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { Input, Select, Textarea, Button, Card, SectionHeader } from '@/components/ui'
import { toast } from 'sonner'
import { TIPO_EVENTO_LABELS, type Cliente } from '@/types'
import Link from 'next/link'

export default function NovoEvento() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cor, setCor] = useState('')
  const [cores, setCores] = useState<string[]>([])

  const [form, setForm] = useState({
    nome: '',
    cliente_id: '',
    tipo_evento: 'aniversario',
    data_evento: '',
    hora_inicio: '',
    hora_montagem: '',
    local_nome: '',
    local_endereco: '',
    tema: '',
    tipo_entrega: 'leva_monta',
    valor_decoracao: '',
    valor_brinquedos: '',
    valor_frete: '',
    valor_sinal: '',
    forma_pagamento: 'pix',
    observacoes: '',
  })

  useEffect(() => {
    fetch('/api/clientes').then(r => r.json()).then(setClientes)
  }, [])

  function campo(key: string, valor: string) {
    setForm(prev => ({ ...prev, [key]: valor }))
  }

  function adicionarCor() {
    if (cor.trim() && !cores.includes(cor.trim())) {
      setCores(prev => [...prev, cor.trim()])
      setCor('')
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.data_evento) { toast.error('Informe a data do evento'); return }
    setLoading(true)
    try {
      const val_dec = parseFloat(form.valor_decoracao.replace(',', '.')) || 0
      const val_bri = parseFloat(form.valor_brinquedos.replace(',', '.')) || 0
      const val_fre = parseFloat(form.valor_frete.replace(',', '.')) || 0
      const val_tot = val_dec + val_bri + val_fre

      const payload = {
        ...form,
        valor_decoracao: val_dec,
        valor_brinquedos: val_bri,
        valor_frete: val_fre,
        valor_total: val_tot,
        valor_sinal: parseFloat(form.valor_sinal.replace(',', '.')) || 0,
        cores,
        status: 'orcamento',
        cliente_id: form.cliente_id || null,
      }

      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Evento criado com sucesso! 🎉')
      router.push(`/eventos/${data.id}`)
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 fade-in pb-10">
      <div className="flex items-center gap-3">
        <Link href="/eventos" className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              style={{ color: '#8888AA' }}>
          <ArrowLeft size={20} />
        </Link>
        <SectionHeader titulo="Novo Evento" />
      </div>

      <form onSubmit={salvar} className="space-y-4">
        {/* Dados básicos */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#FF6B9D' }}>Dados do evento</h2>
          <div className="space-y-4">
            <Input label="Nome do evento *" value={form.nome}
              onChange={e => campo('nome', e.target.value)}
              placeholder="Ex: Festa da Helena" required />

            <Select label="Cliente" value={form.cliente_id}
              onChange={e => campo('cliente_id', e.target.value)}>
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>

            <Select label="Tipo de evento" value={form.tipo_evento}
              onChange={e => campo('tipo_evento', e.target.value)}>
              {Object.entries(TIPO_EVENTO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Data e horários */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#FFB400' }}>Data e horários</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Data do evento *" type="date" value={form.data_evento}
                onChange={e => campo('data_evento', e.target.value)} required />
            </div>
            <Input label="Hora do evento" type="time" value={form.hora_inicio}
              onChange={e => campo('hora_inicio', e.target.value)} />
            <Input label="Hora de montagem" type="time" value={form.hora_montagem}
              onChange={e => campo('hora_montagem', e.target.value)} />
          </div>
        </Card>

        {/* Local */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#7C3AED' }}>Local e decoração</h2>
          <div className="space-y-3">
            <Input label="Nome do local" value={form.local_nome}
              onChange={e => campo('local_nome', e.target.value)}
              placeholder="Ex: Salão do Clube ABC" />
            <Input label="Endereço" value={form.local_endereco}
              onChange={e => campo('local_endereco', e.target.value)}
              placeholder="Rua, número, bairro" />
            <Input label="Tema" value={form.tema}
              onChange={e => campo('tema', e.target.value)}
              placeholder="Ex: Stitch, Moana, Safari..." />

            {/* Cores */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#8888AA' }}>
                Cores do evento
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {cores.map(c => (
                  <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                        style={{ background: '#2A2A38', color: '#E8E8F0' }}>
                    {c}
                    <button type="button" onClick={() => setCores(p => p.filter(x => x !== c))}>
                      <X size={12} style={{ color: '#8888AA' }} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={cor} onChange={e => setCor(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarCor())}
                  placeholder="Ex: Azul, Rosa..." className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: '#0F0F14', border: '1px solid #2A2A38', color: '#E8E8F0' }} />
                <button type="button" onClick={adicionarCor}
                  className="px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ background: '#2A2A38', color: '#E8E8F0' }}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <Select label="Tipo de entrega" value={form.tipo_entrega}
              onChange={e => campo('tipo_entrega', e.target.value)}>
              <option value="leva_monta">Leva e monta</option>
              <option value="leva_sem_monta">Leva sem montagem</option>
              <option value="busca_cliente">Cliente busca</option>
            </Select>
          </div>
        </Card>

        {/* Financeiro */}
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#4ADE80' }}>Financeiro</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input label="Decoração (R$)" value={form.valor_decoracao}
                onChange={e => campo('valor_decoracao', e.target.value)}
                placeholder="0,00" inputMode="decimal" />
              <Input label="Brinquedos (R$)" value={form.valor_brinquedos}
                onChange={e => campo('valor_brinquedos', e.target.value)}
                placeholder="0,00" inputMode="decimal" />
              <Input label="Frete (R$)" value={form.valor_frete}
                onChange={e => campo('valor_frete', e.target.value)}
                placeholder="0,00" inputMode="decimal" />
              <Input label="Valor do sinal (R$)" value={form.valor_sinal}
                onChange={e => campo('valor_sinal', e.target.value)}
                placeholder="0,00" inputMode="decimal" />
            </div>
            <Select label="Forma de pagamento" value={form.forma_pagamento}
              onChange={e => campo('forma_pagamento', e.target.value)}>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="transferencia">Transferência</option>
            </Select>
          </div>
        </Card>

        {/* Observações */}
        <Card>
          <Textarea label="Observações" value={form.observacoes}
            onChange={e => campo('observacoes', e.target.value)}
            placeholder="Anotações importantes para este evento..."
            rows={3} />
        </Card>

        <Button type="submit" tamanho="lg" loading={loading} className="w-full">
          Criar evento
        </Button>
      </form>
    </div>
  )
}
