// types/perfil.ts

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

// Resumo público de garantia — apenas resultado final e fotos de resolução.
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
  urlRetorno: string
}
