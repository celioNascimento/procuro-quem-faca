// ─────────────────────────────────────────────────────────────
// types/avaliacao.ts
// Fonte única de verdade para tipos de avaliação.
// Migre gradualmente os tipos espalhados para cá.
// ─────────────────────────────────────────────────────────────

export interface AvaliacaoRaw {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  indica: boolean | null
  resposta_prestador: string | null
  cliente_id: string | null
  status: string | null
  portfolio_projetos: { titulo: string }[] | null
  nota_efetiva: number | null
  cliente_nome: string | null
  cliente_foto_url: string | null
}

export interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  indica: boolean
  resposta_prestador: string | null
  cliente_id: string | null
  status: string | null
  portfolio_projetos: { titulo: string } | null
  nota_efetiva: number | null
  cliente_nome: string | null
  cliente_foto_url: string | null
}

export type AvaliacaoPerfil = {
  id: string
  created_at?: string
  comentario?: string | null
  indica: boolean | null
  projeto_id?: string | null
  portfolio_projetos?: { titulo: string } | null
  cliente_nome?: string | null
  cliente_foto_url?: string | null
}

export interface AvaliacaoResumo {
  nota: number
  nota_efetiva: number | null
}

export interface AvaliacoesStats {
  media: number
  total: number
  totalIndica: number
  distribuicao: Record<number, number>
  exibir: boolean
}

export interface AvaliacaoInsertPayload {
  projeto_id: string
  prestador_id: string
  nota: number
  comentario: string
  indica: boolean
  visivel: boolean
  status: string
  cliente_nome?: string | null
  cliente_foto_url?: string | null
}

export interface FotoOrdenada {
  id: string
  url_foto: string
  ordem: number
  legenda?: string
  label?: string
}

export interface Comentario {
  id: string
  foto_id: string
  projeto_id: string
  autor_tipo: 'cliente' | 'prestador'
  texto: string
  criado_at: string
}

export interface Projeto {
  id: string
  titulo: string
  status: string
  prestador_id: string
  cliente_nome: string
  cliente_foto_url?: string | null
  portfolio_fotos: FotoOrdenada[]
  prestadores: {
    nome: string
    foto_perfil: string
    whatsapp: string
    slug: string | null
    categoria: { nome: string }
  }
  [key: string]: unknown
}