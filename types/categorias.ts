//types/categorias.ts

export interface Grupo {
  id: string | number;
  nome: string;
}

export interface Categoria {
  id: string | number;
  nome: string;
  grupo_id?: string | number;
}

export interface Habilidade {
  nome: string;
  categoria?: string;
}