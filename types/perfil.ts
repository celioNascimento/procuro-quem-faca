// types/perfil.ts

import type { Prestador } from './prestador'
export type { AvaliacaoPerfil } from './avaliacao'

export interface FotoProjeto {
  id: string      
  url_foto: string
  ordem: number
  legenda?: string
}

export interface ProjetoPerfil {
  id: string
  titulo: string
  descricao?: string
  status: 'em_execucao' | 'finalizado'
  created_at: string
  portfolio_fotos: FotoProjeto[]
  avaliacoes: { id: string; indica: boolean; comentario?: string | null }[]
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
