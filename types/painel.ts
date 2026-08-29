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

export interface SolicitacaoGarantiaResumo {
  id: string
  status: string
  origem: 'cliente' | 'prestador'
  prazo_resposta: string | null
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
  // Trazido via left join em painelCliente.service.ts — array vazio quando
  // o projeto não tem nenhum caso de garantia. Usado por temGarantiaAtiva/
  // filtrarComGarantiaAtiva para derivar o status de garantia sem consulta
  // separada.
  solicitacoes_garantia: SolicitacaoGarantiaResumo[]
  // Fluxo sem foto obrigatória — travado na criação do projeto (ver
  // migration portfolio_projetos.sem_fotos). Quando true, o ServicoCard
  // não mostra o bloco de foto de capa (nunca vai existir).
  sem_fotos?: boolean
}
