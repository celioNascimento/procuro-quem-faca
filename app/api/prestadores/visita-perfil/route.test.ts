// @vitest-environment node
//
// app/api/prestadores/visita-perfil/route.test.ts
//
// Testa a ordem e o resultado das regras da rota de visitas, com o banco e o
// Supabase trocados por simulações: robô, pedido inválido, prestador
// inexistente, rastreio desligado, dono do perfil, repetição em 24h, caso
// feliz (origem e campanha vindas do cookie) e erro de banco.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/admin', () => ({ getAdminClient: vi.fn(() => ({ admin: true })) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/services/rastreio.service', () => ({ rastreioAtivoPara: vi.fn() }))
vi.mock('@/lib/services/visitas.service', () => ({
  buscarPrestadorParaVisita: vi.fn(),
  jaContouVisitaRecente: vi.fn(),
  inserirVisita: vi.fn(),
}))

import { POST } from './route'
import { createClient } from '@/lib/supabase/server'
import { rastreioAtivoPara } from '@/lib/services/rastreio.service'
import {
  buscarPrestadorParaVisita,
  inserirVisita,
  jaContouVisitaRecente,
} from '@/lib/services/visitas.service'

const UA_PESSOA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const SID = '11111111-2222-4333-8444-555555555555'

function pedido(
  corpo: unknown,
  { ua = UA_PESSOA, cookie = '', referer = '' }: { ua?: string | null; cookie?: string; referer?: string } = {},
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (ua !== null) headers['User-Agent'] = ua
  if (cookie) headers.Cookie = cookie
  if (referer) headers.Referer = referer
  return new NextRequest('http://localhost/api/prestadores/visita-perfil', {
    method: 'POST',
    headers,
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  })
}

function usuarioLogado(id: string | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: id ? { id, email: 'a@b.c' } : null } }) },
  } as never)
}

const cookieSessaoNaResposta = (r: Response) => r.headers.get('set-cookie') ?? ''

describe('POST /api/prestadores/visita-perfil', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(buscarPrestadorParaVisita).mockResolvedValue({ id: 128, user_id: 'dono-1' })
    vi.mocked(rastreioAtivoPara).mockResolvedValue(true)
    vi.mocked(jaContouVisitaRecente).mockResolvedValue(false)
    vi.mocked(inserirVisita).mockResolvedValue(undefined)
    usuarioLogado(null)
  })

  it.each([{ prestadorId: -5 }, { prestadorId: 0 }, { prestadorId: 'abc' }, { prestadorId: 1.5 }, {}])(
    'recusa pedido inválido com 400 (%j)',
    async (corpo) => {
      const r = await POST(pedido(corpo))
      expect(r.status).toBe(400)
      expect(inserirVisita).not.toHaveBeenCalled()
    },
  )

  it('recusa corpo que não é JSON com 400', async () => {
    const r = await POST(pedido('isto não é json'))
    expect(r.status).toBe(400)
  })

  it('não conta robô e nem consulta o banco', async () => {
    const r = await POST(pedido({ prestadorId: 128 }, { ua: 'Googlebot/2.1' }))
    expect(await r.json()).toEqual({ ok: true, contado: false })
    expect(buscarPrestadorParaVisita).not.toHaveBeenCalled()
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('trata requisição sem user-agent como robô', async () => {
    const r = await POST(pedido({ prestadorId: 128 }, { ua: null }))
    expect((await r.json()).contado).toBe(false)
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('responde 404 quando o prestador não existe', async () => {
    vi.mocked(buscarPrestadorParaVisita).mockResolvedValue(null)
    const r = await POST(pedido({ prestadorId: 999 }))
    expect(r.status).toBe(404)
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('não conta quando o rastreio não está ativo para o prestador', async () => {
    vi.mocked(rastreioAtivoPara).mockResolvedValue(false)
    const r = await POST(pedido({ prestadorId: 128 }))
    expect(await r.json()).toEqual({ ok: true, contado: false })
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('não conta a visita do próprio dono do perfil', async () => {
    usuarioLogado('dono-1')
    const r = await POST(pedido({ prestadorId: 128 }))
    expect((await r.json()).contado).toBe(false)
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('conta a visita de outro usuário logado', async () => {
    usuarioLogado('outra-pessoa')
    const r = await POST(pedido({ prestadorId: 128 }))
    expect((await r.json()).contado).toBe(true)
    expect(inserirVisita).toHaveBeenCalledTimes(1)
  })

  it('não conta repetição da mesma sessão nas últimas 24h', async () => {
    vi.mocked(jaContouVisitaRecente).mockResolvedValue(true)
    const r = await POST(pedido({ prestadorId: 128 }, { cookie: `pqf_sid=${SID}` }))
    expect((await r.json()).contado).toBe(false)
    expect(jaContouVisitaRecente).toHaveBeenCalledWith({ admin: true }, 128, SID)
    expect(inserirVisita).not.toHaveBeenCalled()
  })

  it('grava a visita com origem e campanha vindas do cookie pqf_origem', async () => {
    const cookieOrigem = encodeURIComponent(JSON.stringify({ o: 'meta', c: 'gleba-palhano' }))
    const r = await POST(pedido({ prestadorId: 128 }, { cookie: `pqf_sid=${SID}; pqf_origem=${cookieOrigem}` }))

    expect(await r.json()).toEqual({ ok: true, contado: true })
    expect(inserirVisita).toHaveBeenCalledWith(
      { admin: true },
      { prestadorId: 128, origem: 'meta', campanha: 'gleba-palhano', sessaoId: SID },
    )
    // sessão já existia: não troca o cookie
    expect(cookieSessaoNaResposta(r)).not.toContain('pqf_sid=')
  })

  it('usa o utm do referer quando não há cookie de origem', async () => {
    const r = await POST(
      pedido(
        { prestadorId: 128 },
        { cookie: `pqf_sid=${SID}`, referer: 'http://localhost/perfil?utm_source=Meta&utm_campaign=Teste' },
      ),
    )
    expect((await r.json()).contado).toBe(true)
    expect(inserirVisita).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({ origem: 'meta', campanha: 'teste' }),
    )
  })

  it("grava origem 'direto' quando não há cookie nem utm", async () => {
    await POST(pedido({ prestadorId: 128 }, { cookie: `pqf_sid=${SID}` }))
    expect(inserirVisita).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({ origem: 'direto', campanha: null }),
    )
  })

  it('cria o cookie de sessão pqf_sid quando a pessoa ainda não tem', async () => {
    const r = await POST(pedido({ prestadorId: 128 }))
    expect((await r.json()).contado).toBe(true)
    const setCookie = cookieSessaoNaResposta(r)
    expect(setCookie).toMatch(/pqf_sid=[0-9a-f-]{36}/i)
    expect(setCookie.toLowerCase()).toContain('httponly')
    const [, visita] = vi.mocked(inserirVisita).mock.calls[0]
    expect(setCookie).toContain(visita.sessaoId)
  })

  it('responde 500 quando o banco falha ao gravar', async () => {
    vi.mocked(inserirVisita).mockRejectedValue(new Error('banco fora'))
    const r = await POST(pedido({ prestadorId: 128 }, { cookie: `pqf_sid=${SID}` }))
    expect(r.status).toBe(500)
  })
})