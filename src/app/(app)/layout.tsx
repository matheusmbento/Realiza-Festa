import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavLateral from '@/components/layout/NavLateral'
import NavBottom from '@/components/layout/NavBottom'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex min-h-screen" style={{ background: '#0F0F14' }}>
      {/* Sidebar — visível apenas em telas grandes */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <NavLateral perfil={perfil} />
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — apenas mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe">
        <NavBottom />
      </nav>
    </div>
  )
}
