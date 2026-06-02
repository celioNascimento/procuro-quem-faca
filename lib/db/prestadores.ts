import { supabase } from '@/lib/supabase'

export async function getPrestadoresAtivos() {
  return supabase
    .from('prestadores')
    .select('*, cidades(id, nome, estado_sigla, regiao_id), categorias(nome)')
    .eq('status', 'ativo')
}

export async function getMediasAvaliacoes() {
  return supabase
    .from('avaliacoes')
    .select('prestador_id, nota')
    .eq('visivel', true)
}