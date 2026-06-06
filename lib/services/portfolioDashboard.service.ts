import { supabase } from '@/lib/supabase'

const SELECT_PROJETOS = `
  *,
  portfolio_fotos(id, url_foto, ordem),
  avaliacoes(id)
`

export async function getPrestadorIdDoUsuario(userId: string): Promise<number | null> {
  const { data } = await supabase
    .from('prestadores')
    .select('id')
    .eq('user_id', userId)
    .single()
  return data?.id ?? null
}

export async function getProjetosPorPrestador(prestadorId: number) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_PROJETOS)
    .eq('prestador_id', prestadorId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getProjetoAtualizado(projetoId: string) {
  const { data } = await supabase
    .from('portfolio_projetos')
    .select(SELECT_PROJETOS)
    .eq('id', projetoId)
    .single()
  return data
}