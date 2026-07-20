'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Input, Select, Textarea, Button } from '@/components/ui'
import type { ItemEstoque, CategoriaEstoque } from '@/types'
import { toast } from 'sonner'

interface Props {
  item: ItemEstoque | null
  categorias: CategoriaEstoque[]
  onClose: () => void
  onSuccess: () => void
}

export default function ModalItemEstoque({ item, categorias, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: item?.nome ?? '',
    descricao: item?.descricao ?? '',
    categoria_id: item?.categoria_id ?? categorias[0]?.id ?? '',
    quantidade: String(item?.quantidade ?? 1),
    estado: item?.estado ?? 'disponivel',
  })

  function campo(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, quantidade: parseInt(form.quantidade) || 1 }
      const res = item
        ? await fetch(`/api/estoque/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/estoque', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(item ? 'Item atualizado!' : 'Item adicionado!')
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function excluir() {
    if (!item || !confirm('Remover este item do estoque?')) return
    await fetch(`/api/estoque/${item.id}`, { method: 'DELETE' })
    toast.success('Item removido')
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
           style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>
            {item ? 'Editar item' : 'Novo item de estoque'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: '#8888AA' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={salvar} className="space-y-3">
          <Input label="Nome do item *" value={form.nome} onChange={e => campo('nome', e.target.value)}
            placeholder="Ex: Painel Redondo 2,20m" required />
          <Select label="Categoria" value={form.categoria_id} onChange={e => campo('categoria_id', e.target.value)}>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantidade" type="number" value={form.quantidade}
              onChange={e => campo('quantidade', e.target.value)} min="0" />
            <Select label="Estado" value={form.estado} onChange={e => campo('estado', e.target.value)}>
              <option value="disponivel">Disponível</option>
              <option value="manutencao">Manutenção</option>
              <option value="baixado">Baixado</option>
            </Select>
          </div>
          <Textarea label="Descrição" value={form.descricao} onChange={e => campo('descricao', e.target.value)}
            placeholder="Detalhes do item..." rows={2} />
          <div className="flex gap-2 pt-1">
            {item && (
              <Button type="button" variante="perigo" tamanho="sm" onClick={excluir}>
                <Trash2 size={14} />
              </Button>
            )}
            <Button type="button" variante="secundario" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {item ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
