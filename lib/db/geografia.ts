//lib/db/geografia.ts

import { supabase } from '@/lib/supabase'
import type { Cidade } from '../../app/(admin)/admin/geografia/types/geografia'

export async function getEstados() {
  return supabase.from('estados').select('*').order('sigla')
}

export async function getRegioes() {
  return supabase.from('regioes').select('*').order('nome')
}

export async function getCidades() {
  const { data, error } = await supabase
    .from('cidades')
    .select('id, nome, estado_sigla, regiao_id, ativa, regioes(nome)')
    .order('nome')

  if (error) return { data: null, error }

  const cidades: Cidade[] = (data ?? []).map(c => ({
    id:           c.id,
    nome:         c.nome,
    estado_sigla: c.estado_sigla,
    regiao_id:    c.regiao_id ?? null,
    ativa:        c.ativa,
    regioes:      Array.isArray(c.regioes) ? (c.regioes[0] ?? null) : (c.regioes ?? null),
  }))

  return { data: cidades, error: null }
}

export async function insertEstado(sigla: string, nome: string) {
  return supabase.from('estados').insert([{ sigla: sigla.toUpperCase(), nome }])
}

export async function insertRegiao(nome: string, estadoSigla: string) {
  return supabase.from('regioes').insert([{ nome, estado_sigla: estadoSigla }])
}

export async function insertCidade(nome: string, estadoSigla: string, regiaoId: string | null) {
  return supabase.from('cidades').insert([{
    nome,
    estado_sigla: estadoSigla,
    regiao_id:    regiaoId ?? null,
    ativa:        true,
  }])
}

export async function updateRegiaoCidade(cidadeId: string, regiaoId: string | null) {
  return supabase.from('cidades')
    .update({ regiao_id: regiaoId ?? null })
    .eq('id', cidadeId)
}