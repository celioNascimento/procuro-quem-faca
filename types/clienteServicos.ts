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

// Adicionado para derivar garantia ativa localmente (via temGarantiaAtiva em
// cliente.service.ts), eliminando a necessidade de fetchClienteGarantias separado
// e o risco de dessincronia entre dois arrays de origens diferentes.
// LEFT JOIN em fetchClienteServicos garante array vazio [] quando não há garantia,
// em vez de excluir o projeto da lista.
export interface SolicitacaoGarantiaResumo {
  id: string
  status: string
  origem: 'cliente' | 'prestador'
  // 'garantia' | 'reclamacao' — ver comentário em CasoGarantia
  // (hooks/useCasoGarantiaDoProjeto.ts) para o significado completo.
  tipo: 'garantia' | 'reclamacao'
  prazo_resposta: string | null
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
  // Array vazio quando não há garantia (LEFT JOIN). Nunca undefined após a query.
  solicitacoes_garantia: SolicitacaoGarantiaResumo[]
  // Fluxo sem foto obrigatória — travado na criação do projeto (ver migration
  // portfolio_projetos.sem_fotos). Quando true, "pronto para avaliar" é
  // derivado de marcado_concluido_at em vez de portfolio_fotos.some(ordem===3).
  sem_fotos?: boolean
  marcado_concluido_at?: string | null
}
