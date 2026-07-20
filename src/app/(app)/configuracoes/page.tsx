'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, Input, Button, SectionHeader } from '@/components/ui'
import { toast } from 'sonner'
import { LogOut, Plus, Trash2 } from 'lucide-react'
import type { CategoriaEstoque } from '@/types'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([])
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', cor: '#FF6B9D' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/estoque/categorias').then(r => r.json()).then(setCategorias)
  }, [])

  async function adicionarCategoria(e: React.FormEvent) {
    e.preventDefault()
    if (!novaCategoria.nome.trim()) return
    setLoading(true)
    const res = await fetch('/api/estoque/categorias', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novaCategoria.nome, cor: novaCategoria.cor, icone: 'package' }),
    })
    if (res.ok) {
      toast.success('Categoria adicionada!')
      setNovaCategoria({ nome: '', cor: '#FF6B9D' })
      fetch('/api/estoque/categorias').then(r => r.json()).then(setCategorias)
    }
    setLoading(false)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-5 fade-in">
      <SectionHeader titulo="Configurações" />

      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#FF6B9D' }}>
          Categorias do Estoque
        </h2>
        <div className="space-y-2 mb-4">
          {categorias.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                 style={{ borderColor: '#2A2A38' }}>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.cor }} />
              <span className="flex-1 text-sm" style={{ color: '#E8E8F0' }}>{cat.nome}</span>
            </div>
          ))}
        </div>
        <form onSubmit={adicionarCategoria} className="flex gap-2">
          <input value={novaCategoria.nome} onChange={e => setNovaCategoria(p => ({ ...p, nome: e.target.value }))}
            placeholder="Nova categoria..." className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: '#0F0F14', border: '1px solid #2A2A38', color: '#E8E8F0' }} />
          <input type="color" value={novaCategoria.cor}
            onChange={e => setNovaCategoria(p => ({ ...p, cor: e.target.value }))}
            className="w-10 h-10 rounded-xl cursor-pointer border-0"
            style={{ background: 'transparent', padding: 2 }} />
          <Button type="submit" loading={loading} tamanho="sm">
            <Plus size={16} />
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#8888AA' }}>Conta</h2>
        <button onClick={sair}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl w-full"
          style={{ background: '#F8717122', color: '#F87171', border: '1px solid #F8717144' }}>
          <LogOut size={16} /> Sair da conta
        </button>
      </Card>

      <p className="text-center text-xs" style={{ color: '#3A3A50' }}>
        Realiza Festa © {new Date().getFullYear()} — feito com 💕
      </p>
    </div>
  )
}
