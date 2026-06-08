import { Cidade } from './localizacao';

export type Prestador = {
  id: number;                // bigint no Supabase → number no TS
  slug: string | null;
  nome: string;
  whatsapp: string;
  foto_perfil: string | null;
  origem_tipo: 'vitrine' | 'proprio' | 'reivindicado' | 'curadoria_publica';
  verificado: boolean;
  habilidades: string[];
  bairro?: string;
  bio?: string;
  cidades_atendidas?: string[];
  cidades?: { nome: string; estado_sigla: string; regiao_id: string } | null;
  categorias?: { nome: string } | null;

  // Computados
  cidade_nome: string;
  categoria: string;
  media_nota: number;
  total_avals: number;
};

// Interface usada para o formulário (input)
export interface PrestadorFormData extends Omit<Prestador, 'id' | 'cidades' | 'categorias' | 'cidade_nome' | 'categoria' | 'media_nota' | 'total_avals'> {
  id: number | null;
  grupo_id: string | number;
  categoria_id: string | number;
  estado_sigla: string;
  regiao_id: string | number;
  cidade_id: string | number;
  status?: string;
}