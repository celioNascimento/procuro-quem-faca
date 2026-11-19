// lib/services/seloCnpj.service.ts
// Selo de CNPJ do prestador: leitura (com a sessão dele; o banco só devolve as linhas dele)
// e envio/remoção pela rota /api/cnpj, que grava com a chave de serviço.

import { supabase } from '@/lib/supabase'
import type { DadosSeloCnpj } from '@/lib/selos/cnpjEstado'

export async function buscarMeuSeloCnpj(prestadorId: number): Promise<DadosSeloCnpj> {
  const [verif, cnpj] = await Promise.all([
    supabase
      .from('prestador_verificacoes')
      .select('status, valido_ate, verificado_em')
      .eq('prestador_id', prestadorId)
      .eq('tipo', 'cnpj')
      .maybeSingle(),
    supabase
      .from('prestador_cnpj')
      .select('cnpj, razao_social, consultado_em, situacao, cnae_codigo, cnae_descricao, cnaes_secundarios, cnaes_detalhe')
      .eq('prestador_id', prestadorId)
      .maybeSingle(),
  ])
  if (verif.error) throw verif.error
  if (cnpj.error) throw cnpj.error
  return { verificacao: verif.data, cnpj: cnpj.data }
}

/** Códigos de atividade do CNPJ que combinam com a categoria do perfil (só o dono consulta). Falhou: lista vazia. */
export async function buscarCnaesCompativeis(prestadorId: number): Promise<string[]> {
  const { data, error } = await supabase.rpc('cnaes_compativeis_do_prestador', { p_prestador_id: prestadorId })
  if (error) return []
  return Array.isArray(data) ? (data as string[]) : []
}

export type ResultadoEnvioCnpj =
  | { ok: true; status: 'aprovada' | 'pendente'; mensagem: string }
  | { ok: false; erro: string }

const ERRO_GENERICO = 'Não foi possível concluir agora. Tente de novo em alguns minutos.'

async function lerJson(resposta: Response): Promise<Record<string, unknown>> {
  try {
    return (await resposta.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function enviarCnpj(cnpj: string): Promise<ResultadoEnvioCnpj> {
  try {
    const resposta = await fetch('/api/cnpj', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj }),
    })
    const corpo = await lerJson(resposta)
    if (resposta.ok && (corpo.status === 'aprovada' || corpo.status === 'pendente')) {
      return { ok: true, status: corpo.status, mensagem: String(corpo.mensagem ?? '') }
    }
    return { ok: false, erro: typeof corpo.erro === 'string' ? corpo.erro : ERRO_GENERICO }
  } catch {
    return { ok: false, erro: ERRO_GENERICO }
  }
}

export async function removerCnpj(): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const resposta = await fetch('/api/cnpj', { method: 'DELETE' })
    if (resposta.ok) return { ok: true }
    const corpo = await lerJson(resposta)
    return { ok: false, erro: typeof corpo.erro === 'string' ? corpo.erro : ERRO_GENERICO }
  } catch {
    return { ok: false, erro: ERRO_GENERICO }
  }
}
