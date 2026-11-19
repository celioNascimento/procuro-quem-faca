import { describe, expect, it } from 'vitest'
import nextConfig, { CABECALHOS_DE_SEGURANCA } from '@/next.config'

describe('cabeçalhos de segurança do site', () => {
  it('valem para todas as rotas', async () => {
    const regras = await nextConfig.headers!()
    expect(regras).toHaveLength(1)
    expect(regras[0].source).toBe('/:path*')
    expect(regras[0].headers).toEqual(CABECALHOS_DE_SEGURANCA)
  })
  it('têm os essenciais: nosniff, anti-iframe, referrer, HSTS e permissões', () => {
    const m = Object.fromEntries(CABECALHOS_DE_SEGURANCA.map(h => [h.key, h.value]))
    expect(m['X-Content-Type-Options']).toBe('nosniff')
    expect(m['X-Frame-Options']).toBe('DENY')
    expect(m['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(m['Strict-Transport-Security']).toMatch(/max-age=\d{8,}/)
    expect(m['Permissions-Policy']).toMatch(/microphone=\(\)/)
  })
})
