// lib/tracking/navegadorAutomatizado.ts
// Decide, no navegador, se quem está na página parece um robô ou um navegador automatizado.
// Serve só para NÃO gravar eventos de busca e de visita vindos de varredura. Nada do navegador
// é guardado: o resultado é só "grava" ou "não grava". Função pura (recebe o navegador).

import { isBot } from './isBot'

export interface NavegadorLike {
  userAgent?: string | null
  /** true quando o navegador é controlado por automação (Selenium, Puppeteer, Playwright). */
  webdriver?: boolean | null
}

export function pareceAutomatizado(nav: NavegadorLike | null | undefined): boolean {
  if (!nav) return false // sem navegador (servidor): quem chama decide; não bloqueia por si só
  if (nav.webdriver === true) return true
  return isBot(nav.userAgent)
}
