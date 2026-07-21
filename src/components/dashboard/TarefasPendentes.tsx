'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Circle, CheckCircle2 } from 'lucide-react'
import { labelData } from '@/lib/utils'
import { toast } from 'sonner'
import { Card } from '@/components/ui'

type ChecklistItem = {
  id: string
  descricao: string
  prazo: string | null
  evento_id: string
  concluido: boolean
  evento?: { nome: string }
}

export default function TarefasPendentes({ avisosIniciais }: { avisosIniciais: ChecklistItem[] }) {
  const [avisos, setAvisos] = useState<ChecklistItem[]>(avisosIniciais)

  async function concluirTarefa(item: ChecklistItem) {
    // Remover instantaneamente da UI (Optimistic UI)
    setAvisos(prev => prev.filter(a => a.id !== item.id))
    toast.success('Tarefa concluída! 🎉')

    const res = await fetch('/api/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, concluido: true }),
    })

    if (!res.ok) {
      toast.error('Erro ao marcar tarefa. Tente novamente.')
      // Se der erro, colocar de volta (Rollback)
      setAvisos(prev => [item, ...prev].sort((a, b) => (a.prazo || '') > (b.prazo || '') ? 1 : -1))
    }
  }

  const hoje = new Date().toISOString().split('T')[0]

  if (avisos.length === 0) {
    return (
      <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all fade-in"
           style={{ background: '#4ADE8015', border: '1px dashed #4ADE8044' }}>
        <span className="text-3xl mb-2">🎉</span>
        <h3 className="text-sm font-bold" style={{ color: '#4ADE80' }}>Tudo limpo!</h3>
        <p className="text-xs mt-1" style={{ color: '#8888AA' }}>
          Nenhuma pendência para os próximos dias.
        </p>
      </div>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
          Tarefas Pendentes
          <span className="ml-2 text-xs font-normal" style={{ color: '#8888AA' }}>
            {avisos.length} pendente{avisos.length !== 1 ? 's' : ''}
          </span>
        </h2>
      </div>

      <div className="space-y-1">
        {avisos.map(aviso => {
          const atrasado = aviso.prazo && aviso.prazo < hoje
          const hojeMesmo = aviso.prazo === hoje

          return (
            <div key={aviso.id} 
                 className="flex items-center gap-3 py-2 px-1 border-b last:border-0 group transition-colors hover:bg-white/5 rounded-lg"
                 style={{ borderColor: '#2A2A38' }}>
              
              <button onClick={() => concluirTarefa(aviso)} 
                      className="flex-shrink-0 transition-transform active:scale-95 group-hover:scale-105 ml-1">
                <Circle size={22} style={{ color: '#3A3A50' }} className="group-hover:text-green-500 transition-colors" />
              </button>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#E8E8F0' }}>
                  {aviso.descricao}
                </p>
                <div className="flex items-center gap-1.5 text-xs truncate mt-0.5" style={{ color: '#8888AA' }}>
                  <Link href={`/eventos/${aviso.evento_id}`} className="hover:underline hover:text-pink-400 transition-colors truncate max-w-[150px]">
                    {aviso.evento?.nome}
                  </Link>
                  <span>•</span>
                  <span style={{ color: atrasado ? '#F87171' : (hojeMesmo ? '#FFB400' : '#8888AA'), fontWeight: atrasado || hojeMesmo ? 600 : 400 }}>
                    {atrasado ? 'Atrasado' : hojeMesmo ? 'Vence hoje' : `Vence ${labelData(aviso.prazo)}`}
                  </span>
                </div>
              </div>
              
            </div>
          )
        })}
      </div>
    </Card>
  )
}
