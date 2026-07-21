'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Package, Trash } from 'lucide-react'
import { Card, Badge, Button, EmptyState, Loading, SectionHeader } from '@/components/ui'
import type { ItemEstoque, CategoriaEstoque } from '@/types'
import ModalItemEstoque from '@/components/estoque/ModalItemEstoque'
import ModalCategoria from '@/components/estoque/ModalCategoria'
import { toast } from 'sonner'

export default function EstoquePage() {
  const [itens, setItens] = useState<ItemEstoque[]>([])
  const [categorias, setCategorias] = useState<CategoriaEstoque[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [modal, setModal] = useState<ItemEstoque | null | 'novo'>(null)
  const [modalCategoria, setModalCategoria] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (categoriaFiltro) params.set('categoria', categoriaFiltro)
    const [itensRes, catRes] = await Promise.all([
      fetch(`/api/estoque?${params}`).then(r => r.json()),
      fetch('/api/estoque/categorias').then(r => r.json()),
    ])
    setItens(itensRes)
    setCategorias(catRes)
    setLoading(false)
  }, [busca, categoriaFiltro])

  useEffect(() => {
    const t = setTimeout(carregar, 300)
    return () => clearTimeout(t)
  }, [carregar])

  // Agrupar por categoria
  const agrupado = categorias.map(cat => ({
    categoria: cat,
    itens: itens.filter(i => i.categoria_id === cat.id),
  })).filter(g => g.itens.length > 0)

  async function excluirCategoria(id: string) {
    if (!confirm('Deseja realmente excluir esta categoria?')) return
    try {
      const res = await fetch(`/api/estoque/categorias/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erro ao excluir')
      }
      toast.success('Categoria excluída com sucesso!')
      setCategoriaFiltro('')
      carregar()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-5 fade-in">
      <SectionHeader
        titulo="Estoque"
        subtitulo={`${itens.length} item${itens.length !== 1 ? 's' : ''} cadastrados`}
        acao={
          <Button onClick={() => setModal('novo')}>
            <Plus size={16} /> Novo item
          </Button>
        }
      />

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8888AA' }} />
        <input value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar item..." className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
          style={{ background: '#1A1A24', border: '1px solid #2A2A38', color: '#E8E8F0' }}
          onFocus={e => e.target.style.borderColor = '#FF6B9D'}
          onBlur={e => e.target.style.borderColor = '#2A2A38'} />
      </div>

      {/* Filtros de categoria */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        <button onClick={() => setCategoriaFiltro('')}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={!categoriaFiltro ? { background: '#FF6B9D', color: '#0F0F14' } : { background: '#1A1A24', color: '#8888AA', border: '1px solid #2A2A38' }}>
          Todos
        </button>
        {categorias.map(cat => {
          const isSelected = categoriaFiltro === cat.id
          return (
            <button key={cat.id} onClick={() => setCategoriaFiltro(cat.id)}
              className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={isSelected
                ? { background: cat.cor, color: '#0F0F14' }
                : { background: '#1A1A24', color: '#8888AA', border: '1px solid #2A2A38' }}>
              {cat.nome}
              {isSelected && (
                <span 
                  onClick={(e) => { e.stopPropagation(); excluirCategoria(cat.id); }}
                  className="p-1 -mr-1.5 rounded-full hover:bg-black/20 transition-colors"
                  title="Excluir Categoria"
                >
                  <Trash size={12} />
                </span>
              )}
            </button>
          )
        })}
        {/* Botão sutil Nova Categoria */}
        <button onClick={() => setModalCategoria(true)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-110"
          style={{ background: '#1A1A24', color: '#4ADE80', border: '1px solid #4ADE8044', boxShadow: '0 0 10px #4ADE8022' }}>
          + Categoria
        </button>
      </div>

      {loading ? <Loading /> : itens.length === 0 ? (
        <EmptyState icone="📦" titulo="Estoque vazio"
          descricao="Adicione itens para começar a organizar o estoque"
          acao={<Button onClick={() => setModal('novo')}><Plus size={14} /> Adicionar item</Button>} />
      ) : (
        <div className="space-y-5">
          {agrupado.map(({ categoria, itens: itensCat }) => (
            <div key={categoria.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: categoria.cor }} />
                <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>{categoria.nome}</h2>
                <span className="text-xs" style={{ color: '#8888AA' }}>{itensCat.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {itensCat.map(item => (
                  <Card key={item.id} onClick={() => setModal(item)}
                    className="cursor-pointer hover:border-pink-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                           style={{ background: `${categoria.cor}22` }}>
                        <Package size={18} style={{ color: categoria.cor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: '#E8E8F0' }}>{item.nome}</p>
                        {item.descricao && (
                          <p className="text-xs truncate" style={{ color: '#8888AA' }}>{item.descricao}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold font-display" style={{ color: categoria.cor }}>
                          {item.quantidade}
                        </p>
                        <Badge color={item.estado === 'disponivel' ? '#4ADE80' : '#F87171'}>
                          {item.estado === 'disponivel' ? 'OK' : 'Manutenção'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalItemEstoque
          item={modal === 'novo' ? null : modal}
          categorias={categorias}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); carregar() }}
        />
      )}

      {modalCategoria && (
        <ModalCategoria
          onClose={() => setModalCategoria(false)}
          onSuccess={() => { setModalCategoria(false); carregar() }}
        />
      )}
    </div>
  )
}
