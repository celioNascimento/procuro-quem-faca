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
//                   -> sem_resposta (prazo de 5 dias úteis estourado, via cron)
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
  clienteUserId: string;
  descricaoProblema: string;
  // Fotos NÃO entram aqui — são anexadas depois via garantia_fotos
  // (inserirFotoGarantia em garantiaWizard.service.ts), já que a tabela
  // exige caso_id, que só existe após este insert retornar.
}

interface OferecerReparoPrestadorInput {
  avaliacaoId: string;
  projetoId: string;
  prestadorId: number;
  clienteUserId: string;
  descricaoProblema: string; // proposta do prestador
}

/**
 * Calcula data limite somando N dias úteis (seg-sex) a partir de hoje.
 * Não considera feriados (nacional/municipal) — decisão consciente, ver docs.
 */
function calcularPrazoUteis(diasUteis: number, base: Date = new Date()): Date {
  const data = new Date(base);
  let restantes = diasUteis;
  while (restantes > 0) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      restantes--;
    }
  }
  return data;
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

/**
 * Cliente abre um caso de garantia ou reclamação — fluxo padrão.
 * O tipo é decidido por verificarElegibilidadeGarantia, não recebido
 * como parâmetro — evita que o cliente (ou um bug de UI) force o tipo
 * errado no insert.
 */
