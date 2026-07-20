import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

// ────────────────────────────────────────────────────────────
// CARD
// ────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

export function Card({ children, className, onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4',
        onClick && 'cursor-pointer transition-transform active:scale-[0.98]',
        className
      )}
      style={{ background: '#1A1A24', border: '1px solid #2A2A38', ...style }}
    >
      {children}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// BADGE
// ────────────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color = '#FF6B9D', className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ background: `${color}22`, color }}
    >
      {children}
    </span>
  )
}

// ────────────────────────────────────────────────────────────
// BUTTON
// ────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'ghost' | 'perigo'
  tamanho?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variante = 'primario',
  tamanho = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const estilos = {
    primario:   { background: 'linear-gradient(90deg, #FF6B9D, #FFB400)', color: '#0F0F14' },
    secundario: { background: '#2A2A38', color: '#E8E8F0', border: '1px solid #3A3A50' },
    ghost:      { background: 'transparent', color: '#8888AA' },
    perigo:     { background: '#F8717122', color: '#F87171', border: '1px solid #F8717144' },
  }

  const tamanhos = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        tamanhos[tamanho],
        className
      )}
      style={estilos[variante]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : children}
    </button>
  )
}

// ────────────────────────────────────────────────────────────
// INPUT
// ────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  erro?: string
}

export function Input({ label, erro, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium" style={{ color: '#8888AA' }}>
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full rounded-xl px-4 py-3 text-sm outline-none transition-all',
          erro && 'border-red-500',
          className
        )}
        style={{
          background: '#0F0F14',
          border: `1px solid ${erro ? '#F87171' : '#2A2A38'}`,
          color: '#E8E8F0',
        }}
        onFocus={e => !erro && (e.target.style.borderColor = '#FF6B9D')}
        onBlur={e => !erro && (e.target.style.borderColor = '#2A2A38')}
        {...props}
      />
      {erro && <p className="text-xs" style={{ color: '#F87171' }}>{erro}</p>}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// SELECT
// ────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium" style={{ color: '#8888AA' }}>
          {label}
        </label>
      )}
      <select
        className={cn('w-full rounded-xl px-4 py-3 text-sm outline-none', className)}
        style={{
          background: '#0F0F14',
          border: '1px solid #2A2A38',
          color: '#E8E8F0',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// TEXTAREA
// ────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium" style={{ color: '#8888AA' }}>
          {label}
        </label>
      )}
      <textarea
        className={cn('w-full rounded-xl px-4 py-3 text-sm outline-none resize-none', className)}
        style={{ background: '#0F0F14', border: '1px solid #2A2A38', color: '#E8E8F0' }}
        onFocus={e => (e.target.style.borderColor = '#FF6B9D')}
        onBlur={e => (e.target.style.borderColor = '#2A2A38')}
        {...props}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// EMPTY STATE
// ────────────────────────────────────────────────────────────
interface EmptyProps {
  icone?: string
  titulo: string
  descricao?: string
  acao?: ReactNode
}

export function EmptyState({ icone = '📭', titulo, descricao, acao }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icone}</span>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#E8E8F0' }}>{titulo}</h3>
      {descricao && <p className="text-sm mb-4" style={{ color: '#8888AA' }}>{descricao}</p>}
      {acao}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// LOADING
// ────────────────────────────────────────────────────────────
export function Loading({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
           style={{ borderColor: '#FF6B9D', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: '#8888AA' }}>{texto}</p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// SECTION HEADER
// ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  titulo: string
  subtitulo?: string
  acao?: ReactNode
}

export function SectionHeader({ titulo, subtitulo, acao }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-xl font-bold" style={{ color: '#E8E8F0' }}>{titulo}</h1>
        {subtitulo && <p className="text-sm mt-0.5" style={{ color: '#8888AA' }}>{subtitulo}</p>}
      </div>
      {acao}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// STAT CARD
// ────────────────────────────────────────────────────────────
interface StatCardProps {
  icone: string
  label: string
  valor: string
  cor?: string
  sub?: string
}

export function StatCard({ icone, label, valor, cor = '#FF6B9D', sub }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: '#8888AA' }}>{label}</p>
          <p className="text-2xl font-bold font-display" style={{ color: cor }}>{valor}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#8888AA' }}>{sub}</p>}
        </div>
        <span className="text-2xl">{icone}</span>
      </div>
    </Card>
  )
}
