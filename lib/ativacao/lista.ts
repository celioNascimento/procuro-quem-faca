// lib/ativacao/lista.ts
//
// Apoio da lista da tela /admin/ativacao. A tabela `prestadores` tem perfis sem nome (cadastros
// iniciados e não concluídos), então nome e slug podem vir vazios: nada aqui pode assumir texto.

interface PerfilDaLista {
  nome?: string | null
  slug?: string | null
}

export const NOME_PADRAO = '(sem nome)'

export function nomeDoPerfil(perfil: PerfilDaLista): string {
  return perfil.nome?.trim() || NOME_PADRAO
}

// Busca por trecho do nome ou do slug, sem diferenciar maiúsculas de minúsculas
export function correspondeABusca(perfil: PerfilDaLista, busca: string): boolean {
  const termo = busca.trim().toLowerCase()
  if (!termo) return true
  return (
    (perfil.nome ?? '').toLowerCase().includes(termo) ||
    (perfil.slug ?? '').toLowerCase().includes(termo)
  )
}

// ─── Dados de ativação vindos da tabela própria (prestador_ativacao) ──────────────────────────
// A consulta traz o funil embutido: `prestador_ativacao(status, enviado_em, respondeu_em, obs)`.
// Aqui ele volta ao formato plano que as telas já usam. Perfil sem linha ainda não foi contatado.

export interface AtivacaoEmbutida {
  status: string
  enviado_em: string | null
  respondeu_em: string | null
  obs: string | null
}

type ComAtivacao = { prestador_ativacao?: AtivacaoEmbutida | AtivacaoEmbutida[] | null }

export type AtivacaoPlana = {
  ativacao_status: string
  ativacao_enviado_em: string | null
  ativacao_respondeu_em: string | null
  ativacao_obs: string | null
}

export function achatarAtivacao<T extends ComAtivacao>(linha: T): Omit<T, 'prestador_ativacao'> & AtivacaoPlana {
  const { prestador_ativacao: embutida, ...resto } = linha
  const ativacao = Array.isArray(embutida) ? embutida[0] : embutida
  return {
    ...resto,
    ativacao_status: ativacao?.status ?? 'nao_enviado',
    ativacao_enviado_em: ativacao?.enviado_em ?? null,
    ativacao_respondeu_em: ativacao?.respondeu_em ?? null,
    ativacao_obs: ativacao?.obs ?? null,
  }
}

// ─── Onde o perfil atua (estado, cidade, região e categoria) ──────────────────────────────────
// A consulta traz as tabelas de apoio embutidas: `cidades(nome, estado_sigla)`, `regioes(nome)` e
// `categorias(nome)`. Aqui elas voltam ao formato plano. O estado vem da cidade; quando o perfil não
// tem cidade, usa o `estado_sigla` do próprio perfil. Qualquer campo pode ser nulo.

type Embutido<T> = T | T[] | null | undefined

function primeiro<T>(valor: Embutido<T>): T | null {
  const item = Array.isArray(valor) ? valor[0] : valor
  return item ?? null
}

function limpar(texto?: string | null): string | null {
  return texto?.trim() || null
}

export interface LocalEmbutido {
  estado_sigla?: string | null
  cidades?: Embutido<{ nome: string | null; estado_sigla: string | null }>
  regioes?: Embutido<{ nome: string | null }>
  categorias?: Embutido<{ nome: string | null }>
}

export type LocalPlano = {
  estado: string | null
  cidade: string | null
  regiao: string | null
  categoria: string | null
}

export function achatarLocal<T extends LocalEmbutido>(linha: T): Omit<T, 'cidades' | 'regioes' | 'categorias'> & LocalPlano {
  const { cidades, regioes, categorias, ...resto } = linha
  const cidade = primeiro(cidades)
  return {
    ...resto,
    estado: (limpar(cidade?.estado_sigla) ?? limpar(linha.estado_sigla))?.toUpperCase() ?? null,
    cidade: limpar(cidade?.nome),
    regiao: limpar(primeiro(regioes)?.nome),
    categoria: limpar(primeiro(categorias)?.nome),
  } as Omit<T, 'cidades' | 'regioes' | 'categorias'> & LocalPlano
}

// ─── Filtros por local ─────────────────────────────────────────────────────────────────────────

// Valor usado no filtro para "perfis sem esse dado" (ex.: sem cidade)
export const SEM_VALOR = '__sem__'

export type ChaveLocal = 'estado' | 'cidade' | 'regiao' | 'categoria'
export type FiltroLocal = Partial<Record<ChaveLocal, string>>

const CHAVES_LOCAL: ChaveLocal[] = ['estado', 'cidade', 'regiao', 'categoria']

// Filtro vazio ou ausente não restringe nada. SEM_VALOR pega só os perfis sem aquele dado.
export function passaFiltroLocal(perfil: Partial<LocalPlano>, filtro: FiltroLocal): boolean {
  return CHAVES_LOCAL.every((chave) => {
    const alvo = filtro[chave]
    if (!alvo) return true
    const valor = perfil[chave] ?? null
    return alvo === SEM_VALOR ? valor === null : valor === alvo
  })
}

export function temFiltroLocal(filtro: FiltroLocal): boolean {
  return CHAVES_LOCAL.some((chave) => Boolean(filtro[chave]))
}

export interface OpcaoLocal {
  valor: string
  quantidade: number
}

// Opções de um filtro com a contagem de perfis. Ordem alfabética; "sem o dado" vai por último.
export function opcoesDeLocal(perfis: Partial<LocalPlano>[], chave: ChaveLocal): OpcaoLocal[] {
  const contagem = new Map<string, number>()
  let semDado = 0
  for (const perfil of perfis) {
    const valor = perfil[chave] ?? null
    if (valor === null) semDado += 1
    else contagem.set(valor, (contagem.get(valor) ?? 0) + 1)
  }
  const opcoes = [...contagem.entries()]
    .map(([valor, quantidade]) => ({ valor, quantidade }))
    .sort((a, b) => a.valor.localeCompare(b.valor, 'pt-BR'))
  if (semDado > 0) opcoes.push({ valor: SEM_VALOR, quantidade: semDado })
  return opcoes
}

// Funil + local no formato plano usado pela tela
export function achatarPerfil<T extends ComAtivacao & LocalEmbutido>(linha: T) {
  return achatarLocal(achatarAtivacao(linha))
}
