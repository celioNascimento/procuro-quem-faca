// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ServicoPage, { getServicoMetadata } from './seo-service-page'

async function renderizar(slug: string) {
  const el = await ServicoPage({ params: Promise.resolve({ slug }) })
  return renderToStaticMarkup(el)
}

function lerJsonLd(html: string) {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  return JSON.parse((m?.[1] ?? '{}').replace(/&quot;/g, '"').replace(/&#x27;/g, "'"))
}

describe('página de SEO "serviço em cidade"', () => {
  it('não promete o que a plataforma não faz', async () => {
    const html = await renderizar('pedreiro-em-londrina')
    for (const proibido of [
      'verificação de identidade', 'CPF verificado', 'profissionais verificados',
      'avaliações verificadas', 'em minutos', 'receba respostas', 'orçamentos gratuitos',
    ]) {
      expect(html).not.toContain(proibido)
    }
  })

  it('o botão leva à busca (a rota /solicitar não existe)', async () => {
    const html = await renderizar('pedreiro-em-londrina')
    expect(html).not.toContain('/solicitar')
    expect(html).toContain('href="/prestadores?q=pedreiro%20em%20Londrina"')
  })

  it('o JSON-LD traz as mesmas perguntas e respostas do texto visível', async () => {
    const html = await renderizar('eletricista-em-maringa')
    const grafo = lerJsonLd(html)['@graph']
    const faq = grafo.find((n: { '@type': string }) => n['@type'] === 'FAQPage')
    expect(faq.mainEntity.length).toBeGreaterThan(0)
    for (const item of faq.mainEntity) {
      const resposta = item.acceptedAnswer.text as string
      expect(html).toContain(resposta.replace(/'/g, '&#x27;'))
    }
    expect(JSON.stringify(grafo)).not.toMatch(/verificad/i)
  })

  it('mostra bairros só para cidades com lista própria', async () => {
    expect(await renderizar('pintor-em-curitiba')).toContain('Bairros de Curitiba')
    expect(await renderizar('pintor-em-cidadezinha')).not.toContain('Bairros de')
  })

  it('a descrição da página não usa "verificadas"', () => {
    expect(getServicoMetadata('pedreiro-em-londrina').description).not.toMatch(/verificad|contrate com segurança/i)
  })
})
