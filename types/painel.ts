//types/painel.ts

export interface Categoria {
  nome: string
}

export interface Prestador {
  id: string | number      // bigint no Supabase — vem no join (SELECT_SERVICOS pede 'id'), faltava no tipo
  nome: string
  foto_perfil: string | null
  whatsapp: string
  slug?: string | null
  user_id?: string | null

  categoria: Categoria | null
}

export interface PortfolioFoto {
  id: string
  ordem: number
  url_foto: string
}

export interface Servico {
  id: string
  titulo: string
  status: string
  created_at: string
  avaliacao_token: string
  cliente_nome: string
  cliente_whatsapp: string
  prestadores: Prestador | null
  portfolio_fotos: PortfolioFoto[]
}