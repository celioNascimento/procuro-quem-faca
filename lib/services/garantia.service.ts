// lib/services/garantia.service.ts
//
// Fluxo de Garantia — PQF
// -------------------------------------------------------------
// origem='cliente': cliente relata problema dentro da janela de garantia
//   do prestador (portfolio_projetos.data_conclusao + prestadores.garantia_dias).
//   status: aberta -> respondida -> resolvida
//                   -> sem_resposta (prazo de 5 dias úteis estourado, via cron)
//
// origem='prestador': prestador reage a avaliação negativa oferecendo reparo.
//   status: aguardando_aceite_cliente -> (cliente aceita) -> aberta -> ...
//                                     -> (cliente recusa) -> recusada
//   Limite: 1 oferta por avaliação (constraint uq_solicitacoes_garantia_oferta_unica_por_avaliacao).
//
// Efeito em avaliação resolvida com sucesso: seta avaliacoes.oculta_por_garantia = true
// e avaliacoes.resolvido_via_garantia_id. NÃO toca em visivel/status/nota/indica
// (esses campos pertencem ao fluxo de contestação e devem permanecer intocados).
// -------------------------------------------------------------

import { createClient } from '@/lib/supabase/server'; // ajustar path conforme padrão real do projeto

export type OrigemGarantia = 'cliente' | 'prestador';

export type StatusGarantia =
  | 'aguardando_aceite_cliente'
  | 'aberta'
  | 'respondida'
  | 'sem_resposta'
  | 'resolvida'
  | 'recusada';

interface AbrirCasoClienteInput {
  projetoId: string;
  clienteUserId: string;
  descricaoProblema: string;
  fotosProblema: string[];
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
 * Verifica se um projeto ainda está dentro da janela de garantia do prestador.
 * Elegibilidade requer:
 *  - portfolio_projetos.status === 'finalizado' (setado quando cliente conclui avaliação)
 *  - data_conclusao preenchida
 *  - hoje <= data_conclusao + prestadores.garantia_dias
 */
export async function verificarElegibilidadeGarantia(projetoId: string) {
  const supabase = createClient();

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

  if (!prestador.garantia_dias || prestador.garantia_dias === 0) {
    return { elegivel: false, motivo: 'prestador_sem_garantia' as const };
  }

  const dataLimite = new Date(projeto.data_conclusao);
  dataLimite.setDate(dataLimite.getDate() + prestador.garantia_dias);

  const dentroDoPrazo = new Date() <= dataLimite;

  return {
    elegivel: dentroDoPrazo,
    motivo: dentroDoPrazo ? ('ok' as const) : ('fora_do_prazo' as const),
    projeto,
    prestador,
    dataLimite,
  };
}

/**
 * Cliente abre um caso de garantia — fluxo padrão.
 */
export async function abrirCasoGarantiaCliente(input: AbrirCasoClienteInput) {
  const supabase = createClient();

  const elegibilidade = await verificarElegibilidadeGarantia(input.projetoId);
  if (!elegibilidade.elegivel || !elegibilidade.projeto) {
    throw new Error(`Projeto não elegível para garantia: ${elegibilidade.motivo}`);
  }

  // Confere que o solicitante é de fato o cliente do projeto
  if (elegibilidade.projeto.cliente_user_id !== input.clienteUserId) {
    throw new Error('Apenas o cliente vinculado a este projeto pode abrir garantia.');
  }

  const prazoResposta = calcularPrazoUteis(5);

  const { data, error } = await supabase
    .from('solicitacoes_garantia')
    .insert({
      projeto_id: input.projetoId,
      prestador_id: elegibilidade.projeto.prestador_id,
      cliente_user_id: input.clienteUserId,
      origem: 'cliente',
      status: 'aberta',
      prazo_resposta: prazoResposta.toISOString().slice(0, 10),
      descricao_problema: input.descricaoProblema,
      fotos_problema: input.fotosProblema,
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
 */
export async function oferecerReparoPrestador(input: OferecerReparoPrestadorInput) {
  const supabase = createClient();

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
  const supabase = createClient();

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
  const supabase = createClient();

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
  const supabase = createClient();

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
 *    a valer como nota_efetiva da avaliação vinculada, se houver.
 *  - origem='prestador': nota é sempre NOTA_NEUTRA_REPARO_PRESTADOR (3),
 *    nunca a critério do prestador — não pode "comprar" 5 estrelas
 *    resolvendo o próprio erro.
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
  const supabase = createClient();

  const { data: casoAtual, error: casoAtualError } = await supabase
    .from('solicitacoes_garantia')
    .select('id, origem, avaliacao_id, status')
    .eq('id', casoId)
    .eq('cliente_user_id', clienteUserId)
    .single();

  if (casoAtualError || !casoAtual) throw new Error('Caso de garantia não encontrado.');
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
 * Job de cron — marca como 'sem_resposta' casos abertos cujo prazo estourou.
 * Aplica nota_resultante = 1 automaticamente e, se houver avaliação vinculada,
 * atualiza nota_efetiva também. Isso vale tanto para origem='cliente' quanto
 * origem='prestador' (prestador ignorar a própria oferta de reparo é ainda pior).
 */
export async function processarCasosVencidos() {
  const supabase = createClient();
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
