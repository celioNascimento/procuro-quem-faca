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
}

export interface PrestadorPerfil extends Omit<Prestador, 'cidades' | 'categorias'> {
  cidades?: { nome: string; estado_sigla: string } | null
  categorias?: { nome: string } | null
  portfolio_projetos?: ProjetoPerfil[]
}

export interface PerfilData {
  prestador: PrestadorPerfil
  projetos: ProjetoPerfil[]
  avaliacoes: AvaliacaoPerfil[] // <- Adicionado aqui
  urlRetorno: string
}