// lib/services/vitrine.service.ts
//
// Grava a Vitrine de fotos do prestador (colunas sessao_fotos_titulo e sessao_fotos_urls de
// `prestadores`). A regra de acesso é do banco: só o dono do perfil consegue alterar.
import { supabase } from '@/lib/supabase'
import { normalizarVitrine, type Vitrine } from '@/lib/vitrine/vitrine'

export async function salvarVitrine(
  prestadorId: number,
  entrada: { titulo?: string | null; fotos?: (string | null | undefined)[] | null },
): Promise<Vitrine> {
  const vitrine = normalizarVitrine(entrada)
  const { error } = await supabase
    .from('prestadores')
    .update({
      sessao_fotos_titulo: vitrine.titulo || null,
      sessao_fotos_urls: vitrine.fotos,
    })
    .eq('id', prestadorId)
  if (error) throw error
  return vitrine
}
