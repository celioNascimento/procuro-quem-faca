// app/api/csp-report/route.ts
//
// Recebe os relatórios da CSP em modo "só relatório" (next.config.ts) e os joga nos logs da Vercel.
// Público de propósito (o navegador envia sem login), então: corpo pequeno, só campos conhecidos, nada é gravado no banco.
import { NextResponse } from 'next/server'

const LIMITE_BYTES = 8_000

const corta = (v: unknown) => (typeof v === 'string' ? v.slice(0, 200) : undefined)

/** Aceita os dois formatos: report-uri ({ "csp-report": {...} }) e Reporting API (lista de { body }). */
export function resumirRelatorio(corpo: unknown): { diretiva?: string; bloqueado?: string; pagina?: string } | null {
  const bruto = Array.isArray(corpo) ? (corpo[0] as { body?: unknown })?.body : (corpo as { 'csp-report'?: unknown })?.['csp-report']
  if (!bruto || typeof bruto !== 'object') return null
  const r = bruto as Record<string, unknown>
  return {
    diretiva: corta(r['violated-directive'] ?? r['effectiveDirective'] ?? r['effective-directive']),
    bloqueado: corta(r['blocked-uri'] ?? r['blockedURL']),
    pagina: corta(r['document-uri'] ?? r['documentURL']),
  }
}

export async function POST(request: Request) {
  const tamanho = Number(request.headers.get('content-length') ?? 0)
  if (tamanho > LIMITE_BYTES) return new NextResponse(null, { status: 413 })
  let texto = ''
  try {
    texto = await request.text()
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  if (texto.length > LIMITE_BYTES) return new NextResponse(null, { status: 413 })
  try {
    const resumo = resumirRelatorio(JSON.parse(texto))
    if (resumo) console.warn('[csp-report]', JSON.stringify(resumo))
  } catch {
    // relatório malformado: ignora
  }
  return new NextResponse(null, { status: 204 })
}
