export type AtivacaoStatus =
  | 'nao_enviado'
  | 'enviado'
  | 'respondeu_positivo'
  | 'respondeu_negativo'
  | 'sem_whatsapp'
  | 'perfil_completo'
  | 'avaliacao_recebida';

// Garantia declarada pelo prestador no perfil — postura comercial, não
// substitui a garantia legal do CDC (que se aplica sempre, independente
// deste valor). 0 = nenhuma garantia declarada.
export type GarantiaDias = 0 | 30 | 60 | 90;

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

  // Joins carregados via select
  cidades?: { id?: string; nome: string; estado_sigla: string; regiao_id: string } | null;
  categorias?: {
    id?: string;
    nome: string;
    grupo_id?: string | null;
    categorias_grupos?: { id: string; nome: string } | null;
  } | null;
  regioes?: { id: string; nome: string } | null;

  ativacao_status?: AtivacaoStatus;
  garantia_dias?: GarantiaDias;

  // Colunas próprias do prestador (FK), presentes mesmo sem o join carregado.
  cidade_id?: string | number | null;
  categoria_id?: string | number | null;
  estado_sigla?: string;
  regiao_id?: string | null;
  grupo_id?: string | null;

  // Computados no normalizados.map() do usePrestadores
  cidade_nome: string;
  categoria: string;
  media_nota: number;
  total_avals: number;
  regiao_nome?: string;   // vem de regioes.nome
  grupo_nome?: string;    // vem de categorias.categorias_grupos.nome
};

// Interface usada para o formulário (input)
export interface PrestadorFormData extends Omit<
  Prestador,
  'id' | 'cidades' | 'categorias' | 'regioes' | 'cidade_nome' | 'categoria' | 'media_nota' | 'total_avals' | 'regiao_nome' | 'grupo_nome'
> {
  id: number | null;
  grupo_id: string | number;
  categoria_id: string | number;
  estado_sigla: string;
  regiao_id: string | number;
  cidade_id: string | number;
  status?: string;
}
