//lib/services/compartilharPerfil.service.ts

import { insertLog } from '@/lib/db/logs'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'


// ── Tipos ──────────────────────────────────────────────────────────────────

export interface CompartilhamentoPayload {
  prestador: Pick<PrestadorPerfil, 'id' | 'nome' | 'slug' | 'foto_perfil' | 'categorias' | 'categoria'>
  projetos: ProjetoPerfil[]
  totalFinalizados: number
  totalEmAndamento: number
  urlPerfil: string
}

export interface RegistroCompartilhamento {
  prestador_id: number
  canal: 'native_share' | 'clipboard' | 'whatsapp' | 'link_direto'
  origem: 'perfil_publico' | 'dashboard' | 'pagina_sucesso'
}

// ── Funções de URL ─────────────────────────────────────────────────────────

export function buildUrlPerfil(slug: string | null | undefined, prestadorId: number | string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  if (slug?.trim()) return `${base}/prestadores/${slug}`
  return `${base}/prestadores/${String(prestadorId)}`
}

export function buildTextoPadrao(
  nomePrestador: string,
  categoria: string | null | undefined,
  totalFinalizados: number
): string {
  const catTexto = categoria ? ` — ${categoria}` : ''
  const projTexto =
    totalFinalizados > 0
      ? ` Já ${totalFinalizados > 1 ? `concluiu ${totalFinalizados} serviços` : 'concluiu 1 serviço'} registrado${totalFinalizados > 1 ? 's' : ''}.`
      : ''

  return `Confira o perfil de *${nomePrestador}*${catTexto} no Procuro Quem Faça.${projTexto}`
}

export function buildTextoWhatsApp(
  nomePrestador: string,
  categoria: string | null | undefined,
  totalFinalizados: number,
  urlPerfil: string
): string {
  const catTexto = categoria ? ` (${categoria})` : ''
  const projTexto =
    totalFinalizados > 0
      ? `\n✅ ${totalFinalizados} serviço${totalFinalizados > 1 ? 's' : ''} finalizado${totalFinalizados > 1 ? 's' : ''} com registro de fotos.`
      : ''

  return (
    `Olá! Encontrei este profissional no *Procuro Quem Faça*:\n\n` +    
    `👷 *${nomePrestador}*${catTexto}${projTexto}\n\n` +    
    `🔗 ${urlPerfil}`
  )
}

// ── Compartilhamento nativo / clipboard ───────────────────────────────────

// navigator.share existe em alguns desktops (Chrome/Edge) mas trava aguardando
// uma UI nativa que nunca aparece — restringimos ao mobile via pointer: coarse
function isMobileShare(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}

export async function compartilharViaNative(
  titulo: string,
  texto: string,
  url: string
): Promise<'native' | 'clipboard' | 'erro'> {
  if (typeof navigator === 'undefined') return 'erro'

  if (isMobileShare()) {
    try {
      await navigator.share({ title: titulo, text: texto, url })
      return 'native'
    } catch {
      // usuário cancelou — não é erro real
      return 'native'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'clipboard'
  } catch {
    return 'erro'
  }
}

export function compartilharViaWhatsApp(
  numeroDestinatario: string | null | undefined,
  mensagem: string
): void {
  const numero = numeroDestinatario?.replace(/\D/g, '')
  const base = numero ? `https://wa.me/55${numero}` : 'https://wa.me'
  const url = `${base}?text=${encodeURIComponent(mensagem)}`
  if (typeof window !== 'undefined') window.open(url, '_blank')
}

// ── Registro de log (fire-and-forget, não bloqueia UX) ────────────────────

export async function registrarCompartilhamento(
  payload: RegistroCompartilhamento
): Promise<void> {
  try {
           await insertLog({
          acao: 'COMPARTILHAR_PERFIL',
          entidadeTipo: 'prestador',
          entidadeId: String(payload.prestador_id),
          detalhes: {
            canal: payload.canal,
            origem: payload.origem,
          },
        })
  } catch {
    // log nunca deve quebrar o fluxo principal
  }
}