export async function abrirCasoGarantiaCliente(input: AbrirCasoClienteInput) {

  const elegibilidade = await verificarElegibilidadeGarantia(input.projetoId);
  if (!elegibilidade.elegivel || !elegibilidade.projeto || !elegibilidade.tipo) {
    throw new Error(`Projeto não elegível para garantia: ${elegibilidade.motivo}`);
  }

  // Confere que o solicitante é de fato o cliente do projeto
  if (elegibilidade.projeto.cliente_user_id !== input.clienteUserId) {
    throw new Error('Apenas o cliente vinculado a este projeto pode abrir este caso.');
  }

  const prazoResposta = calcularPrazoUteis(5);

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .insert({
      projeto_id: input.projetoId,
      prestador_id: elegibilidade.projeto.prestador_id,
      cliente_user_id: input.clienteUserId,
      origem: 'cliente',
      tipo: elegibilidade.tipo,
      status: 'aberta',
      prazo_resposta: prazoResposta.toISOString().slice(0, 10),
      descricao_problema: input.descricaoProblema,
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: notificar prestador (reaproveitar padrão QStash usado nos lembretes do Lev)

  return data;
}

/**
 * Prestador oferece reparo em reação a avaliação negativa.
 * Cria caso em status 'aguardando_aceite_cliente' — NÃO fica ativo até o cliente aceitar.
 *
 * Sempre tipo='garantia': esta origem só existe quando o prestador tem
 * garantia formal configurada (é o próprio prestador oferecendo reparo
 * dentro do compromisso que ele assumiu) — reclamação nunca passa por aqui.
 */
export async function oferecerReparoPrestador(input: OferecerReparoPrestadorInput) {

  // valida que a avaliação pertence de fato a esse prestador/projeto
  const { data: avaliacao, error: avaliacaoError } = await supabase
    .from('avaliacoes')
    .select('id, prestador_id, projeto_id, cliente_id, indica, oculta_por_garantia')
    .eq('id', input.avaliacaoId)
    .single();

  if (avaliacaoError || !avaliacao) {
    throw new Error('Avaliação não encontrada.');
  }

  if (avaliacao.prestador_id !== input.prestadorId) {
    throw new Error('Avaliação não pertence a este prestador.');
  }

  if (avaliacao.oculta_por_garantia) {
    throw new Error('Esta avaliação já foi resolvida via garantia anteriormente.');
  }

  // a unique constraint (avaliacao_id, origem) já impede duplicidade no banco,
  // mas validamos antes pra dar um erro amigável
  const { data: ofertaExistente } = await supabase
    .from('solicitacoes_garantia')
    .select('id')
    .eq('avaliacao_id', input.avaliacaoId)
    .eq('origem', 'prestador')
    .maybeSingle();

  if (ofertaExistente) {
    throw new Error('Você já ofereceu reparo para esta avaliação anteriormente.');
  }

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .insert({
      projeto_id: input.projetoId,
      prestador_id: input.prestadorId,
      cliente_user_id: input.clienteUserId,
      avaliacao_id: input.avaliacaoId,
      origem: 'prestador',
      tipo: 'garantia',
      status: 'aguardando_aceite_cliente',
      descricao_problema: input.descricaoProblema,
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: notificar cliente que o prestador quer oferecer reparo

  return data;
}

/**
 * Cliente aceita a oferta de reparo do prestador — ativa o caso e inicia o prazo.
 */
export async function aceitarOfertaReparo(casoId: string, clienteUserId: string) {

  const prazoResposta = calcularPrazoUteis(5);

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .update({
      status: 'aberta',
      prazo_resposta: prazoResposta.toISOString().slice(0, 10),
    })
    .eq('id', casoId)
    .eq('cliente_user_id', clienteUserId)
    .eq('status', 'aguardando_aceite_cliente')
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cliente recusa a oferta — tira o peso do prestador (não conta como sem_resposta).
 */
export async function recusarOfertaReparo(casoId: string, clienteUserId: string) {

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .update({ status: 'recusada' })
    .eq('id', casoId)
    .eq('cliente_user_id', clienteUserId)
    .eq('status', 'aguardando_aceite_cliente')
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Prestador responde a um caso aberto (dentro do prazo).
 */
export async function responderCasoGarantia(
  casoId: string,
  prestadorId: number,
  resposta: string,
) {

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .update({
      status: 'respondida',
      resposta_prestador_garantia: resposta,
      data_resposta: new Date().toISOString(),
    })
    .eq('id', casoId)
    .eq('prestador_id', prestadorId)
    .eq('status', 'aberta')
    .select()
    .single();

  if (error) throw error;
  return data;
}

const NOTA_NEUTRA_REPARO_PRESTADOR = 3;
const NOTA_AUTOMATICA_SEM_RESPOSTA = 1;

/**
 * Cliente confirma que o problema foi resolvido — fecha o caso com sucesso.
 *
 * Regras de nota_efetiva/nota_resultante:
 *  - origem='cliente': cliente informa uma nota nova (novaNota), que passa
 *    a valer como nota_efetiva da avaliação vinculada, se houver. Vale
 *    tanto para tipo='garantia' quanto tipo='reclamacao'.
 *  - origem='prestador': nota é sempre NOTA_NEUTRA_REPARO_PRESTADOR (3),
 *    nunca a critério do prestador — não pode "comprar" 5 estrelas
 *    resolvendo o próprio erro. Só ocorre em tipo='garantia' (reclamação
 *    nunca tem origem='prestador').
 *
 * avaliacoes.nota NUNCA é sobrescrita — só nota_efetiva muda.
 */
export async function confirmarResolucaoGarantia(
  casoId: string,
  clienteUserId: string,
  resolucaoDescricao: string,
  fotosResolucao: string[],
  novaNota?: number, // obrigatório quando origem='cliente'; ignorado quando origem='prestador'
) {

  const { data: casoAtual, error: casoAtualError } = await supabase
    .from('solicitacoes_garantia')
    .select('id, origem, avaliacao_id, status')
    .eq('id', casoId)
    .eq('cliente_user_id', clienteUserId)
    .single();

  if (casoAtualError || !casoAtual) throw new Error('Caso não encontrado.');
  if (casoAtual.status !== 'respondida') {
    throw new Error('Só é possível confirmar resolução de um caso que já foi respondido.');
  }

  let notaResultante: number;
  if (casoAtual.origem === 'prestador') {
    notaResultante = NOTA_NEUTRA_REPARO_PRESTADOR;
  } else {
    if (!novaNota || novaNota < 1 || novaNota > 5) {
      throw new Error('É necessário informar uma nota válida (1-5) ao confirmar a resolução.');
    }
    notaResultante = novaNota;
  }

  const { data: caso, error: casoError } = await supabase
    .from('solicitacoes_garantia')
    .update({
      status: 'resolvida',
      resolucao_descricao: resolucaoDescricao,
      fotos_resolucao: fotosResolucao,
      data_resolucao: new Date().toISOString(),
      nota_resultante: notaResultante,
    })
    .eq('id', casoId)
    .select()
    .single();

  if (casoError) throw casoError;

  // Se há avaliação vinculada, atualiza nota_efetiva (nunca avaliacoes.nota).
  // Para origem='prestador', também oculta a avaliação original da vitrine pública.
  if (caso.avaliacao_id) {
    const updatePayload: Record<string, unknown> = {
      nota_efetiva: notaResultante,
    };

    if (caso.origem === 'prestador') {
      updatePayload.oculta_por_garantia = true;
      updatePayload.resolvido_via_garantia_id = caso.id;
    }

    const { error: avaliacaoError } = await supabase
      .from('avaliacoes')
      .update(updatePayload)
      .eq('id', caso.avaliacao_id);

    if (avaliacaoError) throw avaliacaoError;
  }

  return caso;
}

/**
 * Cliente indica que a resposta do prestador NÃO resolveu o problema.
 * Reabre o caso: volta para status 'aberta' e reinicia o prazo de 5 dias
 * úteis — o prestador precisa responder de novo, como se fosse um novo ciclo.
 * Não altera nota_resultante nem mexe em avaliação vinculada; isso só
 * acontece quando o caso finalmente fecha (resolvida ou sem_resposta).
 */
export async function reabrirCasoGarantia(casoId: string, clienteUserId: string) {
  const prazoResposta = calcularPrazoUteis(5);

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .update({
      status: 'aberta',
      prazo_resposta: prazoResposta.toISOString().slice(0, 10),
      // Limpa a resposta anterior — o prestador precisa registrar uma nova
      // proposta, não deixar a antiga "pendurada" como se ainda valesse.
      resposta_prestador_garantia: null,
      data_resposta: null,
    })
    .eq('id', casoId)
    .eq('cliente_user_id', clienteUserId)
    .eq('status', 'respondida')
    .select()
    .single();

  if (error) throw error;

  // TODO: notificar prestador que o caso foi reaberto

  return data;
}

/**
 * Job de cron — marca como 'sem_resposta' casos abertos cujo prazo estourou.
 * Aplica nota_resultante = 1 automaticamente e, se houver avaliação vinculada,
 * atualiza nota_efetiva também. Isso vale tanto para origem='cliente' quanto
 * origem='prestador' (prestador ignorar a própria oferta de reparo é ainda pior),
 * e para ambos os tipos (garantia e reclamacao) — o prazo de resposta do
 * prestador (5 dias úteis) é o mesmo independente do tipo do caso.
 */
export async function processarCasosVencidos() {
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: vencidos, error } = await supabase
    .from('solicitacoes_garantia')
    .update({
      status: 'sem_resposta',
      nota_resultante: NOTA_AUTOMATICA_SEM_RESPOSTA,
    })
    .eq('status', 'aberta')
    .lt('prazo_resposta', hoje)
    .select('id, prestador_id, avaliacao_id');

  if (error) throw error;

  // Propaga nota_efetiva=1 para avaliações vinculadas, quando houver
  const comAvaliacao = (vencidos ?? []).filter((c) => c.avaliacao_id);
  if (comAvaliacao.length > 0) {
    await Promise.all(
      comAvaliacao.map((c) =>
        supabase
          .from('avaliacoes')
          .update({ nota_efetiva: NOTA_AUTOMATICA_SEM_RESPOSTA })
          .eq('id', c.avaliacao_id as string),
      ),
    );
  }

  // TODO: aplicar selo negativo visível no perfil por prestador_id
  // TODO: notificar cliente do resultado

  return vencidos;
}
