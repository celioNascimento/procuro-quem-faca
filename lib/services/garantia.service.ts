// lib/services/garantia.service.ts
//
// Fluxo de Garantia — PQF
// -------------------------------------------------------------
// origem='cliente': cliente relata problema dentro da janela de garantia
//   do prestador (portfolio_projetos.data_conclusao + prestadores.garantia_dias)
//   OU, quando o prestador não oferece garantia formal (garantia_dias = 0),
//   dentro de uma janela fixa de reclamação (DIAS_RECLAMACAO, 15 dias
//   corridos). O campo solicitacoes_garantia.tipo ('garantia'|'reclamacao')
//   registra qual dos dois caminhos originou o caso — mesma máquina de
//   estados, só muda o prazo de elegibilidade e a linguagem exibida.
//   status: aberta -> respondida -> resolvida
//                   -> sem_resposta (prazo de 5 dias úteis estourado, via rotina diária)
//
// origem='prestador': prestador reage a avaliação negativa oferecendo reparo.
//   Só existe no fluxo 'garantia' — reclamação nunca tem essa origem, já
//   que por definição o prestador não oferece garantia formal nesse caso.
//   status: aguardando_aceite_cliente -> (cliente aceita) -> aberta -> ...
//                                     -> (cliente recusa) -> recusada
//   Limite: 1 oferta por avaliação (constraint uq_solicitacoes_garantia_oferta_unica_por_avaliacao).
//
// SEGURANÇA: toda mudança de estado passa por funções do banco (garantia_*), que conferem
// quem está chamando, o estado atual do caso e os limites de texto. A tabela
// solicitacoes_garantia NÃO aceita INSERT/UPDATE direto do navegador (só SELECT), então
// nada aqui monta payload de status/nota: o banco decide. Ver migração
// 20261115195534_garantia_funcoes_seguras e documentacao/docs/09-avaliacao-acompanhamento.md.
//
// Efeito em avaliação resolvida com sucesso: seta avaliacoes.oculta_por_garantia = true
// e avaliacoes.resolvido_via_garantia_id. NÃO toca em visivel/status/nota/indica
// (esses campos pertencem ao fluxo de contestação e devem permanecer intocados).
// -------------------------------------------------------------

import { supabase } from '@/lib/supabase';

export type OrigemGarantia = 'cliente' | 'prestador';

export type TipoGarantia = 'garantia' | 'reclamacao';

export type StatusGarantia =
  | 'aguardando_aceite_cliente'
  | 'aberta'
  | 'respondida'
  | 'sem_resposta'
  | 'resolvida'
  | 'recusada';

// Janela fixa para o cliente abrir uma reclamação quando o prestador não
// oferece garantia formal (garantia_dias = 0). Dias corridos, contados a
// partir de portfolio_projetos.data_conclusao — mais curta que a maioria
// das garantias configuráveis, pensada para problemas notados logo após
// o serviço (ex: 15 dias é generoso para maioria dos serviços, mas não
// carrega o sistema com reclamações de meses atrás).
const DIAS_RECLAMACAO = 15;

interface AbrirCasoClienteInput {
  projetoId: string;
  descricaoProblema: string;
  // Fotos NÃO entram aqui — são anexadas depois via garantia_fotos
  // (inserirFotoGarantia em garantiaWizard.service.ts), já que a tabela
  // exige caso_id, que só existe após a abertura retornar.
}

interface OferecerReparoPrestadorInput {
  avaliacaoId: string;
  descricaoProblema: string; // proposta do prestador
}

export type CasoGarantiaRetorno = {
  id: string;
  projeto_id: string;
  prestador_id: number;
  cliente_user_id: string;
  origem: OrigemGarantia;
  tipo: TipoGarantia;
  status: StatusGarantia;
  prazo_resposta: string | null;
  descricao_problema: string;
  resposta_prestador_garantia: string | null;
  data_resposta: string | null;
  resolucao_descricao: string | null;
  data_resolucao: string | null;
  avaliacao_id: string | null;
  nota_resultante: number | null;
  created_at: string;
};

const MENSAGEM_PADRAO = 'Não foi possível concluir agora. Tente novamente em instantes.';

/**
 * As funções do banco avisam o motivo com `raise exception` (código P0001) e em português
 * ("O prazo para abrir este caso já terminou."): essas mensagens são feitas para a pessoa ler.
 * Qualquer outro erro (rede, permissão) vira uma frase genérica — nunca texto técnico na tela.
 */
function erroDaFuncao(error: { code?: string; message?: string }): Error {
  return new Error(error.code === 'P0001' && error.message ? error.message : MENSAGEM_PADRAO);
}

async function chamar(
  funcao: string,
  args: Record<string, unknown>,
): Promise<CasoGarantiaRetorno> {
  const { data, error } = await supabase.rpc(funcao, args);
  if (error) throw erroDaFuncao(error);
  return data as CasoGarantiaRetorno;
}

/**
 * Verifica se um projeto ainda está dentro da janela de garantia OU
 * reclamação do prestador. Elegibilidade requer:
 *  - portfolio_projetos.status === 'finalizado'
 *  - data_conclusao preenchida
 *  - hoje <= data_conclusao + janela (garantia_dias se > 0, senão
 *    DIAS_RECLAMACAO fixo)
 *
 * O 'tipo' retornado ('garantia' ou 'reclamacao') é decidido aqui, a
 * partir de garantia_dias do prestador — não é uma escolha do cliente.
 *
 * Esta função só serve para a TELA decidir o que mostrar. Quem vale de verdade é
 * garantia_abrir_caso, no banco, que refaz a conta (e confere o dono do projeto).
 */
