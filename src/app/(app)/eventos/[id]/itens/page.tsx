'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, Check } from 'lucide-react'
import { Card, Badge, Button, Loading } from '@/components/ui'
import type { ItemEstoque, CategoriaEstoque } from '@/types'
import { toast } from 'sonner'
import Link from 'next/link'

interface AlocacaoExistente { item_id: string; quantidade: number; id: string }

export default function AdicionarItensEvento() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([])
  const [alocados, setAlocados] = useState<AlocacaoExistente[]>([])
  const [busca, setBusca] = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [selecionados, setSelecionados] = useState<Record<string, number>>({})

  const carregar = useCallback(async () => {
    const [itRes, catRes, evRes] = await Promise.all([
      fetch('/api/estoque').then(r => r.json()),
      fetch('/api/estoque/categorias').then(r => r.json()),
      fetch(`/api/eventos/${id}`).then(r => r.json()),
    ])
    setItens(itRes)
    setCategorias(catRes)
    const existentes: AlocacaoExistente[] = (evRes.alocacoes ?? [])
    setAlocados(existentes)
    const sel: Record<string, number> = {}
    existentes.forEach((a: AlocacaoExistente) => { sel[a.item_id] = a.quantidade })
    setSelecionados(sel)
    setLoading(false)
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  const itensFiltrados = itens.filter(it =>
    (!catFiltro || it.categoria_id === catFiltro) &&
    (!busca || it.nome.toLowerCase().includes(busca.toLowerCase()))
  )

  function alterarQtd(itemId: string, delta: number) {
    setSelecionados(prev => {
      const atual = prev[itemId] ?? 0
      const novo = Math.max(0, atual + delta)
      if (novo === 0) { const { [itemId]: _, ...rest } = prev; return rest }
      return { ...prev, [itemId]: novo }
    })
  }

  async function salvar() {
    setSalvando(true)
    try {
      // Remover alocações que foram zeradas
      for (const al of alocados) {
        if (!selecionados[al.item_id]) {
          await fetch('/api/alocacoes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: al.id }) })
        }
      }
      // Adicionar/atualizar
      for (const [itemId, qtd] of Object.entries(selecionados)) {
        const existente = alocados.find(a => a.item_id === itemId)
        if (existente) {
          await fetch('/api/alocacoes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: existente.id, quantidade: qtd }) })
        } else {
          await fetch('/api/alocacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evento_id: id, item_id: itemId, quantidade: qtd }) })
        }
      }
      toast.success('Itens salvos!')
      router.push(`/eventos/${id}`)
    } catch { toast.error('Erro ao salvar') }
    finally { setSalvando(false) }
  }

  if (loading) return <Loading />

  const totalSelecionados = Object.keys(selecionados).length

  return (
    <div className="space-y-4 fade-in pb-24">
      <div className="flex items-center gap-3">
        <Link href={`/eventos/${id}`} className="p-2 rounded-xl hover:bg-white/5" style={{ color: '#8888AA' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display text-lg font-bold" style={{ color: '#E8E8F0' }}>
          Adicionar Itens
        </h1>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8888AA' }} />
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar item..."
          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
          style={{ background: '#1A1A24', border: '1px solid #2A2A38', color: '#E8E8F0' }} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCatFiltro('')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
          style={!catFiltro ? { background: '#FF6B9D', color: '#0F0F14' } : { background: '#1A1A24', color: '#8888AA', border: '1px solid #2A2A38' }}>
          Todos
        </button>
        {categorias.map(cat => (
          <button key={cat.id} onClick={() => setCatFiltro(cat.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={catFiltro === cat.id ? { background: cat.cor, color: '#0F0F14' } : { background: '#1A1A24', color: '#8888AA', border: '1px solid #2A2A38' }}>
            {cat.nome}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {itensFiltrados.map(item => {
          const qtd = selecionados[item.id] ?? 0
          const cat = categorias.find(c => c.id === item.categoria_id)
          return (
            <Card key={item.id} style={qtd > 0 ? { border: `1px solid ${cat?.cor ?? '#FF6B9D'}66` } : {}}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: '#E8E8F0' }}>{item.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cat && <Badge color={cat.cor}>{cat.nome}</Badge>}
                    <span className="text-xs" style={{ color: '#8888AA' }}>{item.quantidade} no estoque</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {qtd > 0 ? <>
                    <button onClick={() => alterarQtd(item.id, -1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ background: '#2A2A38', color: '#E8E8F0' }}>−</button>
                    <span className="text-base font-bold w-6 text-center" style={{ color: '#E8E8F0' }}>{qtd}</span>
                    <button onClick={() => alterarQtd(item.id, 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ background: cat?.cor ?? '#FF6B9D', color: '#0F0F14' }}>+</button>
                  </> : (
                    <button onClick={() => alterarQtd(item.id, 1)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: '#1A1A24', color: '#8888AA', border: '1px solid #2A2A38' }}>
                      + Adicionar
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Botão fixo */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-safe" style={{ background: '#0F0F14', borderTop: '1px solid #2A2A38' }}>
        <Button className="w-full" tamanho="lg" loading={salvando} onClick={salvar}>
          <Check size={18} />
          Salvar {totalSelecionados} item{totalSelecionados !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  )
}
