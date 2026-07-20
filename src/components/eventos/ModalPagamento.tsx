'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, Select } from '@/components/ui'
import { formatarMoeda } from '@/lib/utils'
import type { Evento } from '@/types'
import { toast } from 'sonner'

interface Props {
  tipo: 'sinal' | 'final'
  evento: Evento
  onClose: () => void
  onSuccess: () => void
}

export default function ModalPagamento({ tipo, evento, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [forma, setForma] = useState(evento.forma_pagamento)

  const valor = tipo === 'sinal' ? evento.valor_sinal : evento.valor_total - evento.valor_sinal
  const titulo = tipo === 'sinal' ? 'Registrar Sinal Recebido' : 'Registrar Pagamento Final'
  const emoji = tipo === 'sinal' ? '💳' : '🎉'

  async function confirmar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/eventos/${evento.id}/pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, data, forma }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(json.mensagem)
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
           style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>
            {emoji} {titulo}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: '#8888AA' }}>
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl p-4 text-center"
             style={{ background: tipo === 'sinal' ? '#FFB40018' : '#4ADE8018',
                      border: `1px solid ${tipo === 'sinal' ? '#FFB40044' : '#4ADE8044'}` }}>
          <p className="text-xs mb-1" style={{ color: '#8888AA' }}>Valor a receber</p>
          <p className="text-3xl font-bold font-display"
             style={{ color: tipo === 'sinal' ? '#FFB400' : '#4ADE80' }}>
            {formatarMoeda(valor)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#8888AA' }}>{evento.nome}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8888AA' }}>
              Data do recebimento
            </label>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: '#0F0F14', border: '1px solid #2A2A38', color: '#E8E8F0' }} />
          </div>
          <Select label="Forma de pagamento" value={forma} onChange={e => setForma(e.target.value as never)}>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao">Cartão</option>
            <option value="transferencia">Transferência</option>
          </Select>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variante="secundario" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={confirmar}>
            Confirmar recebimento
          </Button>
        </div>
      </div>
    </div>
  )
}
