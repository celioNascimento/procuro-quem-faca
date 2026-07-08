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

export function getTituloBusca(queryBusca: string, filtroCidNome: string): string {
  if (queryBusca) return `Resultados para "${queryBusca}"`
  return `Profissionais em ${filtroCidNome || 'sua região'}`
}