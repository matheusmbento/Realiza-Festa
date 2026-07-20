import { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface ModalDespesaProps {
  eventoId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ModalDespesa({ eventoId, onClose, onSuccess }: ModalDespesaProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0]
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descricao || !form.valor || !form.data) return

    setLoading(true)
    const valorNum = parseFloat(form.valor.replace(',', '.'))

    const payload = {
      tipo: 'saida',
      valor: valorNum,
      descricao: form.descricao,
      categoria: 'material', // pode ser ajustado se precisarem de frete/etc depois
      evento_id: eventoId,
      data: form.data
    }

    const res = await fetch('/api/financeiro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      toast.success('Despesa registrada com sucesso!')
      onSuccess()
    } else {
      toast.error('Erro ao registrar despesa')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-10 lg:slide-in-from-bottom-0 lg:zoom-in-95">
        <Card className="relative p-6">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10" style={{ color: '#8888AA' }}>
            <X size={20} />
          </button>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold font-display" style={{ color: '#F87171' }}>Adicionar Despesa</h2>
            <p className="text-sm" style={{ color: '#8888AA' }}>Registre gastos extras (ex: bexigas, descartáveis)</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Descrição do Gasto"
              placeholder="Ex: Balões tema Carros, Pratinhos..."
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.valor}
                onChange={e => setForm({ ...form, valor: e.target.value })}
                required
              />
              <Input
                label="Data da Compra"
                type="date"
                value={form.data}
                onChange={e => setForm({ ...form, data: e.target.value })}
                required
              />
            </div>

            <Button type="submit" variante="perigo" loading={loading} className="w-full mt-2">
              Registrar Despesa
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
