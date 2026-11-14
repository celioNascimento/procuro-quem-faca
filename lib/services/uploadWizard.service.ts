//lib/services/uploadWizard.service.ts

import { supabase } from '@/lib/supabase'
import { FotoPortfolio, ComentarioPortfolio, ProjetoIdentificado } from '@/types/portfolio'
import { buscarTokensDosProjetos } from './projetoToken.service'

export async function getPrestadorBaseInfo(prestadorId: number) {
  const { data, error } = await supabase
    .from('prestadores')
    // portfolio_obrigatorio adicionado: define se este prestador opera no
    // fluxo com fotos (true/default) ou sem fotos (false). Consumido pelo
    // useUploadWizard para decidir qual jornada expor no wizard.
    .select('nome, foto_perfil, whatsapp, slug, portfolio_obrigatorio, categorias(nome, exemplo_descricao)')
    .eq('id', prestadorId)
    .single()

  if (error) throw error
  return data
}

export async function getFotosDoProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('portfolio_fotos')
    .select('*')
    .eq('projeto_id', projetoId)

  if (error) throw error
  return data as FotoPortfolio[]
}

export async function getComentariosDaFoto(fotoId: string) {
  const { data, error } = await supabase
    .from('portfolio_comentarios')
    .select('*')
    .eq('foto_id', fotoId)
    .eq('autor_tipo', 'cliente')
    .order('criado_at', { ascending: true })

  if (error) throw error
  return data as ComentarioPortfolio[]
}

export async function buscarProjetosPorTelefone(prestadorId: number, clienteWhatsappLimpo: string) {
  // O telefone do cliente não é filtrável pela API (dado pessoal): a função do banco só responde
  // ao prestador dono e já devolve os projetos do mais novo para o mais antigo.
  const { data, error } = await supabase.rpc('projetos_do_prestador_por_telefone', {
    p_prestador_id: prestadorId,
    p_whatsapp: clienteWhatsappLimpo,
  })

  if (error) throw error
  return data as ProjetoIdentificado[]
}

export async function criarNovoProjeto(payload: {
  prestador_id: number
  titulo: string
  cliente_whatsapp: string
  cliente_nome: string
  status: string
  avaliacao_token: string
  sem_fotos?: boolean
}) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .insert(payload)
    // Colunas explícitas: `.select()` pediria avaliacao_token, que o navegador não pode ler.
    // O token é gerado aqui (payload) e devolvido junto.
    .select('id, prestador_id, titulo, descricao, data_conclusao, created_at, data_inicio, status, aceito_at, cliente_user_id, sem_fotos, marcado_concluido_at')
    .single()

  if (error) throw error
  // Nome e telefone do cliente acabaram de ser digitados pelo prestador: voltam do payload, não da leitura.
  return { ...data, cliente_whatsapp: payload.cliente_whatsapp, cliente_nome: payload.cliente_nome, avaliacao_token: payload.avaliacao_token }
}

/**
 * Cria um projeto no fluxo SEM foto obrigatória.
 *
 * Espelha o papel que o upload da foto 1 tem no fluxo com fotos (criar o
 * projeto implicitamente), mas aqui a criação é explícita — disparada pelo
 * botão "Iniciar serviço" no wizard, e não por um upload.
 *
 * Nasce direto em status 'pendente' (não 'em_registro'): não existe rascunho
 * no fluxo sem foto, o prestador já preencheu whatsapp/nome/título válidos
 * antes de poder clicar no botão que chama esta função.
 */
export async function iniciarProjetoSemFoto(payload: {
  prestador_id: number
  titulo: string
  cliente_whatsapp: string
  cliente_nome: string
}) {
  const avaliacao_token = crypto.randomUUID()
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .insert({
      ...payload,
      status: 'pendente',
      sem_fotos: true,
      avaliacao_token,
    })
    .select('id, prestador_id, titulo, descricao, data_conclusao, created_at, data_inicio, status, aceito_at, cliente_user_id, sem_fotos, marcado_concluido_at')
    .single()

  if (error) throw error
  return { ...data, cliente_whatsapp: payload.cliente_whatsapp, cliente_nome: payload.cliente_nome, avaliacao_token }
}

