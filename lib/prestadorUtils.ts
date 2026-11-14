//lib/prestadorUtils.ts

export function getIniciais(nome: string): string {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  return partes[0][0].toUpperCase()
}

export function getLocalizacao(bairro?: string, cidadeNome?: string): string {
  return [bairro, cidadeNome].filter(Boolean).join(' • ')
}

export function getPerfilHref(slug: string | null, id: string | number): string {
  const from = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/prestadores'
  return `/${slug || id}?from=${encodeURIComponent(from)}`
}

// Título da página de resultados. Com cidade conhecida ela aparece; sem cidade, o título é genérico
// (nunca "sua região" quando a lista traz o catálogo todo). Se a cidade já foi escrita na própria
// busca ("pedreiro em Londrina"), não repete.
export function getTituloBusca(
  queryBusca: string,
  cidadeNome: string | null,
  cidadeJaNaBusca = false,
): string {
  if (queryBusca) {
    return cidadeNome && !cidadeJaNaBusca
      ? `Resultados para "${queryBusca}" em ${cidadeNome}`
      : `Resultados para "${queryBusca}"`
  }
  return cidadeNome ? `Profissionais em ${cidadeNome}` : 'Profissionais cadastrados'
}
