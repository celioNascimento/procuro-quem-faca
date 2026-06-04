//types/localizacao.ts

export interface Estado {
  sigla: string;
  nome: string;
}

export interface Regiao {
  id: string | number;
  nome: string;
  estado_sigla: string;
}

export interface Cidade {
  id: string | number;
  nome: string;
  regiao_id?: string | number;
  estado_sigla: string;
  ativa?: boolean;
}