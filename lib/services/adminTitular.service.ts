//lib/services/adminTitular.service.ts
//
// Fila de pedidos do titular no painel admin. Roda no navegador com a sessão do administrador;
// as regras de acesso do banco só deixam administradores lerem e atualizarem.

import { supabase } from '@/lib/supabase'

export type StatusPedido = 'recebida' | 'em_analise' | 'atendida' | 'negada'

export interface PedidoAdmin {
  id: string
  tipo: string
  nome_solicitante: string | null
  contato: string
  descricao: string | null
  status: StatusPedido
  prazo_resposta: string
  resposta: string | null
  respondido_em: string | null
  created_at: string
  prestador_id: number | null
  prestadores: { nome: string; whatsapp: string | null; slug: string | null; user_id: string | null } | null
}

export async function listarPedidosTitular(): Promise<PedidoAdmin[]> {
  const { data, error } = await supabase
    .from('solicitacoes_titular')
    .select('id, tipo, nome_solicitante, contato, descricao, status, prazo_resposta, resposta, respondido_em, created_at, prestador_id, prestadores(nome, whatsapp, slug, user_id)')
    .order('prazo_resposta', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PedidoAdmin[]
}

interface Atualizacao {
  status: StatusPedido
  resposta?: string | null
}

export async function atualizarPedidoTitular(id: string, { status, resposta }: Atualizacao): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  const encerrando = status === 'atendida' || status === 'negada'
  const campos: Record<string, unknown> = {
    status,
    atendido_por: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }
  if (resposta !== undefined) campos.resposta = resposta
  if (encerrando) campos.respondido_em = new Date().toISOString()

  const { error } = await supabase.from('solicitacoes_titular').update(campos).eq('id', id)
  if (error) throw error
}
