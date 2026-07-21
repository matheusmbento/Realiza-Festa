import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import type { Cliente } from '@/types'

interface Props {
  value: string
  onChange: (val: string) => void
  clientes: Cliente[]
}

export default function SelectCliente({ value, onChange, clientes }: Props) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clienteSelecionado = clientes.find(c => c.id === value)
  const labelSelecionado = clienteSelecionado ? clienteSelecionado.nome : 'Selecionar cliente...'

  const filtrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (c.telefone && c.telefone.includes(busca))
  )

  return (
    <div className="space-y-1.5 relative" ref={ref}>
      <label className="block text-sm font-medium" style={{ color: '#8888AA' }}>
        Cliente
      </label>
      
      <div 
        onClick={() => setAberto(!aberto)}
        className="w-full rounded-xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-colors"
        style={{ 
          background: '#0F0F14', 
          border: `1px solid ${aberto ? '#FF6B9D' : '#2A2A38'}`, 
          color: value ? '#E8E8F0' : '#8888AA' 
        }}
      >
        <span className="truncate pr-4">{labelSelecionado}</span>
        <ChevronDown size={16} style={{ color: '#8888AA' }} />
      </div>

      {aberto && (
        <div className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden shadow-2xl"
             style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
          <div className="p-2 border-b" style={{ borderColor: '#2A2A38' }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8888AA' }} />
              <input 
                autoFocus
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                style={{ background: '#0F0F14', color: '#E8E8F0', border: '1px solid #2A2A38' }}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto hide-scrollbar p-1">
            <button
              type="button"
              onClick={() => { onChange(''); setAberto(false); setBusca('') }}
              className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between"
              style={{ color: value === '' ? '#FF6B9D' : '#8888AA' }}
            >
              Sem cliente vinculado
              {value === '' && <Check size={14} />}
            </button>
            
            <div className="my-1 border-t" style={{ borderColor: '#2A2A38' }} />

            {filtrados.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setAberto(false); setBusca('') }}
                className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-white/5 transition-colors flex items-center justify-between"
                style={{ color: value === c.id ? '#FF6B9D' : '#E8E8F0' }}
              >
                <div>
                  <p>{c.nome}</p>
                  {c.telefone && <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>{c.telefone}</p>}
                </div>
                {value === c.id && <Check size={14} />}
              </button>
            ))}

            {filtrados.length === 0 && (
              <div className="px-3 py-6 text-center text-sm" style={{ color: '#8888AA' }}>
                Nenhum cliente encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
