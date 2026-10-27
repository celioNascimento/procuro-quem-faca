// lib/tracking/resumo.ts
//
// Agrega os cliques de WhatsApp para a página de admin: total, pessoas
// diferentes, origem/campanha, prestadores e dias.
// Funções puras (sem banco, sem rede) e sem imports, para serem fáceis de testar.
//
// Dias contados no fuso de Brasília (America/Sao_Paulo). O Brasil não usa
// horário de verão desde 2019, então o deslocamento é fixo em -03:00.

export const FUSO_PQF = 'America/Sao_Paulo'
const DIA_MS = 24 * 60 * 60 * 1000

export interface CliqueLinha {
  prestador_id: number | null
  created_at: string | null
  origem: string | null
  campanha: string | null
  sessao_id: string | null
}

export interface ContagemOrigem {
  origem: string
  campanha: string | null
  total: number
}

export interface ContagemPrestador {
  prestadorId: number
  total: number
}

export interface ContagemDia {
  dia: string // AAAA-MM-DD, no fuso de Brasília
  total: number
}

export interface ResumoCliques {
  total: number
  sessoesUnicas: number
  prestadoresUnicos: number
  porOrigem: ContagemOrigem[]
  porPrestador: ContagemPrestador[]
  porDia: ContagemDia[]
}

export const ROTULO_SEM_ORIGEM = 'sem origem'
const LIMITE_PRESTADORES = 10
const LIMITE_ORIGENS = 20

/** AAAA-MM-DD de uma data, no fuso de Brasília. */
export function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_PQF,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data)
}

/** Lista de dias (AAAA-MM-DD) do período, do mais antigo ao de hoje. */
export function diasDoPeriodo(agora: Date, dias: number): string[] {
  const lista: string[] = []
  for (let i = dias - 1; i >= 0; i--) {
    lista.push(diaLocal(new Date(agora.getTime() - i * DIA_MS)))
  }
  return lista
}

/** ISO (UTC) da meia-noite de Brasília do primeiro dia do período. */
export function inicioDoPeriodo(agora: Date, dias: number): string {
  const primeiroDia = diasDoPeriodo(agora, dias)[0]
  return new Date(`${primeiroDia}T00:00:00-03:00`).toISOString()
}

function ordenarDesc<T extends { total: number }>(itens: T[]): T[] {
  return itens.sort((a, b) => b.total - a.total)
}

export function resumirCliques(linhas: CliqueLinha[], agora: Date, dias: number): ResumoCliques {
  const sessoes = new Set<string>()
  const prestadores = new Map<number, number>()
  const origens = new Map<string, ContagemOrigem>()
  const porDia = new Map<string, number>(diasDoPeriodo(agora, dias).map((dia) => [dia, 0]))

  for (const linha of linhas) {
    // 'backfill' marca registros históricos importados: não identifica pessoa.
    if (linha.sessao_id && linha.sessao_id !== 'backfill') sessoes.add(linha.sessao_id)

    if (linha.prestador_id !== null) {
      prestadores.set(linha.prestador_id, (prestadores.get(linha.prestador_id) ?? 0) + 1)
    }

    const origem = linha.origem ?? ROTULO_SEM_ORIGEM
    const chave = `${origem}|${linha.campanha ?? ''}`
    const atual = origens.get(chave)
    if (atual) atual.total += 1
    else origens.set(chave, { origem, campanha: linha.campanha, total: 1 })

    if (linha.created_at) {
      const dia = diaLocal(new Date(linha.created_at))
      if (porDia.has(dia)) porDia.set(dia, (porDia.get(dia) ?? 0) + 1)
    }
  }

  return {
    total: linhas.length,
    sessoesUnicas: sessoes.size,
    prestadoresUnicos: prestadores.size,
    porOrigem: ordenarDesc([...origens.values()]).slice(0, LIMITE_ORIGENS),
    porPrestador: ordenarDesc(
      [...prestadores.entries()].map(([prestadorId, total]) => ({ prestadorId, total })),
    ).slice(0, LIMITE_PRESTADORES),
    porDia: [...porDia.entries()].map(([dia, total]) => ({ dia, total })),
  }
}
