import { useState } from 'react'
import { X } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

const CORES = [
  '#FF6B9D', // Rosa
  '#7C3AED', // Roxo
  '#4ADE80', // Verde
  '#FFB400', // Laranja
  '#38BDF8', // Azul claro
  '#F43F5E', // Vermelho rosado
  '#8B5CF6', // Violeta
  '#14B8A6', // Teal
]

export default function ModalCategoria({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CORES[0])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/estoque/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cor, ordem: 99 }), // Ordem padrão pro final
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success('Categoria criada com sucesso!')
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erro ao criar categoria')
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
          <h2 className="font-semibold text-base" style={{ color: '#E8E8F0' }}>Nova Categoria</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: '#8888AA' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nome da Categoria *" 
            placeholder="Ex: Iluminação" 
            value={nome} 
            onChange={e => setNome(e.target.value)} 
            required 
          />

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#8888AA' }}>
              Cor de identificação
            </label>
            <div className="flex flex-wrap gap-2">
              {CORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="w-8 h-8 rounded-full transition-transform active:scale-95 flex items-center justify-center"
                  style={{ 
                    background: c, 
                    border: cor === c ? '2px solid white' : '2px solid transparent',
                    boxShadow: cor === c ? `0 0 10px ${c}88` : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variante="secundario" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
