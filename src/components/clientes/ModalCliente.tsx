'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Input, Textarea, Button } from '@/components/ui'
import type { Cliente } from '@/types'
import { toast } from 'sonner'

interface Props {
  cliente: Cliente | null
  onClose: () => void
  onSuccess: () => void
}

export default function ModalCliente({ cliente, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: cliente?.nome ?? '',
    telefone: cliente?.telefone ?? '',
    email: cliente?.email ?? '',
    cidade: cliente?.cidade ?? '',
    observacoes: cliente?.observacoes ?? '',
  })

  function campo(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = cliente
        ? await fetch(`/api/clientes/${cliente.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(cliente ? 'Cliente atualizado!' : 'Cliente cadastrado!')
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto hide-scrollbar"
           style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>
            {cliente ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: '#8888AA' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={salvar} className="space-y-3">
          <Input label="Nome completo *" value={form.nome} onChange={e => campo('nome', e.target.value)}
            placeholder="Nome da cliente" required />
          <Input label="WhatsApp" value={form.telefone} onChange={e => campo('telefone', e.target.value)}
            placeholder="(14) 99999-9999" type="tel" />
          <Input label="Email" value={form.email} onChange={e => campo('email', e.target.value)}
            placeholder="email@exemplo.com" type="email" />
          <Input label="Cidade" value={form.cidade} onChange={e => campo('cidade', e.target.value)}
            placeholder="Ex: Botucatu" />
          <Textarea label="Observações" value={form.observacoes} onChange={e => campo('observacoes', e.target.value)}
            placeholder="Preferências, histórico..." rows={2} />
          <div className="flex gap-2 pt-1">
            <Button type="button" variante="secundario" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {cliente ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
