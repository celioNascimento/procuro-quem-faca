// lib/cnpj/consulta.ts
// Consulta em cascata às fontes gratuitas (dados abertos da Receita), com cache.
// Quem chama recebe um DadosCnpj normalizado, sem importar qual fonte respondeu.
// Trocar ou adicionar fonte mexe só neste arquivo.

import { removerCpfDoNomeMei } from './nomes'

export type FonteCnpj = 'brasilapi' | 'minhareceita' | 'receitaws'

export type DadosCnpj = {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  situacao: string            // ex.: ATIVA, BAIXADA, SUSPENSA, INAPTA
  porte: string | null
  naturezaJuridica: string | null
  mei: boolean
  cnaeCodigo: string | null   // só dígitos
  cnaeDescricao: string | null
  dataAbertura: string | null // AAAA-MM-DD
  socios: string[]            // nomes do QSA: usados para conferir o nome e guardados só no cache (24h)
  fonte: FonteCnpj
}

// Identifica o app para as fontes. O padrão do Node ("node") é tratado como bot pela Vercel e pelas APIs.
export const CABECALHOS_CONSULTA = {
  accept: 'application/json',
  'user-agent': 'ProcuroQuemFaca/1.0 (+https://procuroquemfaca.com.br)',
}

export type RespostaHttp = { status: number; json: () => Promise<unknown> }
export type Buscador = (url: string, opts: { signal: AbortSignal }) => Promise<RespostaHttp>

export type ResultadoConsulta =
  | { ok: true; dados: DadosCnpj }
  | { ok: false; motivo: 'nao_encontrado' | 'indisponivel' }

// Respostas externas têm formato variável; o mapeamento abaixo confere cada campo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any> | null | undefined

const soDigitos = (v: unknown) => (v == null ? null : String(v).replace(/\D/g, '') || null)
const textoOuNulo = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

