//lib/utils/whatsapp.ts

/**
 * Utilitários para lidar com números de WhatsApp salvos no banco.
 * Assume números brasileiros (DDD + número, sem prefixo de país).
 */

const CODIGO_PAIS_BRASIL = '55'

/** Remove tudo que não for dígito. */
export function limparNumero(whatsapp?: string | null): string {
  return whatsapp?.replace(/\D/g, '') || ''
}

/**
 * Monta o link direto para abrir uma conversa no WhatsApp.
 * Retorna undefined se não houver número válido, para permitir
 * desabilitar o link no componente (ex: <a href={link}> vira não-clicável).
 */
export function buildLinkWhatsapp(whatsapp?: string | null, mensagem?: string): string | undefined {
  const numero = limparNumero(whatsapp)
  if (!numero) return undefined
  const base = `https://wa.me/${CODIGO_PAIS_BRASIL}${numero}`
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base
}