//lib/prestadorUtils.ts

// Palavras de ligação não entram nas iniciais: "Construções e Reformas" → "CR", não "CE".
const PALAVRAS_DE_LIGACAO = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'di', 'du', '&'])

export function getIniciais(nome: string): string {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  const uteis = partes.filter(p => !PALAVRAS_DE_LIGACAO.has(p.toLowerCase()))
  const base = uteis.length > 0 ? uteis : partes
  if (base.length >= 2) return (base[0][0] + base[1][0]).toUpperCase()
  return base[0][0].toUpperCase()
}

// Tons suaves da marca para o avatar de quem não tem foto. A cor sai do nome, então é sempre a mesma para o mesmo perfil.
const CORES_INICIAIS = [
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-violet-50 text-violet-700 border-violet-100',
]

export function corDasIniciais(nome: string): string {
  let soma = 0
  for (const letra of nome || '') soma += letra.charCodeAt(0)
  return CORES_INICIAIS[soma % CORES_INICIAIS.length]
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
