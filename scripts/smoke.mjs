#!/usr/bin/env node
// scripts/smoke.mjs — Teste automático de fumaça do PQF
//
// USO (precisa de Node 18 ou mais novo):
//   node scripts/smoke.mjs                          confere a produção (somente leitura)
//   node scripts/smoke.mjs --base http://localhost:3000 --writes
//                                                   também testa o registro de cliques e de
//                                                   visitas (GRAVA linhas com campanha 'teste')
// OPÇÕES:
//   --base URL            endereço do site (padrão: https://procuroquemfaca.com.br)
//   --slugs a,b,c         slugs com "-em-" para conferir (padrão: busca no Supabase)
//   --servico slug        página de serviço a conferir (padrão: pedreiro-em-londrina)
//   --amostra-id N        prestador DENTRO da amostra (padrão: 145)
//   --fora-id N           prestador FORA da amostra (padrão: 41)
//   --modo todos|amostra  modo do rastreio no banco (padrão: todos, o de produção desde
//                         28/10). Com 'todos' o teste "fora da amostra" é pulado, porque
//                         nesse modo todo prestador é contado.
//   --writes              liga os testes que gravam dados (clique e visita)
//   --confirmo-producao   necessário para --writes em endereço que não seja localhost
//
// Os testes de leitura NÃO alteram nada. Os testes de escrita gravam no banco real
// (você só tem um banco) usando campanha 'teste'. Depois, apague com:
//   delete from public.cliques where campanha = 'teste';
//   delete from public.visitas_perfil where campanha = 'teste';

import { existsSync, readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const flag = (nome) => args.includes(`--${nome}`)
const opcao = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : padrao
}

const BASE = opcao('base', 'https://procuroquemfaca.com.br').replace(/\/$/, '')
const SERVICO = opcao('servico', 'pedreiro-em-londrina')
const ID_AMOSTRA = Number(opcao('amostra-id', '145'))
const ID_FORA = Number(opcao('fora-id', '41'))
const MODO = opcao('modo', 'todos')
const UA_PESSOA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const REFERER = `${BASE}/perfil-de-teste?utm_source=meta&utm_campaign=teste`

// ── variáveis do Supabase (para listar slugs): ambiente ou .env.local ─────────
function lerEnvLocal() {
  const saida = {}
  if (!existsSync('.env.local')) return saida
  for (const linha of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) saida[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return saida
}
const envLocal = lerEnvLocal()
const pegar = (...nomes) => nomes.map((n) => process.env[n] || envLocal[n]).find(Boolean)
const SUPABASE_URL = pegar('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_CHAVE = pegar(
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
)

// ── utilidades ───────────────────────────────────────────────────────────────
const resultados = []
async function teste(nome, fn) {
  try {
    const r = await fn()
    if (r === 'PULOU') resultados.push({ nome, estado: 'PULOU' })
    else resultados.push({ nome, estado: 'PASSOU' })
  } catch (erro) {
    resultados.push({ nome, estado: 'FALHOU', detalhe: erro.message })
  }
}
function garantir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem)
}
const buscar = (url, init = {}) =>
  fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), ...init })

const semAcento = (t) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

