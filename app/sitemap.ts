import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const baseUrl = 'https://procuroquemfaca.com.br'

// Revalida o sitemap dinamicamente no servidor a cada 12 horas (43200 segundos)
export const revalidate = 43200

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper para converter nomes de cidades com acento para slug ("Foz do Iguaçu" -> "foz-do-iguacu")
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  // 1. Busca dinâmica em paralelo: Categorias, Cidades Ativas e Prestadores Ativos
  const [{ data: categorias }, { data: cidades }, { data: prestadores }] = await Promise.all([
    supabase.from('categorias').select('slug'),
    supabase.from('cidades').select('nome').eq('ativa', true),
    supabase.from('prestadores').select('slug, created_at').eq('status', 'ativo'),
  ])

  // 2. Gera URLs combinadas: "servico-em-cidade"
  const paginasServicoCidade: MetadataRoute.Sitemap = []
  
  if (categorias && cidades) {
    for (const cat of categorias) {
      for (const cid of cidades) {
        paginasServicoCidade.push({
          url: `${baseUrl}/${cat.slug}-em-${slugify(cid.nome)}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  }

  // 3. Gera URLs individuais dos perfis dos prestadores
  const paginasPrestadores: MetadataRoute.Sitemap = (prestadores || []).map((p) => ({
    url: `${baseUrl}/prestador/${p.slug}`, // Ajuste se a rota for direta ex: `${baseUrl}/${p.slug}`
    lastModified: p.created_at ? new Date(p.created_at) : lastModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 4. Páginas institucionais fixas
  const paginasEstaticas: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/prestadores`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ajuda`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  return [
    ...paginasEstaticas,
    ...paginasServicoCidade,
    ...paginasPrestadores,
  ]
}
