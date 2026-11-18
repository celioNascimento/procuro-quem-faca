// lib/cnpj/cnaes.ts
// Lista de atividades (CNAE) do CNPJ para o painel do prestador: formata o código e marca qual combina com a categoria.

export type DetalheCnae = { codigo: string; descricao: string | null }

export type ItemCnae = {
  codigo: string
  formatado: string
  descricao: string | null
  principal: boolean
  combina: boolean
}

/** "4520007" -> "4520-0/07". Código fora do padrão volta como veio. */
export function formatarCnae(codigo: string): string {
  return /^\d{7}$/.test(codigo) ? `${codigo.slice(0, 4)}-${codigo[4]}/${codigo.slice(5)}` : codigo
}

type EntradaCnae = {
  cnae_codigo?: string | null
  cnae_descricao?: string | null
  cnaes_secundarios?: string[] | null
  cnaes_detalhe?: DetalheCnae[] | null
}

/** Principal primeiro; depois as secundárias, sem repetir. `compativeis` vem do banco (códigos que combinam). */
export function listarCnaes(cnpj: EntradaCnae | null | undefined, compativeis: string[] = []): ItemCnae[] {
  if (!cnpj) return []
  const descricoes = new Map((cnpj.cnaes_detalhe ?? []).map((d) => [d.codigo, d.descricao]))
  const vistos = new Set<string>()
  const itens: ItemCnae[] = []
  const adicionar = (codigo: string, descricao: string | null, principal: boolean) => {
    if (vistos.has(codigo)) return
    vistos.add(codigo)
    itens.push({ codigo, formatado: formatarCnae(codigo), descricao, principal, combina: compativeis.includes(codigo) })
  }
  if (cnpj.cnae_codigo) adicionar(cnpj.cnae_codigo, cnpj.cnae_descricao ?? null, true)
  for (const codigo of cnpj.cnaes_secundarios ?? []) adicionar(codigo, descricoes.get(codigo) ?? null, false)
  return itens
}
