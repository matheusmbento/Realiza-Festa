'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PartyPopper, Calendar, Users, Package, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/',           icon: LayoutDashboard, label: 'Início'    },
  { href: '/eventos',    icon: PartyPopper,     label: 'Eventos'   },
  { href: '/agenda',     icon: Calendar,        label: 'Agenda'    },
  { href: '/clientes',   icon: Users,           label: 'Clientes'  },
  { href: '/estoque',    icon: Package,         label: 'Estoque'   },
  { href: '/financeiro', icon: DollarSign,      label: 'Caixa'     },
]

export default function NavBottom() {
  const path = usePathname()

  return (
    <div className="border-t"
         style={{ background: '#1A1A24', borderColor: '#2A2A38' }}>
      <div className="flex items-center justify-around py-2 px-1">
        {ITEMS.map(({ href, icon: Icon, label }) => {
          const ativo = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[52px]"
              style={ativo ? { color: '#FF6B9D' } : { color: '#8888AA' }}
            >
              <Icon size={22} strokeWidth={ativo ? 2.5 : 1.8} />
              <span className={cn('text-[10px] font-medium', ativo && 'font-semibold')}>
                {label}
              </span>
              {ativo && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#FF6B9D' }} />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
