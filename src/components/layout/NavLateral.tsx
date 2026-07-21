'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, PartyPopper,
  Users, Package, DollarSign, LogOut, Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, iniciais } from '@/lib/utils'
import type { Perfil } from '@/types'

const NAV_ITEMS = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/eventos',   icon: PartyPopper,     label: 'Eventos'   },
  { href: '/agenda',    icon: Calendar,         label: 'Agenda'    },
  { href: '/clientes',  icon: Users,            label: 'Clientes'  },
  { href: '/estoque',   icon: Package,          label: 'Estoque'   },
  { href: '/financeiro',icon: DollarSign,       label: 'Financeiro'},
]

export default function NavLateral({ perfil }: { perfil: Perfil | null }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full border-r"
         style={{ background: '#1A1A24', borderColor: '#2A2A38' }}>
      
      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-8 border-b" style={{ borderColor: '#2A2A38' }}>
        <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
          {/* Fundo de LED */}
          <div className="absolute inset-0 rounded-full animate-pulse"
               style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.35) 0%, rgba(255,180,0,0.15) 70%, transparent 100%)', filter: 'blur(16px)' }}>
          </div>
          {/* Logo animada premium */}
          <img src="/logo.png" alt="Realiza Festa" className="relative z-10 w-24 h-24 object-cover rounded-3xl overflow-hidden shadow-2xl drop-shadow-xl animate-float" style={{ border: '2px solid rgba(255,255,255,0.05)' }} />
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-lg leading-tight"
             style={{ background: 'linear-gradient(90deg, #FF6B9D, #FFB400)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Realiza Festa
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#8888AA' }}>Gestão de eventos</p>
        </div>
      </div>

      {/* Itens */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const ativo = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                ativo
                  ? 'text-white'
                  : 'hover:bg-white/5'
              )}
              style={ativo ? {
                background: 'linear-gradient(90deg, #FF6B9D22, #FFB40011)',
                color: '#FF6B9D',
                borderLeft: '3px solid #FF6B9D',
              } : { color: '#8888AA' }}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: '#2A2A38' }}>
        <Link href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
          style={{ color: '#8888AA' }}>
          <Settings size={18} />
          Configurações
        </Link>

        {/* Perfil do usuário */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl"
             style={{ background: '#0F0F14' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #FF6B9D, #FFB400)', color: '#0F0F14' }}>
            {perfil ? iniciais(perfil.nome) : 'RF'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#E8E8F0' }}>
              {perfil?.nome || 'Usuário'}
            </p>
            <p className="text-xs capitalize" style={{ color: '#8888AA' }}>
              {perfil?.papel || 'operacional'}
            </p>
          </div>
          <button onClick={sair} className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Sair" style={{ color: '#8888AA' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
