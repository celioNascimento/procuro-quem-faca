// lib/services/garantia.service.ts
//
// Fluxo de Garantia — PQF
// -------------------------------------------------------------
// ESCRITAS: todas passam por POST /api/garantia/acao, que chama uma função do banco
// (garantia_abrir_caso, garantia_responder, ...). O banco confere quem é a pessoa (auth.uid())
// e se a mudança de status é permitida — o navegador não grava mais direto na tabela.
// Os prazos (5 dias úteis, 15 dias de reclamação) e as notas (3 neutra, 1 sem resposta) vivem no banco.
// -------------------------------------------------------------
// origem='cliente': cliente relata problema dentro da janela de garantia
//   do prestador (portfolio_projetos.data_conclusao + prestadores.garantia_dias)
//   OU, quando o prestador não oferece garantia formal (garantia_dias = 0),
//   dentro de uma janela fixa de reclamação (DIAS_RECLAMACAO, 15 dias
//   corridos). O campo solicitacoes_garantia.tipo ('garantia'|'reclamacao')
//   registra qual dos dois caminhos originou o caso — mesma máquina de
//   estados, só muda o prazo de elegibilidade e a linguagem exibida.
//   status: aberta -> respondida -> resolvida
//                   -> sem_resposta (prazo de 5 dias úteis estourado, via cron diário)
//
// origem='prestador': prestador reage a avaliação negativa oferecendo reparo.
//   Só existe no fluxo 'garantia' — reclamação nunca tem essa origem, já
//   que por definição o prestador não oferece garantia formal nesse caso.
//   status: aguardando_aceite_cliente -> (cliente aceita) -> aberta -> ...
//                                     -> (cliente recusa) -> recusada
//   Limite: 1 oferta por avaliação (constraint uq_solicitacoes_garantia_oferta_unica_por_avaliacao).
//
// Efeito em avaliação resolvida com sucesso: seta avaliacoes.oculta_por_garantia = true
// e avaliacoes.resolvido_via_garantia_id. NÃO toca em visivel/status/nota/indica
// (esses campos pertencem ao fluxo de contestação e devem permanecer intocados).
// -------------------------------------------------------------

import { supabase } from '@/lib/supabase';
import type { AcaoGarantia, PedidoGarantia } from '@/lib/garantia/acoes';

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
// partir de portfolio_projetos.data_conclusao. A regra valendo é a do banco
// (garantia_abrir_caso); esta constante só serve para a tela avisar antes.
const DIAS_RECLAMACAO = 15;

export class ErroGarantia extends Error {}

/** Envia uma ação do fluxo para a rota autenticada e devolve o caso atualizado. */
async function executar<T = Record<string, unknown>>(pedido: PedidoGarantia & { acao: AcaoGarantia }): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch('/api/garantia/acao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
  } catch {
    throw new ErroGarantia('Sem conexão. Verifique a internet e tente de novo.');
  }
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new ErroGarantia(json?.error ?? 'Não foi possível concluir. Tente novamente.');
  return json as T;
}

export interface CasoRetornado {
  id: string;
  status: StatusGarantia;
  origem: OrigemGarantia;
  tipo: TipoGarantia;
  [chave: string]: unknown;
}

/**
 * Verifica se um projeto ainda está dentro da janela de garantia OU
 * reclamação do prestador (só leitura, para a tela decidir o que mostrar).
 * A regra que vale na hora de abrir é a do banco.
 *
 * O 'tipo' retornado ('garantia' ou 'reclamacao') é decidido aqui, a
 * partir de garantia_dias do prestador — não é uma escolha do cliente.
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

/** Cliente abre um caso de garantia ou reclamação. O tipo e o prazo são decididos pelo banco. */
export async function abrirCasoGarantiaCliente(input: { projetoId: string; descricaoProblema: string }) {
  return executar<CasoRetornado>({ acao: 'abrir', projetoId: input.projetoId, texto: input.descricaoProblema });
}

/**
 * Prestador oferece reparo em reação a avaliação negativa.
 * Cria caso em 'aguardando_aceite_cliente' — NÃO fica ativo até o cliente aceitar.
 * Sempre tipo='garantia' (o banco exige garantia configurada no perfil).
 */
export async function oferecerReparoPrestador(input: { avaliacaoId: string; descricao: string }) {
  return executar<CasoRetornado>({ acao: 'oferecer', avaliacaoId: input.avaliacaoId, texto: input.descricao });
}

/** Cliente aceita a oferta de reparo — ativa o caso e inicia o prazo. */
export async function aceitarOfertaReparo(casoId: string) {
  return executar<CasoRetornado>({ acao: 'aceitar', casoId });
}

/** Cliente recusa a oferta — não conta como sem_resposta para o prestador. */
export async function recusarOfertaReparo(casoId: string) {
  return executar<CasoRetornado>({ acao: 'recusar', casoId });
}

/** Prestador responde a um caso aberto. */
export async function responderCasoGarantia(casoId: string, resposta: string) {
  return executar<CasoRetornado>({ acao: 'responder', casoId, texto: resposta });
}

/**
 * Cliente confirma que o problema foi resolvido — fecha o caso, e a nota da avaliação muda
 * na mesma transação do banco:
 *  - origem='cliente': vale a nota nova informada (1-5);
 *  - origem='prestador': nota neutra 3 (o prestador não "compra" 5 estrelas) e a avaliação original é ocultada.
 * avaliacoes.nota NUNCA é sobrescrita — só nota_efetiva muda.
 */
export async function confirmarResolucaoGarantia(
  casoId: string,
  resolucaoDescricao: string,
  fotosResolucao: string[],
  novaNota?: number, // obrigatório quando origem='cliente'; ignorado quando origem='prestador'
) {
  return executar<CasoRetornado>({
    acao: 'confirmar',
    casoId,
    texto: resolucaoDescricao,
    fotos: fotosResolucao,
    nota: novaNota,
  });
}

/**
 * Cliente indica que a resposta do prestador NÃO resolveu o problema: o caso volta para 'aberta',
 * com novo prazo de 5 dias úteis, e a resposta anterior é apagada.
 */
export async function reabrirCasoGarantia(casoId: string) {
  return executar<CasoRetornado>({ acao: 'reabrir', casoId });
}
