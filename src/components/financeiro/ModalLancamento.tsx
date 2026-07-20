'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Input, Select, Button } from '@/components/ui'
import { toast } from 'sonner'

interface Props { onClose: () => void; onSuccess: () => void }

export default function ModalLancamento({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tipo: 'saida', valor: '', descricao: '',
    categoria: 'outros', data: new Date().toISOString().split('T')[0],
  })

  function campo(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/financeiro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor.replace(',', '.')) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Lançamento registrado!')
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
           style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>Novo lançamento</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: '#8888AA' }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#0F0F14' }}>
          {['saida', 'entrada'].map(t => (
            <button key={t} onClick={() => campo('tipo', t)} type="button"
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={form.tipo === t
                ? { background: t === 'entrada' ? '#4ADE80' : '#F87171', color: '#0F0F14' }
                : { color: '#8888AA' }}>
              {t === 'entrada' ? '💚 Entrada' : '🔴 Saída'}
            </button>
          ))}
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <Input label="Descrição *" value={form.descricao} onChange={e => campo('descricao', e.target.value)}
            placeholder="Ex: Compra de bexigas ML" required />
          <Input label="Valor (R$) *" value={form.valor} onChange={e => campo('valor', e.target.value)}
            placeholder="0,00" inputMode="decimal" required />
          <Select label="Categoria" value={form.categoria} onChange={e => campo('categoria', e.target.value)}>
            <option value="material">Material</option>
            <option value="frete">Frete / transporte</option>
            <option value="marketing">Marketing</option>
            <option value="manutencao">Manutenção</option>
            <option value="outros">Outros</option>
            {form.tipo === 'entrada' && <>
              <option value="evento_sinal">Sinal de evento</option>
              <option value="evento_final">Pagamento final</option>
            </>}
          </Select>
          <Input label="Data" type="date" value={form.data} onChange={e => campo('data', e.target.value)} />
          <div className="flex gap-2 pt-1">
            <Button type="button" variante="secundario" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>Registrar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