/** "dd/mm/aaaa" -> "aaaa-mm-dd"; "aaaa-mm-dd" passa direto. */
function dataIso(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

/** Formato de BrasilAPI e minhareceita (mesmo esquema de campos). */
function mapearEsquemaBrasilApi(j: Json, cnpj: string, fonte: FonteCnpj): DadosCnpj | null {
  if (!j || !textoOuNulo(j.razao_social)) return null
  return {
    cnpj,
    razaoSocial: j.razao_social.trim(),
    nomeFantasia: textoOuNulo(j.nome_fantasia),
    situacao: String(j.descricao_situacao_cadastral ?? j.situacao_cadastral ?? '').trim().toUpperCase(),
    porte: textoOuNulo(j.porte),
    naturezaJuridica: textoOuNulo(j.natureza_juridica),
    mei: j.opcao_pelo_mei === true,
    cnaeCodigo: soDigitos(j.cnae_fiscal),
    cnaeDescricao: textoOuNulo(j.cnae_fiscal_descricao),
    dataAbertura: dataIso(j.data_inicio_atividade),
    socios: Array.isArray(j.qsa) ? j.qsa.map((s: Json) => textoOuNulo(s?.nome_socio)).filter(Boolean) as string[] : [],
    fonte,
  }
}

/** Formato da ReceitaWS (campos e nomes diferentes). */
function mapearReceitaWs(j: Json, cnpj: string): DadosCnpj | null {
  if (!j || j.status === 'ERROR' || !textoOuNulo(j.nome)) return null
  const atividade = Array.isArray(j.atividade_principal) ? j.atividade_principal[0] : undefined
  return {
    cnpj,
    razaoSocial: j.nome.trim(),
    nomeFantasia: textoOuNulo(j.fantasia),
    situacao: String(j.situacao ?? '').trim().toUpperCase(),
    porte: textoOuNulo(j.porte),
    naturezaJuridica: textoOuNulo(j.natureza_juridica),
    mei: j.simei?.optante === true,
    cnaeCodigo: soDigitos(atividade?.code),
    cnaeDescricao: textoOuNulo(atividade?.text),
    dataAbertura: dataIso(j.abertura),
    socios: Array.isArray(j.qsa) ? j.qsa.map((s: Json) => textoOuNulo(s?.nome)).filter(Boolean) as string[] : [],
    fonte: 'receitaws',
  }
}

type Fonte = {
  nome: FonteCnpj
  url: (cnpj: string) => string
  mapear: (json: Json, cnpj: string) => DadosCnpj | null
}

// Ordem da cascata: BrasilAPI, depois espelho, por último ReceitaWS (limite baixo).
export const FONTES: Fonte[] = [
  { nome: 'brasilapi', url: (c) => `https://brasilapi.com.br/api/cnpj/v1/${c}`, mapear: (j, c) => mapearEsquemaBrasilApi(j, c, 'brasilapi') },
  { nome: 'minhareceita', url: (c) => `https://minhareceita.org/${c}`, mapear: (j, c) => mapearEsquemaBrasilApi(j, c, 'minhareceita') },
  { nome: 'receitaws', url: (c) => `https://www.receitaws.com.br/v1/${c}`, mapear: mapearReceitaWs },
]

const TTL_CACHE_MS = 24 * 60 * 60 * 1000
const TIMEOUT_MS = 8000

export type EntradaCache = { dados: DadosCnpj; expiraEm: number }

/**
 * Cache de consultas. Pode ser memória (Map) ou banco (tabela cnpj_consultas_cache).
 * Só guarda respostas com sucesso. Falha de cache nunca derruba a consulta.
 */
export type CacheConsulta = {
  get(cnpj: string): EntradaCache | undefined | Promise<EntradaCache | undefined>
  set(cnpj: string, entrada: EntradaCache): unknown
}

export type OpcoesConsulta = {
  buscar?: Buscador
  fontes?: Fonte[]
  cache?: CacheConsulta
  agora?: () => number
}

/** Cache em memória do processo (padrão para testes e uso sem banco). */
export const cachePadrao = new Map<string, EntradaCache>()

export async function consultarCnpj(cnpj: string, opts: OpcoesConsulta = {}): Promise<ResultadoConsulta> {
  const buscar: Buscador = opts.buscar ?? ((url, o) => fetch(url, { signal: o.signal, headers: CABECALHOS_CONSULTA }))
  const fontes = opts.fontes ?? FONTES
  const cache: CacheConsulta = opts.cache ?? cachePadrao
  const agora = opts.agora ?? Date.now

  let emCache: EntradaCache | undefined
  try {
    emCache = await cache.get(cnpj)
  } catch (erro) {
    console.warn(`[cnpj] cache indisponível na leitura: ${erro instanceof Error ? erro.message : String(erro)}`)
  }
  if (emCache && emCache.expiraEm > agora()) return { ok: true, dados: emCache.dados }

  let todas404 = true
  for (const fonte of fontes) {
    try {
      const resp = await buscar(fonte.url(cnpj), { signal: AbortSignal.timeout(TIMEOUT_MS) })
      // 404 e 400 significam "esta fonte não tem este CNPJ" (a BrasilAPI responde 400 a números que rejeita).
      if (resp.status === 404 || resp.status === 400) continue
      todas404 = false
      if (resp.status !== 200) {
        console.warn(`[cnpj] fonte ${fonte.nome} respondeu HTTP ${resp.status}`)
        continue
      }
      const mapeado = fonte.mapear(await resp.json() as Json, cnpj)
      if (!mapeado) continue
      const dados: DadosCnpj = { ...mapeado, razaoSocial: mapeado.mei ? removerCpfDoNomeMei(mapeado.razaoSocial) : mapeado.razaoSocial }
      try {
        await cache.set(cnpj, { dados, expiraEm: agora() + TTL_CACHE_MS })
      } catch (erro) {
        console.warn(`[cnpj] cache indisponível na gravação: ${erro instanceof Error ? erro.message : String(erro)}`)
      }
      return { ok: true, dados }
    } catch (erro) {
      todas404 = false   // rede, timeout ou JSON inválido: tenta a próxima fonte
      console.warn(`[cnpj] fonte ${fonte.nome} falhou: ${erro instanceof Error ? erro.message : String(erro)}`)
    }
  }
  return { ok: false, motivo: todas404 ? 'nao_encontrado' : 'indisponivel' }
}