export async function verificarElegibilidadeGarantia(projetoId: string) {

  const { data: projeto, error: projetoError } = await supabase
    .from('portfolio_projetos')
    .select('id, status, data_conclusao, prestador_id, cliente_user_id')
    .eq('id', projetoId)
    .single();

  if (projetoError || !projeto) {
    return { elegivel: false, motivo: 'projeto_nao_encontrado' as const };
  }

  if (projeto.status !== 'finalizado') {
    return { elegivel: false, motivo: 'projeto_nao_finalizado' as const };
  }

  if (!projeto.data_conclusao) {
    return { elegivel: false, motivo: 'sem_data_conclusao' as const };
  }

  const { data: prestador, error: prestadorError } = await supabase
    .from('prestadores')
    .select('id, garantia_dias')
    .eq('id', projeto.prestador_id)
    .single();

  if (prestadorError || !prestador) {
    return { elegivel: false, motivo: 'prestador_nao_encontrado' as const };
  }

  const temGarantiaFormal = !!prestador.garantia_dias && prestador.garantia_dias > 0;
  const tipo: TipoGarantia = temGarantiaFormal ? 'garantia' : 'reclamacao';
  const janelaDias = temGarantiaFormal ? prestador.garantia_dias! : DIAS_RECLAMACAO;

  const dataLimite = new Date(projeto.data_conclusao);
  dataLimite.setDate(dataLimite.getDate() + janelaDias);

  const dentroDoPrazo = new Date() <= dataLimite;

  return {
    elegivel: dentroDoPrazo,
    motivo: dentroDoPrazo ? ('ok' as const) : ('fora_do_prazo' as const),
    tipo,
    projeto,
    prestador,
    dataLimite,
  };
}

/** Cliente abre um caso de garantia ou reclamação. O tipo e o prazo (5 dias úteis) são decididos no banco. */
export function abrirCasoGarantiaCliente(input: AbrirCasoClienteInput) {
  return chamar('garantia_abrir_caso', {
    p_projeto_id: input.projetoId,
    p_descricao: input.descricaoProblema,
  });
}

/**
 * Prestador oferece reparo em reação a avaliação negativa. O caso nasce em
 * 'aguardando_aceite_cliente' e só fica ativo quando o cliente aceita. Sempre tipo='garantia'
 * (exige garantia configurada no perfil — o banco confere).
 */
export function oferecerReparoPrestador(input: OferecerReparoPrestadorInput) {
  return chamar('garantia_oferecer_reparo', {
    p_avaliacao_id: input.avaliacaoId,
    p_descricao: input.descricaoProblema,
  });
}

/** Cliente aceita a oferta de reparo do prestador — ativa o caso e inicia o prazo. */
export function aceitarOfertaReparo(casoId: string) {
  return chamar('garantia_aceitar_oferta', { p_caso_id: casoId });
}

/** Cliente recusa a oferta — não conta como "sem resposta" para o prestador. */
export function recusarOfertaReparo(casoId: string) {
  return chamar('garantia_recusar_oferta', { p_caso_id: casoId });
}

/** Prestador responde a um caso aberto. Só o prestador dono do caso consegue (o banco confere). */
export function responderCasoGarantia(casoId: string, resposta: string) {
  return chamar('garantia_responder', { p_caso_id: casoId, p_resposta: resposta });
}

/**
 * Cliente confirma que o problema foi resolvido — fecha o caso com sucesso, em UMA operação no
 * banco (caso + avaliação juntos: ou grava tudo ou nada).
 *
 * Nota resultante:
 *  - origem='cliente': a nota nova (1-5) informada pelo cliente passa a valer como nota_efetiva.
 *  - origem='prestador': sempre 3 — o prestador não pode "comprar" 5 estrelas resolvendo o
 *    próprio erro. Quem garante isso agora é o banco, não a tela.
 * avaliacoes.nota NUNCA é sobrescrita — só nota_efetiva muda.
 */
export function confirmarResolucaoGarantia(
  casoId: string,
  resolucaoDescricao: string,
  fotosResolucao: string[],
  novaNota?: number, // obrigatório quando origem='cliente'; ignorado quando origem='prestador'
) {
  return chamar('garantia_confirmar_resolucao', {
    p_caso_id: casoId,
    p_descricao: resolucaoDescricao,
    p_fotos: fotosResolucao,
    p_nova_nota: novaNota ?? null,
  });
}

/**
 * Cliente indica que a resposta do prestador NÃO resolveu: o caso volta para 'aberta' com novo
 * prazo de 5 dias úteis e a resposta anterior é apagada (o prestador precisa registrar outra).
 */
export function reabrirCasoGarantia(casoId: string) {
  return chamar('garantia_reabrir', { p_caso_id: casoId });
}

// A rotina que marca "sem resposta" quando o prazo estoura NÃO fica mais aqui: ela precisa rodar
// sem ninguém logado. É a função garantia_processar_vencidos() do banco, chamada todos os dias por
// app/api/cron/garantia-prazos/route.ts (ver doc 09).
