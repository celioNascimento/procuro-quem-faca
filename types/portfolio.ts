export interface PrestadorBase {
  nome: string
  foto: string | null
  whatsapp: string
}

export interface FotoPortfolio {
  id: string
  projeto_id: string
  url_foto: string
  ordem: number
  legenda?: string
  prestador_id: number
}

export interface ComentarioPortfolio {
  id: string
  foto_id: string
  texto: string
  autor_tipo: string
  criado_at: string
}

export interface ProjetoIdentificado {
  id: string
  titulo: string
  status: string
  cliente_nome: string
  created_at: string
}