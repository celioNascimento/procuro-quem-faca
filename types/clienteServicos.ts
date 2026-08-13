// types/clienteServicos.ts
//
// Tipo específico para o formato retornado por fetchClienteServicos
// (lib/services/cliente.service.ts), consumido por useServicosCliente e
// pela tela app/painel/perfil/page.tsx. Deliberadamente separado de
// types/painel.ts (usado por usePainelCliente/app/meus-servicos) porque
// são hooks e queries paralelos e independentes, com formatos de retorno
// diferentes — não a mesma fonte de dados.

export interface CategoriaServico {
  nome: string
}

export interface PrestadorServico {
  id: string | number // bigint no Supabase — necessário para resolver praça (cidade_id/categoria_id) em queries pontuais
  nome: string
  foto_perfil: string | null
  categoria: CategoriaServico | null
}

export interface PortfolioFotoOrdem {
  ordem: number
}

export interface AvaliacaoRef {
  id: string
}

export interface ClienteServico {
  id: string
  titulo: string
  status: string
  created_at: string
  avaliacao_token: string
  portfolio_fotos: PortfolioFotoOrdem[]
  prestadores: PrestadorServico | null
  avaliacoes: AvaliacaoRef[]
}