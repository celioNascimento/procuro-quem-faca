//lib/services/denuncia.service.ts

import { supabase } from '@/lib/supabase'

export async function criarDenuncia(prestadorId: number, motivo: string): Promise<void> {
  if (!Number.isInteger(prestadorId) || prestadorId <= 0) {
    throw new Error('Prestador inválido')
  }

  const motivoNormalizado = motivo.trim()
  if (!motivoNormalizado) throw new Error('O motivo da denúncia é obrigatório')

  // A denúncia é o registro principal. O retorno confirma que o INSERT foi aceito.
  const { error: denunciaError } = await supabase
    .from('denuncias')
    .insert({
      prestador_id: prestadorId,
      motivo: motivoNormalizado,
      status: 'aberta',
    })

  if (denunciaError) throw denunciaError

  // O log é auxiliar: uma falha na tabela de logs não pode mascarar
  // uma denúncia que já foi gravada nem fazer o usuário reenviar duplicado.
  const { error: logError } = await supabase.from('logs_atividades').insert({
    acao: 'DENUNCIA_PERFIL',
    entidade_tipo: 'prestador',
    entidade_id: prestadorId,
    detalhes: { motivo: motivoNormalizado, timestamp: new Date().toISOString() },
  })

  if (logError) console.error('[v0] Denúncia criada, mas o log falhou:', logError)
}

  export interface DenunciaComPrestador {
    id: string
    prestador_id: number
    motivo: string
    status: string
    created_at: string
    prestadores: { nome: string; foto_perfil: string | null; slug: string | null; bloqueado: boolean } | null
  }
 
  export async function fetchDenuncias(status?: string): Promise<DenunciaComPrestador[]> {
    let query = supabase
      .from('denuncias')
      .select('id, prestador_id, motivo, status, created_at, prestadores(nome, foto_perfil, slug, bloqueado)')
      .order('created_at', { ascending: false })
 
    if (status) query = query.eq('status', status)
 
    const { data, error } = await query
    if (error) throw error
    return (data as unknown as DenunciaComPrestador[]) || []
  }
 
  export async function atualizarStatusDenuncia(denunciaId: string, novoStatus: 'resolvida' | 'arquivada'): Promise<void> {
    const { error } = await supabase.from('denuncias').update({ status: novoStatus }).eq('id', denunciaId)
    if (error) throw error
  }
 
  export async function bloquearPrestadorDenunciado(prestadorId: number, motivo: string): Promise<void> {
    const { error } = await supabase
      .from('prestadores')
      .update({ bloqueado: true, motivo_bloqueio: motivo })
      .eq('id', prestadorId)
    if (error) throw error
  }

  export async function desbloquearPrestador(prestadorId: number): Promise<void> {
    const { error } = await supabase
      .from('prestadores')
      .update({ bloqueado: false, motivo_bloqueio: null, status: 'ativo' })
      .eq('id', prestadorId)
    if (error) throw error
  }
