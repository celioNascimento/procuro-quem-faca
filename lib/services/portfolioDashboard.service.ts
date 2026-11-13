//lib/services/portfolioDashboard.service.ts

import { supabase } from '@/lib/supabase'
import { Projeto } from '@/hooks/usePortfolioDashboard'
import { anexarDadosCliente } from './dadosClienteProjeto.service'

// ─────────────────────────────────────────────────────────────────────────────
// Funções usadas pelo usePortfolioDashboard
// ─────────────────────────────────────────────────────────────────────────────

export async function getPrestadorPerfilDoUsuario(userId: string) {
  const { data, error } = await supabase
    .from('prestadores')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

// Select comum às duas queries abaixo — inclui o join com solicitacoes_garantia
// (só os campos usados pelo badge do ProjetoCard, sem trazer descrição/fotos).
// sem_fotos e marcado_concluido_at adicionados: ProjetoCard usa sem_fotos para
// decidir o visual (badge "Sem registro fotográfico" em vez de contagem de fotos).
const SELECT_PROJETO_COM_GARANTIA = `
  id, titulo, status, created_at, prestador_id,
  cliente_user_id,
  sem_fotos, marcado_concluido_at,
  portfolio_fotos (id, url_foto, ordem),
  avaliacoes (id),
  solicitacoes_garantia (id, status, origem, tipo, prazo_resposta)
`

export async function getProjetosPorPrestador(prestadorId: number) {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_PROJETO_COM_GARANTIA)
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  // Nome e WhatsApp do cliente vêm de função do banco (dado pessoal; só o prestador dono recebe).
  return (await anexarDadosCliente(data ?? [])) as unknown as Omit<Projeto, 'notifCount'>[]
}

export async function getProjetoAtualizado(projetoId: string): Promise<Projeto | null> {
  const { data, error } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_PROJETO_COM_GARANTIA)
    .eq('id', projetoId)
    .single()

  if (error || !data) return null

  const [comCliente] = await anexarDadosCliente([data])
  return { ...comCliente, notifCount: 0 } as unknown as Projeto
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções usadas pelo useUploadWizard (re-exportadas aqui para centralizar)
// ─────────────────────────────────────────────────────────────────────────────

export {
  getPrestadorBaseInfo,
  getFotosDoProjeto,
  getComentariosDaFoto,
  buscarProjetosPorTelefone,
  criarNovoProjeto,
  iniciarProjetoSemFoto,
  marcarProjetoConcluido,
  atualizarStatusProjeto,
  atualizarTituloProjeto,
  atualizarDadosClienteProjeto,
  upsertFotoProjeto,
  atualizarLegendaFoto,
  getStatusETokenProjeto,
  uploadImagemPortfolio,
} from './uploadWizard.service'
