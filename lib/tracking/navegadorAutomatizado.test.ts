import { describe, expect, it } from 'vitest'
import { pareceAutomatizado } from './navegadorAutomatizado'

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

describe('pareceAutomatizado', () => {
  it('navegador comum não é automatizado', () => {
    expect(pareceAutomatizado({ userAgent: CHROME, webdriver: false })).toBe(false)
  })
  it('webdriver ligado (Selenium, Puppeteer, Playwright) é automatizado, mesmo com user-agent normal', () => {
    expect(pareceAutomatizado({ userAgent: CHROME, webdriver: true })).toBe(true)
  })
  it('user-agent de robô ou de Chrome sem cabeça é automatizado', () => {
    expect(pareceAutomatizado({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).toBe(true)
    expect(pareceAutomatizado({ userAgent: 'Mozilla/5.0 HeadlessChrome/130.0' })).toBe(true)
  })
  it('sem user-agent é automatizado; sem navegador (servidor) não bloqueia', () => {
    expect(pareceAutomatizado({ userAgent: '' })).toBe(true)
    expect(pareceAutomatizado(null)).toBe(false)
  })
})
