import type { Prestador } from './prestador'

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
  avaliacoes: { id: string; indica: boolean }[]
}

export interface AvaliacaoPerfil {
  id: string
  nota: number
  comentario?: string
  indica: boolean
  created_at: string
}

export interface PrestadorPerfil extends Omit<Prestador, 'cidades' | 'categorias'> {
  cidades?: { nome: string; estado_sigla: string } | null
  categorias?: { nome: string } | null
  portfolio_projetos?: ProjetoPerfil[]
}

export interface PerfilData {
  prestador: PrestadorPerfil
  projetos: ProjetoPerfil[]
  avaliacoes: AvaliacaoPerfil[]
  urlRetorno: string
}