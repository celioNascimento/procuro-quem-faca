import { describe, it, expect } from 'vitest'
import { isBot } from './isBot'

describe('isBot', () => {
  it('detecta o Googlebot', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true)
  })

  it('detecta pré-visualização de links do WhatsApp e do Facebook', () => {
    expect(isBot('WhatsApp/2.23.20.0 A')).toBe(true)
    expect(isBot('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(true)
  })

  it('detecta scripts e ferramentas de teste', () => {
    expect(isBot('curl/8.4.0')).toBe(true)
    expect(isBot('python-requests/2.31.0')).toBe(true)
    expect(isBot('Mozilla/5.0 (Linux; Android 11) Chrome-Lighthouse')).toBe(true)
  })

  it('trata user-agent vazio ou ausente como robô', () => {
    expect(isBot('')).toBe(true)
    expect(isBot(null)).toBe(true)
    expect(isBot(undefined)).toBe(true)
  })

  it('NÃO trata pessoas reais como robô', () => {
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe(false)
    expect(isBot('Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36')).toBe(false)
  })

  it('NÃO trata navegadores embutidos de Instagram e Facebook como robô', () => {
    expect(isBot('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.29.110')).toBe(false)
    expect(isBot('Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/118.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/430.0.0.0;]')).toBe(false)
  })
})