/**
 * Marca o projeto sem_fotos como concluído pelo prestador.
 *
 * Equivalente ao papel de "foto 3 + legenda salva" no fluxo com fotos: sinaliza
 * que o serviço terminou e libera o link de avaliação no wizard. NÃO muda o
 * status para 'finalizado' — isso só acontece quando o cliente avalia (ver
 * hooks/useAvaliacao.ts → finalizarProjeto), mantendo o mesmo contrato de
 * status do fluxo com fotos.
 */
export async function marcarProjetoConcluido(projetoId: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ marcado_concluido_at: new Date().toISOString() })
    .eq('id', projetoId)

  if (error) throw error
}

export async function atualizarStatusProjeto(projetoId: string, status: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ status })
    .eq('id', projetoId)

  if (error) throw error
}

export async function atualizarTituloProjeto(projetoId: string, titulo: string) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update({ titulo })
    .eq('id', projetoId)

  if (error) throw error
}

/**
 * Corrige whatsapp/nome/título de um projeto já criado, mas ainda não
 * aceito pelo cliente. Existe porque o vínculo cliente-projeto depende de
 * cliente_whatsapp bater exatamente com o telefone do cliente — um erro de
 * digitação torna o projeto invisível no painel do cliente, sem erro
 * algum visível para o prestador. Só deve ser chamada com status='pendente'
 * (a UI já restringe isso, mas o guard aqui é defensivo).
 */
export async function atualizarDadosClienteProjeto(
  projetoId: string,
  dados: { cliente_whatsapp: string; cliente_nome: string; titulo: string },
) {
  const { error } = await supabase
    .from('portfolio_projetos')
    .update(dados)
    .eq('id', projetoId)
    .eq('status', 'pendente')

  if (error) throw error
}

export async function upsertFotoProjeto(payload: {
  projeto_id: string
  url_foto: string
  ordem: number
  prestador_id: number
}) {
  // Foto nova (ou trocada) começa sem declaração de pessoas: a pergunta é refeita para cada imagem.
  const { data, error } = await supabase
    .from('portfolio_fotos')
    .upsert(
      { ...payload, contem_pessoas: false, consentimento_terceiros_confirmado: false, consentimento_terceiros_em: null },
      { onConflict: 'projeto_id, ordem' },
    )
    .select()
    .single()

  if (error) throw error
  return data as FotoPortfolio
}

export async function atualizarLegendaFoto(fotoId: string, legenda: string) {
  const { error } = await supabase
    .from('portfolio_fotos')
    .update({ legenda })
    .eq('id', fotoId)

  if (error) throw error
}

/**
 * Declaração do prestador sobre pessoas na foto. Se aparece alguém, ele confirma que tem a autorização
 * dessa pessoa para publicar a imagem; a data da confirmação fica registrada.
 */
export async function atualizarConsentimentoFoto(
  fotoId: string,
  { contemPessoas, autorizado }: { contemPessoas: boolean; autorizado: boolean },
) {
  const confirmado = contemPessoas && autorizado
  const { error } = await supabase
    .from('portfolio_fotos')
    .update({
      contem_pessoas: contemPessoas,
      consentimento_terceiros_confirmado: confirmado,
      consentimento_terceiros_em: confirmado ? new Date().toISOString() : null,
    })
    .eq('id', fotoId)

  if (error) throw error
}

export async function getStatusETokenProjeto(projetoId: string) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    // sem_fotos e marcado_concluido_at adicionados: necessários para o
    // useUploadWizard saber, ao sincronizar o projeto, se está no fluxo
    // sem foto e se já foi marcado como concluído (libera link de avaliação).
    .select('status, sem_fotos, marcado_concluido_at')
    .eq('id', projetoId)
    .single()

  if (error) throw error
  // O token não é legível pela API; só o prestador dono do projeto o recebe (função do banco).
  const tokens = await buscarTokensDosProjetos([projetoId])
  return { ...data, avaliacao_token: tokens[projetoId] ?? '' }
}

export async function uploadImagemPortfolio(filePath: string, file: File, contentType?: string) {
  const { error: uploadError } = await supabase.storage
    .from('portfolios')
    .upload(filePath, file, contentType ? { contentType } : undefined)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('portfolios')
    .getPublicUrl(filePath)

  return publicUrl
}
