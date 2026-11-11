import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enviarEmail } from '@/lib/notificacoes/email'

const email = { assunto: 'Assunto', texto: 'Texto' }
const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  fetchMock.mockReset()
})

describe('enviarEmail', () => {
  it('sem chave não envia nada e não quebra', async () => {
    await expect(enviarEmail(email, {})).resolves.toEqual({ enviado: false, motivo: 'sem_chave' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envia para o destino padrão com a chave no cabeçalho', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    await expect(enviarEmail(email, { RESEND_API_KEY: 're_teste' })).resolves.toEqual({ enviado: true })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers.Authorization).toBe('Bearer re_teste')
    const corpo = JSON.parse(init.body)
    expect(corpo.to).toEqual(['procuroquemfaca@gmail.com'])
    expect(corpo.subject).toBe('Assunto')
    expect(corpo.text).toBe('Texto')
  })

  it('respeita destino e remetente configurados', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    await enviarEmail(email, {
      RESEND_API_KEY: 're_teste',
      NOTIFICACAO_EMAIL_DESTINO: 'outro@exemplo.com',
      NOTIFICACAO_EMAIL_REMETENTE: 'PQF <avisos@meudominio.com>',
    })
    const corpo = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(corpo.to).toEqual(['outro@exemplo.com'])
    expect(corpo.from).toBe('PQF <avisos@meudominio.com>')
  })

  it('serviço recusando vira resultado, não exceção', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 })
    await expect(enviarEmail(email, { RESEND_API_KEY: 're_teste' })).resolves.toEqual({
      enviado: false, motivo: 'erro_servico', status: 403,
    })
  })

  it('falha de rede vira resultado, não exceção', async () => {
    fetchMock.mockRejectedValue(new Error('rede'))
    await expect(enviarEmail(email, { RESEND_API_KEY: 're_teste' })).resolves.toEqual({
      enviado: false, motivo: 'erro_rede',
    })
  })

  it('nunca escreve a chave no log', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 })
    await enviarEmail(email, { RESEND_API_KEY: 're_segredo_123' })
    const logado = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logado).not.toContain('re_segredo_123')
  })
})
