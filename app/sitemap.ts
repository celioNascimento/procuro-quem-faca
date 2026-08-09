// app/sitemap.ts

import { supabase } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://procuroquemfaca.com.br'

  // 1. Buscamos todas as categorias únicas dos prestadores ativos
  //    (categoria_id é FK — precisamos do join para pegar o nome real)
  const { data: prestadores } = await supabase
    .from('prestadores')
    .select('categorias(nome)')
    .eq('status', 'ativo')

  const categorias = Array.from(
    new Set(
      prestadores
        ?.map((p: any) => p.categorias?.nome)
        .filter((nome): nome is string => Boolean(nome)) || []
    )
  )

  // 2. Criamos as rotas estáticas (Home, Lista Geral)
  const rotasEstaticas: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/prestadores`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.8,
    }
  ]

  // 3. Criamos rotas dinâmicas para cada categoria (SEO de cauda longa)
  const rotasCategorias: MetadataRoute.Sitemap = categorias.map((cat) => ({
    url: `${baseUrl}/prestadores?q=${encodeURIComponent(cat)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...rotasEstaticas, ...rotasCategorias]
}