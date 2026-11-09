// lib/navegacao.ts
//
// Regras de navegação "voltar" do app — fonte única.
//
// Princípio: "voltar" desfaz a navegação (history.back), não cria uma nova entrada
// no histórico. Só quando NÃO há para onde voltar dentro do app (abriu o link direto,
// em nova aba, vindo do Google/WhatsApp) é que se vai para uma rota de fallback.
//
// Sem isso, o botão da seta fazia `push` para a lista: o botão "voltar" do navegador
// levava de volta ao perfil, e o usuário ficava preso num laço perfil ⇄ lista.

const CHAVE_SCROLL = 'pqf:scroll:'
const JANELA_HISTORICO_MS = 15_000

type NavigationApi = { canGoBack?: boolean }

/**
 * Aceita apenas caminhos internos ("/x", "/x?y=1"). Bloqueia "//host", "http://…" e "\\".
 * O valor já deve vir decodificado (URLSearchParams.get decodifica uma vez).
 */
export function sanitizarRotaInterna(valor: string | null | undefined, fallback = '/prestadores'): string {
  if (!valor) return fallback
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.includes('\\')) return fallback
  return valor
}

/** Existe uma entrada anterior do próprio app no histórico? */
export function podeVoltarNoApp(): boolean {
  if (typeof window === 'undefined') return false

  // Navigation API: só enxerga entradas do mesmo site, que é exatamente o que queremos.
  const nav = (window as unknown as { navigation?: NavigationApi }).navigation
  if (nav && typeof nav.canGoBack === 'boolean') return nav.canGoBack

  // Fallback para navegadores sem Navigation API.
  if (window.history.length <= 1) return false
  try {
    return new URL(document.referrer).origin === window.location.origin
  } catch {
    return false
  }
}

interface RouterMinimo {
  back: () => void
  push: (href: string) => void
  replace: (href: string) => void
}

/** Volta no histórico; se não houver entrada do app, substitui pela rota de fallback. */
export function voltarOuIr(router: RouterMinimo, fallback: string): void {
  if (podeVoltarNoApp()) {
    marcarNavegacaoPorHistorico()
    router.back()
    return
  }
  router.replace(fallback)
}

// ─── Restauração de scroll ao voltar ────────────────────────────────────────

function chaveScroll(): string {
  return CHAVE_SCROLL + window.location.pathname + window.location.search
}

/** Guarda a posição de rolagem da URL atual (chamado enquanto o usuário rola). */
export function salvarScroll(): void {
  try {
    sessionStorage.setItem(chaveScroll(), String(Math.round(window.scrollY)))
  } catch {
    /* sessionStorage indisponível: segue sem restaurar */
  }
}

/** Registra que a navegação atual veio do histórico (voltar/avançar). */
export function marcarNavegacaoPorHistorico(): void {
  ;(window as unknown as { __pqfHistorico?: number }).__pqfHistorico = Date.now()
}

/**
 * Só restaura o scroll quando a chegada foi por voltar/avançar. Uma visita nova
 * (clicou num link) sempre começa no topo. Consome o marcador para valer uma vez.
 */
export function consumirScrollSalvo(): number | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { __pqfHistorico?: number }
  const marcador = w.__pqfHistorico
  if (!marcador || Date.now() - marcador > JANELA_HISTORICO_MS) return null

  try {
    const bruto = sessionStorage.getItem(chaveScroll())
    if (bruto === null) return null
    const y = Number(bruto)
    if (!Number.isFinite(y) || y <= 0) return null
    w.__pqfHistorico = undefined
    return y
  } catch {
    return null
  }
}
