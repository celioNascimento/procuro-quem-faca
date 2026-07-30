//app/(admin)/admin/geografia/types/geografia.ts

export type Estado = {
  sigla: string
  nome: string
}

export type Regiao = {
  id: string
  nome: string
  estado_sigla: string
}

export type Cidade = {
  id: string
  nome: string
  estado_sigla: string
  regiao_id: string | null
  ativa: boolean
  regioes: { nome: string } | null
}