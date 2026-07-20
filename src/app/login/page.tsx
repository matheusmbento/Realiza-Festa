'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      toast.error('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
         style={{ background: 'linear-gradient(135deg, #0F0F14 0%, #1A0A1F 100%)' }}>
      
      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center">
        <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
          {/* Fundo de LED */}
          <div className="absolute inset-0 rounded-full animate-pulse"
               style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.45) 0%, rgba(255,180,0,0.2) 70%, transparent 100%)', filter: 'blur(24px)' }}>
          </div>
          {/* Logo animada */}
          <img src="/logo.png" alt="Realiza Festa" className="relative z-10 w-32 h-32 object-cover rounded-[1.5rem] shadow-2xl drop-shadow-2xl animate-float" style={{ border: '2px solid rgba(255,255,255,0.05)' }} />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight"
            style={{ background: 'linear-gradient(90deg, #FF6B9D, #FFB400)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Realiza Festa
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8888AA' }}>Gestão de eventos e decoração</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl p-6"
           style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
        <h2 className="text-lg font-semibold mb-6" style={{ color: '#E8E8F0' }}>
          Entrar na conta
        </h2>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8888AA' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seuemail@email.com"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#0F0F14',
                border: '1px solid #2A2A38',
                color: '#E8E8F0',
              }}
              onFocus={e => e.target.style.borderColor = '#FF6B9D'}
              onBlur={e => e.target.style.borderColor = '#2A2A38'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#8888AA' }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: '#0F0F14',
                border: '1px solid #2A2A38',
                color: '#E8E8F0',
              }}
              onFocus={e => e.target.style.borderColor = '#FF6B9D'}
              onBlur={e => e.target.style.borderColor = '#2A2A38'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 font-semibold text-sm transition-opacity mt-2"
            style={{
              background: 'linear-gradient(90deg, #FF6B9D, #FFB400)',
              color: '#0F0F14',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="text-xs mt-8" style={{ color: '#3A3A50' }}>
        Realiza Festa © {new Date().getFullYear()}
      </p>
    </div>
  )
}
