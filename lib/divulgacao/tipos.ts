// lib/divulgacao/tipos.ts

/** Tudo o que os materiais de divulgação precisam saber do prestador (mesma base do perfil público). */
export interface DadosDivulgacao {
  id: number
  nome: string
  slug: string | null
  categoria: string | null
  cidade: string | null
  verificado: boolean
  whatsapp: string | null
  fotoPerfilUrl: string | null
  /** Indicações de clientes (avaliações visíveis com indica = true). A prova social é esta, não nota média. */
  totalIndicacoes: number
  totalConcluidos: number
  garantiaDias: number
  /** Melhores fotos do portfólio (uma por serviço concluído), até 4. */
  fotosPortfolio: string[]
}

export type FormatoCartao = '1:1' | '4:3' | '9:16'
