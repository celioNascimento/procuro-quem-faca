//types/prestador.ts

export type AtivacaoStatus =
  | 'nao_enviado'
  | 'enviado'
  | 'respondeu_positivo'
  | 'respondeu_negativo'
  | 'sem_whatsapp'
  | 'perfil_completo'
  | 'avaliacao_recebida';

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
  cidades?: { id?: string; nome: string; estado_sigla: string; regiao_id: string } | null;
  categorias?: { id?: string; nome: string } | null;
  ativacao_status?: AtivacaoStatus;

  // Colunas próprias do prestador (FK), presentes mesmo sem o join carregado.
  // Aceita string | number pois PrestadorFormData (abaixo) redeclara esses
  // campos como string | number — union precisa ser compatível nos dois tipos.
  cidade_id?: string | number | null;
  categoria_id?: string | number | null;

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