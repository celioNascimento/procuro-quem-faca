//types/localizacao.ts

export interface Regiao {
  id: string
  nome: string
  estado_sigla: string | null
}

export interface Cidade {
  id: string
  nome: string
  estado_sigla: string | null
  regiao_id: string | null
  ativa: boolean
  regioes?: Regiao | null // Relacionamento
}

// Extensão rápida para quando precisarmos do nome da cidade junto com o prestador
export interface CidadeResumo {
  nome: string
  estado_sigla: string
}