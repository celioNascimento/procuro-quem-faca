import { describe, expect, it } from 'vitest'
import nextConfig, { CABECALHOS_DE_SEGURANCA, CSP_EM_RELATORIO, CSP_ENFORCADA } from '@/next.config'

describe('cabeçalhos de segurança do site', () => {
  it('valem para todas as rotas', async () => {
    const regras = await nextConfig.headers!()
    expect(regras).toHaveLength(1)
    expect(regras[0].source).toBe('/:path*')
    expect(regras[0].headers).toEqual(expect.arrayContaining(CABECALHOS_DE_SEGURANCA))
  })
  it('têm os essenciais: nosniff, anti-iframe, referrer, HSTS e permissões', () => {
    const m = Object.fromEntries(CABECALHOS_DE_SEGURANCA.map(h => [h.key, h.value]))
    expect(m['X-Content-Type-Options']).toBe('nosniff')
    expect(m['X-Frame-Options']).toBe('DENY')
    expect(m['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(m['Strict-Transport-Security']).toMatch(/max-age=\d{8,}/)
    expect(m['Permissions-Policy']).toMatch(/microphone=\(\)/)
  })

  it('CSP enforçada fecha plugins, <base> e iframe de terceiros; a completa só reporta', async () => {
    const h = Object.fromEntries((await nextConfig.headers!())[0].headers.map(x => [x.key, x.value]))
    expect(h['Content-Security-Policy']).toBe(CSP_ENFORCADA)
    expect(CSP_ENFORCADA).toMatch(/object-src 'none'/)
    expect(CSP_ENFORCADA).toMatch(/base-uri 'self'/)
    expect(CSP_ENFORCADA).toMatch(/frame-ancestors 'none'/)
    expect(h['Content-Security-Policy-Report-Only']).toBe(CSP_EM_RELATORIO)
    expect(CSP_EM_RELATORIO).toMatch(/report-uri \/api\/csp-report/)
    expect(CSP_EM_RELATORIO).toMatch(/default-src 'self'/)
  })
  it('a política completa libera só as origens que o site usa (Supabase, Google, Vercel)', () => {
    expect(CSP_EM_RELATORIO).toMatch(/connect-src[^;]*https:\/\/\*\.supabase\.co/)
    expect(CSP_EM_RELATORIO).toMatch(/img-src[^;]*lh3\.googleusercontent\.com/)
    expect(CSP_EM_RELATORIO).not.toMatch(/\*(\s|;|$)/)
  })
})
