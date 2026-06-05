import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLog } from '@/hooks/useLog'
import { setCookie, getCookie } from '@/lib/cookies'
import type { PrestadorPerfil } from '@/types/perfil'

export function useRastreamentoAtivacao(prestador: PrestadorPerfil | null) {
  const searchParams = useSearchParams()
  const { registrarLog } = useLog()
  const srcParam = searchParams?.get('src')

  useEffect(() => {
    if (!prestador) return

    const slug       = prestador.slug || String(prestador.id)
    const cookieKey  = `ativacao_visita_${slug}`
    const jaRegistrou = getCookie(cookieKey)

    if (srcParam === 'ativacao' && !jaRegistrou) {
      setCookie(cookieKey, 'ativacao', 7)
      registrarLog('VISITA_POS_ATIVACAO', {
        nome_prestador: prestador.nome,
        slug,
        origem: 'link_whatsapp',
        src: 'ativacao',
      }, prestador.id)
      return
    }

    if (!srcParam && jaRegistrou === 'ativacao') {
      registrarLog('RETORNO_POS_ATIVACAO', {
        nome_prestador: prestador.nome,
        slug,
        origem: 'retorno_cookie',
      }, prestador.id)
    }
  }, [prestador?.id, srcParam])
}