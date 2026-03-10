import { supabase } from '@/lib/supabase'

export default async function sitemap() {
  const baseUrl = 'https://procuroquemfaca.com.br'

  // 1. Buscamos todas as categorias únicas dos prestadores ativos
  const { data: prestadores } = await supabase
    .from('prestadores')
    .select('categoria')
    .eq('status', 'ativo')

  const categorias = Array.from(new Set(prestadores?.map(p => p.categoria) || []))

  // 2. Criamos as rotas estáticas (Home, Lista Geral)
  const rotasEstaticas = [
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
  const rotasCategorias = categorias.map((cat) => ({
    url: `${baseUrl}/prestadores?q=${encodeURIComponent(cat)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...rotasEstaticas, ...rotasCategorias]
}
