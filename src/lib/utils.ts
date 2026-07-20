import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export function formatarData(data: string, formato = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(data), formato, { locale: ptBR })
  } catch {
    return data
  }
}

export function formatarDataLonga(data: string): string {
  try {
    return format(parseISO(data), "EEEE, dd 'de' MMMM", { locale: ptBR })
  } catch {
    return data
  }
}

export function formatarHora(hora?: string): string {
  if (!hora) return ''
  return hora.slice(0, 5)
}

export function labelData(data: string): string {
  try {
    const d = parseISO(data)
    if (isToday(d)) return 'Hoje'
    if (isTomorrow(d)) return 'Amanhã'
    const diff = differenceInDays(d, new Date())
    if (diff > 0 && diff <= 7) return `Em ${diff} dias`
    return format(d, "dd/MM", { locale: ptBR })
  } catch {
    return data
  }
}

export function diasParaEvento(data: string): number {
  try {
    return differenceInDays(parseISO(data), new Date())
  } catch {
    return 0
  }
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()
}

export function telWhatsapp(telefone: string): string {
  const limpo = telefone.replace(/\D/g, '')
  return `https://wa.me/55${limpo}`
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function mesAtual(): { inicio: string; fim: string } {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fim: format(fim, 'yyyy-MM-dd'),
  }
}
