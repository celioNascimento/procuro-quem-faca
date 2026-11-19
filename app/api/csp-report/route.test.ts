import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST, resumirRelatorio } from './route'

afterEach(() => vi.restoreAllMocks())

const pedido = (corpo: string, extra: Record<string, string> = {}) =>
  new Request('http://x/api/csp-report', { method: 'POST', body: corpo, headers: extra })

describe('/api/csp-report', () => {
  it('registra o resumo do relatório (formato report-uri) e responde 204', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = await POST(pedido(JSON.stringify({ 'csp-report': { 'violated-directive': 'img-src', 'blocked-uri': 'https://evil.test/x.png', 'document-uri': 'https://pqf.test/feed', cookie: 'segredo' } })))
    expect(r.status).toBe(204)
    expect(aviso).toHaveBeenCalledTimes(1)
    expect(String(aviso.mock.calls[0][1])).toContain('img-src')
    expect(String(aviso.mock.calls[0][1])).not.toContain('segredo')
  })
  it('aceita também o formato da Reporting API', () => {
    expect(resumirRelatorio([{ body: { effectiveDirective: 'script-src', blockedURL: 'inline', documentURL: 'https://pqf.test/' } }])).toEqual({ diretiva: 'script-src', bloqueado: 'inline', pagina: 'https://pqf.test/' })
  })
  it('corpo grande demais é recusado (413) e lixo é ignorado sem erro', async () => {
    expect((await POST(pedido('x'.repeat(9000)))).status).toBe(413)
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect((await POST(pedido('não é json'))).status).toBe(204)
    expect(aviso).not.toHaveBeenCalled()
  })
})
