//lib/db/prestadores.ts

import { supabase } from '@/lib/supabase'

export async function getPrestadoresAtivos(signal?: AbortSignal) {
  const query = supabase
    .from('prestadores')
    .select('*, cidades(id, nome, estado_sigla, regiao_id), categorias(nome)')
    .eq('status', 'ativo')

  if (signal) query.abortSignal(signal)

  return query
}

export async function getMediasAvaliacoes(signal?: AbortSignal) {
  const query = supabase
    .from('avaliacoes')
    .select('prestador_id, nota')
    .eq('visivel', true)

  if (signal) query.abortSignal(signal)

  return query
}