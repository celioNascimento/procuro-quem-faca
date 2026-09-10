import { supabase } from '@/lib/supabase'
import type { MetadataRoute } from 'next'

type PrestadorSitemapRow = {
  slug: string | null
  categorias: { nome: string | null } | { nome: string | null }[] | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://procuroquemfaca.com.br'
  const agora = new Date().toISOString()

  const { data } = await supabase
    .from('prestadores')
    .select('slug, categorias(nome)')
    .eq('status', 'ativo')

  const prestadores = (data ?? []) as PrestadorSitemapRow[]
  const categorias = Array.from(
    new Set(
      prestadores
        .map((prestador) => {
          const categoria = Array.isArray(prestador.categorias)
            ? prestador.categorias[0]
            : prestador.categorias
          return categoria?.nome
        })
        .filter((nome): nome is string => Boolean(nome))
    )
  )

  const rotasEstaticas: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: agora, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/prestadores`, lastModified: agora, changeFrequency: 'daily', priority: 0.8 },
  ]

  const rotasCategorias: MetadataRoute.Sitemap = categorias.map((categoria) => ({
    url: `${baseUrl}/prestadores?q=${encodeURIComponent(categoria)}`,
    lastModified: agora,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const slugs = Array.from(
    new Set(prestadores.map(({ slug }) => slug?.trim()).filter((slug): slug is string => Boolean(slug)))
  )
  const rotasPerfis: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/${encodeURIComponent(slug)}`,
    lastModified: agora,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...rotasEstaticas, ...rotasCategorias, ...rotasPerfis]
}
