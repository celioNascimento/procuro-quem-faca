// ─────────────────────────────────────────────────────────────
// types/avaliacao.ts
// Fonte única de verdade para tipos de avaliação.
// Migre gradualmente os tipos espalhados para cá.
// ─────────────────────────────────────────────────────────────

// ── Formato bruto retornado pelo Supabase (relações como array) ──
export interface AvaliacaoRaw {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  indica: boolean
  resposta_prestador: string | null
  cliente_id: string | null
  portfolio_projetos: { titulo: string }[] | null
}

// ── Formato normalizado para uso nos componentes ──
export interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  created_at: string
  indica: boolean
  resposta_prestador: string | null
  cliente_id: string | null
  status: string | null                          // 'pendente' | 'finalizado'
  portfolio_projetos: { titulo: string } | null
}

// ── Formato usado no perfil público (types/perfil.ts) ──
export interface AvaliacaoPerfil {
  id: string
  nota: number
  comentario?: string
  indica: boolean
  created_at: string
}

// ── Formato resumido — só o necessário para cálculo de stats ──
export interface AvaliacaoResumo {
  nota: number
}

// ── Stats calculados pelo calcularStats() ──
export interface AvaliacoesStats {
  media: number
  total: number
  totalIndica: number
  distribuicao: Record<number, number>  // nota 1–5 → quantidade
  exibir: boolean                       // true somente quando total >= 10
}

// ── Payload para inserção no Supabase ──
export interface AvaliacaoInsertPayload {
  projeto_id: string
  prestador_id: string
  nota: number
  comentario: string
  indica: boolean
  visivel: boolean
  status: string
}

// ── Tipos do hook useAvaliacao (página de acompanhamento) ──

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
  portfolio_fotos: FotoOrdenada[]
  prestadores: {
    nome: string
    foto_perfil: string
    whatsapp: string
    categoria: { nome: string }
  }
  [key: string]: unknown
}