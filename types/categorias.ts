export interface Grupo {
  id: string | number
  nome: string
  slug: string
  icone?: string | null
  ordem?: number | null
  created_at?: string | null
}

export interface Categoria {
  id: string | number
  nome: string
  slug: string
  grupo_id?: string | number | null
  destaque?: boolean
  created_at?: string | null
}

export interface Habilidade {
  nome: string
  categoria?: string
}
