import type { MetadataRoute } from 'next'

const baseUrl = 'https://procuroquemfaca.com.br'

const servicos = [
  'eletricista',
  'diarista',
  'pedreiro',
  'fotografo',
  'massoterapia',
  'encanador',
  'pintor',
  'jardineiro',
  'marceneiro',
  'faxineira',
  'montador-de-moveis',
  'dedetizador',
  'ar-condicionado',
  'chaveiro',
  'vidraceiro',
  'serralheiro',
  'gesseiro',
  'impermeabilizacao',
]

const cidades = [
  'londrina',
  'maringa',
  'curitiba',
  'cascavel',
  'foz-do-iguacu',
  'ponta-grossa',
  'guarapuava',
  'paranagua',
  'apucarana',
  'campo-mourao',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const paginasServicoCidade = servicos.flatMap((servico) =>
    cidades.map((cidade) => ({
      url: `${baseUrl}/${servico}-em-${cidade}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  )

  return [
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
    ...paginasServicoCidade,
  ]
}

// 18 serviços × 10 cidades + 3 rotas principais = 183 URLs indexáveis.
export const dynamic = 'force-static'
export const revalidate = 86400