function decodificarHtml(t) {
  return t
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
function tituloDe(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m ? decodificarHtml(m[1]) : ''
}

async function listarSlugsComEm() {
  const manual = opcao('slugs', '')
  if (manual) return manual.split(',').map((s) => ({ slug: s.trim(), nome: null })).filter((s) => s.slug)
  if (!SUPABASE_URL || !SUPABASE_CHAVE) return null
  const url =
    `${SUPABASE_URL}/rest/v1/prestadores?select=slug,nome&status=eq.ativo` +
    `&slug=like.*-em-*&limit=5`
  const r = await buscar(url, { headers: { apikey: SUPABASE_CHAVE, Authorization: `Bearer ${SUPABASE_CHAVE}` } })
  garantir(r.ok, `Supabase respondeu ${r.status} ao listar slugs`)
  return await r.json()
}

// ── testes de leitura ────────────────────────────────────────────────────────
await teste('Página inicial abre (200)', async () => {
  const r = await buscar(`${BASE}/`)
  garantir(r.status === 200, `status ${r.status}`)
})

await teste(`Página de serviço abre (/${SERVICO})`, async () => {
  const r = await buscar(`${BASE}/${SERVICO}`)
  garantir(r.status === 200, `status ${r.status}`)
})

let slugs = null
try { slugs = await listarSlugsComEm() } catch (e) { resultados.push({ nome: 'Listar perfis com -em- no slug', estado: 'FALHOU', detalhe: e.message }) }

if (slugs === null) {
  resultados.push({ nome: 'Perfis com -em- no slug abrem o perfil', estado: 'PULOU', detalhe: 'sem Supabase (.env.local) e sem --slugs' })
} else if (slugs.length === 0) {
  resultados.push({ nome: 'Perfis com -em- no slug abrem o perfil', estado: 'PULOU', detalhe: 'nenhum slug encontrado' })
} else {
  for (const { slug, nome } of slugs) {
    await teste(`Perfil com -em- abre o PERFIL (/${slug})`, async () => {
      const r = await buscar(`${BASE}/${slug}`)
      garantir(r.status === 200, `status ${r.status}`)
      const titulo = tituloDe(await r.text())
      garantir(!/n[aã]o encontrado/i.test(titulo), `título é "${titulo}"`)
      if (nome) {
        const trecho = semAcento(nome).slice(0, 12)
        garantir(semAcento(titulo).includes(trecho), `título "${titulo}" não menciona "${nome}" (abriu outra página?)`)
      }
    })
  }
}

await teste('Perfil inexistente é marcado noindex', async () => {
  const r = await buscar(`${BASE}/perfil-que-nao-existe-zzz9`)
  const html = await r.text()
  garantir(/noindex/i.test(html), 'a página não tem noindex (o page.tsx corrigido está no ar?)')
})

// ── Tarefa 4: cookie de origem/campanha (pqf_origem) ──────────────────────────
// Só leitura: não grava nada no banco, só confere o Set-Cookie da resposta.
function cookiesDe(r) {
  return typeof r.headers.getSetCookie === 'function'
    ? r.headers.getSetCookie()
    : [r.headers.get('set-cookie') || '']
}
function decodificarPqfOrigem(linhaDeCookie) {
  const valor = linhaDeCookie.split(';')[0].split('=').slice(1).join('=')
  return JSON.parse(decodeURIComponent(valor))
}

// O domínio raiz (apex) redireciona para o www direto na Vercel, ANTES de
// qualquer código do Next.js rodar — esse primeiro salto nunca vai ter o
// Set-Cookie do proxy.ts, porque o proxy.ts não chega a ser chamado nele.
// Um visitante de verdade sempre segue o redirect e o cookie é gravado só
// na resposta final (em www). Por isso seguimos os saltos manualmente
// (até 5, por segurança) acumulando os Set-Cookie de cada um, em vez de
// olhar só a primeira resposta.
async function buscarAcumulandoCookies(url, init = {}) {
  let atual = url
  const cookies = []
  for (let i = 0; i < 5; i++) {
    const r = await buscar(atual, { ...init, redirect: 'manual' })
    cookies.push(...cookiesDe(r))
    const isRedirect = r.status >= 300 && r.status < 400
    const local = r.headers.get('location')
    if (!isRedirect || !local) return { resposta: r, cookies }
    atual = new URL(local, atual).toString()
  }
  throw new Error(`mais de 5 redirects seguindo ${url} — loop de domínio?`)
}

await teste('Cookie pqf_origem é gravado com utm na URL', async () => {
  const { cookies } = await buscarAcumulandoCookies(`${BASE}/?utm_source=smoke&utm_campaign=teste-cookie`)
  const linha = cookies.find((c) => c.startsWith('pqf_origem='))
  garantir(linha, 'nenhum Set-Cookie pqf_origem em nenhum salto (proxy.ts está rodando na home? veja o matcher)')
  const dados = decodificarPqfOrigem(linha)
  garantir(dados.o === 'smoke', `origem esperada 'smoke', veio '${dados.o}'`)
  garantir(dados.c === 'teste-cookie', `campanha esperada 'teste-cookie', veio '${dados.c}'`)
})

await teste('Cookie pqf_origem NÃO é sobrescrito se já existir (first-touch)', async () => {
  const cookieExistente = encodeURIComponent(JSON.stringify({ o: 'google', c: 'seo' }))
  const { cookies } = await buscarAcumulandoCookies(`${BASE}/?utm_source=outro&utm_campaign=outro`, {
    headers: { Cookie: `pqf_origem=${cookieExistente}` },
  })
  const linha = cookies.find((c) => c.startsWith('pqf_origem='))
  garantir(!linha, 'o cookie foi sobrescrito mesmo já existindo (quebra a regra de primeiro toque)')
})

await teste('Sem utm na URL, nenhum cookie pqf_origem é gravado', async () => {
  const { cookies } = await buscarAcumulandoCookies(`${BASE}/`)
  const linha = cookies.find((c) => c.startsWith('pqf_origem='))
  garantir(!linha, 'um cookie pqf_origem foi gravado sem nenhum utm na URL')
})

// ── testes de escrita (clique) ───────────────────────────────────────────────
if (flag('writes')) {
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)
  if (!local && !flag('confirmo-producao')) {
    resultados.push({
      nome: 'Testes de escrita (clique)', estado: 'PULOU',
      detalhe: 'base não é localhost; use --confirmo-producao se for mesmo gravar na produção',
    })
  } else {
    const rota = `${BASE}/api/prestadores/clique-whatsapp`
    async function clicar(prestadorId, { ua = UA_PESSOA, cookie = '' } = {}) {
      const r = await buscar(rota, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'User-Agent': ua, Referer: REFERER,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({ prestadorId }),
      })
      const lista = typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [r.headers.get('set-cookie') || '']
      const sessao = lista.join(';').match(/pqf_sid=[^;,\s]+/)
      let json = null
      try { json = await r.json() } catch { /* sem corpo JSON */ }
      return { status: r.status, json, cookie: sessao ? sessao[0] : '' }
    }
    const regrasNovas = (j) => j && typeof j.contado === 'boolean'
    let cookieSessao = ''

    await teste('Clique válido na amostra é contado', async () => {
      const r = await clicar(ID_AMOSTRA)
      garantir(r.status === 200, r.status === 500
        ? 'status 500: confira se SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) está no .env.local e reinicie o pnpm dev'
        : `status ${r.status}`)
      garantir(regrasNovas(r.json), 'resposta sem o campo contado (rota ANTIGA no ar?)')
      garantir(r.json.contado === true, `esperava contado=true e veio ${JSON.stringify(r.json)}`)
      cookieSessao = r.cookie
      garantir(cookieSessao, 'a rota não devolveu o cookie de sessão pqf_sid')
    })
    await teste('Repetir o clique na mesma sessão NÃO conta', async () => {
      garantir(cookieSessao, 'depende do teste anterior')
      const r = await clicar(ID_AMOSTRA, { cookie: cookieSessao })
      garantir(r.json && r.json.contado === false, `esperava contado=false e veio ${JSON.stringify(r.json)}`)
    })
    await teste('Robô (Googlebot) NÃO conta', async () => {
      const r = await clicar(ID_AMOSTRA, { ua: 'Googlebot/2.1' })
      garantir(r.json && r.json.contado === false, `esperava contado=false e veio ${JSON.stringify(r.json)}`)
    })
    await teste('Prestador fora da amostra NÃO conta', async () => {
      if (MODO !== 'amostra') return 'PULOU' // no modo todos, todo prestador é contado
      const r = await clicar(ID_FORA)
      garantir(r.json && r.json.contado === false, `esperava contado=false e veio ${JSON.stringify(r.json)}`)
    })
    await teste('Pedido inválido é recusado (400)', async () => {
      const r = await clicar(-5)
      garantir(r.status === 400, `status ${r.status}`)
    })

    // ── visitas ao perfil (gravadas pelo servidor) ──────────────────────────
    const rotaVisita = `${BASE}/api/prestadores/visita-perfil`
    async function visitar(prestadorId, { ua = UA_PESSOA, cookie = '' } = {}) {
      const r = await buscar(rotaVisita, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'User-Agent': ua, Referer: REFERER,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify({ prestadorId }),
      })
      const lista = typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie() : [r.headers.get('set-cookie') || '']
      const sessao = lista.join(';').match(/pqf_sid=[^;,\s]+/)
      let json = null
      try { json = await r.json() } catch { /* sem corpo JSON */ }
      return { status: r.status, json, cookie: sessao ? sessao[0] : '' }
    }
    let cookieVisita = ''

    await teste('Visita válida é contada', async () => {
      const r = await visitar(ID_AMOSTRA)
      garantir(r.status !== 404, 'rota /api/prestadores/visita-perfil não encontrada (deploy antigo no ar?)')
      garantir(r.status === 200, r.status === 500
        ? 'status 500: confira SUPABASE_SERVICE_ROLE_KEY e se a tabela visitas_perfil tem origem, campanha e sessao_id'
        : `status ${r.status}`)
      garantir(r.json && r.json.contado === true, `esperava contado=true e veio ${JSON.stringify(r.json)}`)
      cookieVisita = r.cookie
      garantir(cookieVisita, 'a rota não devolveu o cookie de sessão pqf_sid')
    })
    await teste('Repetir a visita na mesma sessão NÃO conta', async () => {
      garantir(cookieVisita, 'depende do teste anterior')
      const r = await visitar(ID_AMOSTRA, { cookie: cookieVisita })
      garantir(r.json && r.json.contado === false, `esperava contado=false e veio ${JSON.stringify(r.json)}`)
    })
    await teste('Visita de robô (Googlebot) NÃO conta', async () => {
      const r = await visitar(ID_AMOSTRA, { ua: 'Googlebot/2.1' })
      garantir(r.json && r.json.contado === false, `esperava contado=false e veio ${JSON.stringify(r.json)}`)
    })
    await teste('Visita com pedido inválido é recusada (400)', async () => {
      const r = await visitar(-5)
      garantir(r.status === 400, `status ${r.status}`)
    })
  }
}

// ── resultado ────────────────────────────────────────────────────────────────
console.log(`\nTeste de fumaça — ${BASE}\n`)
for (const r of resultados) {
  const icone = r.estado === 'PASSOU' ? '✅' : r.estado === 'PULOU' ? '⏭️ ' : '❌'
  console.log(`${icone} ${r.estado.padEnd(6)} ${r.nome}${r.detalhe ? `\n     → ${r.detalhe}` : ''}`)
}
const falhas = resultados.filter((r) => r.estado === 'FALHOU').length
console.log(`\n${resultados.filter((r) => r.estado === 'PASSOU').length} passaram, ${falhas} falharam, ${resultados.filter((r) => r.estado === 'PULOU').length} pulados.`)
if (flag('writes')) {
  console.log("Lembrete: apague os testes com:")
  console.log("  delete from public.cliques where campanha = 'teste';")
  console.log("  delete from public.visitas_perfil where campanha = 'teste';")
}
process.exit(falhas > 0 ? 1 : 0)
