// lib/db/visitasPerfil.test.ts
//
// Testa só o lado do navegador do registro de visitas: quando chama o servidor,
// quando NÃO chama (cookie, pedido em andamento, id inválido) e quando grava o
// cookie de dedupe. As regras de verdade (robô, dono, 24h, amostra) ficam no
// servidor e são conferidas pelo scripts/smoke.mjs.

import { beforeEach, describe, expect, it, vi } from 'vitest'

// O módulo importa o cliente do Supabase do navegador; aqui ele não é usado.
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { registrarVisitaPerfil } from '@/lib/db/visitasPerfil'

const ROTA = '/api/prestadores/visita-perfil'

function limparCookies() {
  for (const parte of document.cookie.split('; ')) {
    const nome = parte.split('=')[0]
    if (nome) document.cookie = `${nome}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }
}

function respostaOk(contado = true) {
  return { ok: true, status: 200, json: async () => ({ ok: true, contado }) } as Response
}

describe('registrarVisitaPerfil', () => {
  beforeEach(() => {
    limparCookies()
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('chama a rota do servidor com o id e keepalive', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaOk())

    await registrarVisitaPerfil(128)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(ROTA)
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
    expect(JSON.parse(String(init.body))).toEqual({ prestadorId: 128 })
  })

  it('aceita o id como texto e envia como número', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaOk())

    await registrarVisitaPerfil('77')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({ prestadorId: 77 })
  })

  it('grava o cookie de 24h e não chama de novo para o mesmo prestador', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaOk())

    await registrarVisitaPerfil(5)
    await registrarVisitaPerfil(5)

    expect(document.cookie).toContain('pqf_visita_perfil_5=')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('grava o cookie mesmo quando o servidor ignora a visita (contado=false)', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaOk(false))

    await registrarVisitaPerfil(6)
    await registrarVisitaPerfil(6)

    expect(document.cookie).toContain('pqf_visita_perfil_6=')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('não repete o pedido enquanto o primeiro ainda está em andamento', async () => {
    let liberar: (r: Response) => void = () => {}
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => new Promise<Response>((resolve) => { liberar = resolve }))

    const primeira = registrarVisitaPerfil(9)
    const segunda = registrarVisitaPerfil(9)
    liberar(respostaOk())
    await Promise.all([primeira, segunda])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('não grava o cookie quando o servidor responde erro, e tenta de novo depois', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce(respostaOk())

    await registrarVisitaPerfil(11)
    expect(document.cookie).not.toContain('pqf_visita_perfil_11=')

    await registrarVisitaPerfil(11)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(document.cookie).toContain('pqf_visita_perfil_11=')
  })

  it('não quebra a página se a rede falhar', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('rede fora'))

    await expect(registrarVisitaPerfil(12)).resolves.toBeUndefined()
    expect(document.cookie).not.toContain('pqf_visita_perfil_12=')
  })

  it.each([0, -3, 1.5, 'abc', NaN])('ignora id inválido (%s) sem chamar o servidor', async (invalido) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaOk())

    await registrarVisitaPerfil(invalido as number | string)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})