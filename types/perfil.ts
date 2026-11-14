// types/perfil.ts

import { AvaliacaoPerfil } from './avaliacao'
import type { Prestador } from './prestador'
export type { AvaliacaoPerfil } from './avaliacao'

export interface FotoProjeto {
  id: string
  url_foto: string
  ordem: number
  legenda?: string
}

export interface FotoGarantiaPublica {
  id: string
  url_foto: string   // URL completa do bucket público — usável diretamente em <img src>
  ordem: number
  legenda: string | null
  fase: 'problema' | 'resolucao'
  publica: boolean
}

// Resumo público de garantia — apenas o suficiente para exibir o resultado
// na vitrine do prestador. Dados sensíveis (prazo, cliente_user_id etc.)
// ficam fora do perfil público. Apenas resultado final e fotos de resolução.
// Fotos de problema são privadas e nunca aparecem aqui.
export interface GarantiaPublica {
  id: string
  status: string
  origem: 'cliente' | 'prestador'
  descricao_problema: string
  resposta_prestador_garantia: string | null
  resolucao_descricao: string | null
  nota_resultante: number | null
  fotos: FotoGarantiaPublica[]   // só fotos de resolução promovidas (publica=true)
}

export interface ProjetoPerfil {
  id: string
  titulo: string
  descricao?: string
  status: 'em_execucao' | 'finalizado'
  created_at: string
  portfolio_fotos: FotoProjeto[]
  avaliacoes: { id: string; indica: boolean; comentario?: string | null }[]
  // LEFT JOIN — array vazio quando não há garantia
  solicitacoes_garantia: GarantiaPublica[]
  // Fluxo sem foto obrigatória — travado na criação do projeto (ver
  // migration portfolio_projetos.sem_fotos). Quando true, o card de
  // avaliação não abre o ProjetoModal (não há fotos para mostrar).
  sem_fotos?: boolean
}

// Campos internos (cliques, dono da conta) nunca vão para o perfil público. O funil de ativação e o motivo
// de bloqueio ficam em tabelas próprias (prestador_ativacao e prestador_bloqueio), só para admin e dono.
type CamposInternos = 'user_id' | 'cliques_whatsapp'

export interface PrestadorPerfil extends Omit<Prestador, 'cidades' | 'categorias' | CamposInternos> {
  cidades?: { nome: string; estado_sigla: string } | null
  categorias?: {
    nome: string
    /** Área da categoria; só o ícone interessa ao perfil. */
    categorias_grupos?: { icone?: string | null } | { icone?: string | null }[] | null
  } | null
  portfolio_projetos?: ProjetoPerfil[]
  sessao_fotos?: { titulo: string; fotos: string[] } | null
}

export interface PerfilData {
  prestador: PrestadorPerfil
  projetos: ProjetoPerfil[]
  avaliacoes: AvaliacaoPerfil[] // <- Adicionado aqui
  /** Total de indicações de clientes (avaliações visíveis com indica = true), sem o limite da lista. */
  totalIndicacoes: number
  urlRetorno: string
}
