// ============================================================
// REALIZA FESTA — Tipos globais
// ============================================================

export type Papel = 'admin' | 'operacional'

export interface Perfil {
  id: string
  nome: string
  telefone?: string
  papel: Papel
  criado_em: string
}

// ────────────────────────────────────────────────────────────
// ESTOQUE
// ────────────────────────────────────────────────────────────
export interface CategoriaEstoque {
  id: string
  nome: string
  cor: string
  icone: string
  ordem: number
  criado_em: string
}

export type EstadoItem = 'disponivel' | 'manutencao' | 'baixado'

export interface ItemEstoque {
  id: string
  categoria_id: string
  categoria?: CategoriaEstoque
  nome: string
  descricao?: string
  quantidade: number
  foto_url?: string
  estado: EstadoItem
  criado_em: string
  atualizado_em: string
}

// ────────────────────────────────────────────────────────────
// CLIENTES
// ────────────────────────────────────────────────────────────
export interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  observacoes?: string
  criado_em: string
  // Calculado no front
  total_eventos?: number
  ultimo_evento?: string
}

// ────────────────────────────────────────────────────────────
// EVENTOS
// ────────────────────────────────────────────────────────────
export type TipoEvento =
  | 'aniversario'
  | 'cha_revelacao'
  | 'cha_fralda'
  | 'casamento'
  | 'formatura'
  | 'corporativo'
  | 'outro'

export type StatusEvento =
  | 'orcamento'
  | 'confirmado'
  | 'sinal_recebido'
  | 'preparacao'
  | 'montagem'
  | 'concluido'
  | 'cancelado'

export type TipoEntrega = 'leva_monta' | 'leva_sem_monta' | 'busca_cliente'
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao' | 'transferencia'

export interface Evento {
  id: string
  cliente_id?: string
  cliente?: Cliente
  nome: string
  tipo_evento: TipoEvento
  data_evento: string
  hora_inicio?: string
  hora_montagem?: string
  local_nome?: string
  local_endereco?: string
  tema?: string
  cores?: string[]
  tipo_entrega: TipoEntrega
  status: StatusEvento
  valor_total: number
  valor_decoracao?: number
  valor_brinquedos?: number
  valor_frete?: number
  valor_sinal: number
  sinal_recebido: boolean
  data_sinal?: string
  pagamento_final: boolean
  data_pagamento_final?: string
  forma_pagamento: FormaPagamento
  observacoes?: string
  fotos_inspiracao?: string[]
  criado_em: string
  atualizado_em: string
  // Relacionamentos
  alocacoes?: AlocacaoEvento[]
  checklist?: ChecklistItem[]
}

// ────────────────────────────────────────────────────────────
// ALOCAÇÕES E CHECKLIST
// ────────────────────────────────────────────────────────────
export interface AlocacaoEvento {
  id: string
  evento_id: string
  item_id: string
  item?: ItemEstoque
  quantidade: number
  confirmado: boolean
  observacao?: string
  criado_em: string
}

export interface ChecklistItem {
  id: string
  evento_id: string
  descricao: string
  concluido: boolean
  prazo?: string
  criado_em: string
}

// ────────────────────────────────────────────────────────────
// FINANCEIRO
// ────────────────────────────────────────────────────────────
export type TipoLancamento = 'entrada' | 'saida'
export type CategoriaLancamento =
  | 'evento_sinal'
  | 'evento_final'
  | 'material'
  | 'frete'
  | 'marketing'
  | 'manutencao'
  | 'outros'

export interface Lancamento {
  id: string
  tipo: TipoLancamento
  valor: number
  descricao: string
  categoria: CategoriaLancamento
  evento_id?: string
  evento?: Evento
  data: string
  comprovante_url?: string
  criado_em: string
}

export interface ResumoFinanceiro {
  receita_mes: number
  custos_mes: number
  lucro_mes: number
  a_receber: number
  eventos_mes: number
  ticket_medio: number
  receita_breakdown?: {
    decoracao: number
    brinquedos: number
    frete: number
    outros: number
  }
}

// ────────────────────────────────────────────────────────────
// CRM — LEADS
// ────────────────────────────────────────────────────────────
export type TipoLead = TipoEvento
export type StatusLead = 'aberto' | 'contatado' | 'convertido' | 'ignorado'

export interface Lead {
  id: string
  cliente_id?: string
  cliente?: Cliente
  evento_origem_id?: string
  evento_origem?: Evento
  tipo_sugerido: TipoLead
  data_estimada?: string
  descricao?: string
  status: StatusLead
  criado_em: string
}

// ────────────────────────────────────────────────────────────
// UTILS
// ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export const STATUS_LABELS: Record<StatusEvento, string> = {
  orcamento:      'Orçamento',
  confirmado:     'Confirmado',
  sinal_recebido: 'Sinal Recebido',
  preparacao:     'Preparação',
  montagem:       'Montagem',
  concluido:      'Concluído',
  cancelado:      'Cancelado',
}

export const STATUS_CORES: Record<StatusEvento, string> = {
  orcamento:      '#8888AA',
  confirmado:     '#FFB400',
  sinal_recebido: '#4ADE80',
  preparacao:     '#FF6B9D',
  montagem:       '#7C3AED',
  concluido:      '#4ADE80',
  cancelado:      '#F87171',
}

export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  aniversario:   '🎂 Aniversário',
  cha_revelacao: '🎀 Chá Revelação',
  cha_fralda:    '👶 Chá de Fraldas',
  casamento:     '💍 Casamento',
  formatura:     '🎓 Formatura',
  corporativo:   '🏢 Corporativo',
  outro:         '🎉 Outro',
}
