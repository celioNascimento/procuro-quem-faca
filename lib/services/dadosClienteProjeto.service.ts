// lib/services/dadosClienteProjeto.service.ts
//
// Nome e WhatsApp do cliente de um projeto são dado pessoal: o navegador NÃO pode ler essas colunas
// direto da tabela (migration 20261113120100). Os caminhos controlados são funções do banco
// (migration 20261113120000), no mesmo padrão dos tokens do projeto (`projetoToken.service.ts`):
// só o prestador dono do projeto e o cliente vinculado a ele recebem os dados.
import { supabase } from '@/lib/supabase'

export interface DadosCliente {
  cliente_whatsapp: string | null
  cliente_nome: string | null
}

type LinhaDadosCliente = { projeto_id: string } & DadosCliente

/** Dados do cliente dos projetos informados que o chamador pode ver. Os demais não voltam. */
export async function buscarDadosClienteDosProjetos(ids: string[]): Promise<Record<string, DadosCliente>> {
  if (ids.length === 0) return {}
  const { data, error } = await supabase.rpc('dados_cliente_projetos', { p_ids: ids })
  if (error) throw error
  const mapa: Record<string, DadosCliente> = {}
  for (const linha of (data ?? []) as LinhaDadosCliente[]) {
    mapa[linha.projeto_id] = { cliente_whatsapp: linha.cliente_whatsapp, cliente_nome: linha.cliente_nome }
  }
  return mapa
}

/** Anexa nome e WhatsApp do cliente a cada projeto (nulos quando o chamador não pode vê-los). */
export async function anexarDadosCliente<T extends { id: string }>(linhas: T[]): Promise<(T & DadosCliente)[]> {
  const mapa = await buscarDadosClienteDosProjetos(linhas.map(l => l.id))
  return linhas.map(l => ({
    ...l,
    cliente_whatsapp: mapa[l.id]?.cliente_whatsapp ?? null,
    cliente_nome: mapa[l.id]?.cliente_nome ?? null,
  }))
}

/** Nome do cliente para o cabeçalho das telas abertas pelo link do projeto (exige login). */
export async function nomeClientePorToken(token: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('nome_cliente_por_token', { p_token: token })
  if (error) throw error
  return (data as string | null) ?? null
}

/** Remove nome e WhatsApp dos projetos da conta logada (usado ao excluir a conta de cliente). */
export async function anonimizarMeusDadosDeCliente(): Promise<number> {
  const { data, error } = await supabase.rpc('anonimizar_meus_dados_de_cliente')
  if (error) throw error
  return (data as number | null) ?? 0
}
