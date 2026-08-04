//hooks/useRastreamentoAtivacao.ts

import { useEffect } from 'react'
import { insertLog } from '@/lib/db/logs'
import { setCookie, getCookie } from '@/lib/cookies'
import type { PrestadorPerfil } from '@/types/perfil'

export function useRastreamentoAtivacao(
  prestador: PrestadorPerfil | null,
  srcParam: string | null
) {
  useEffect(() => {
    if (!prestador) return

    const slug = prestador.slug || String(prestador.id)
    const cookieKey = `ativacao_visita_${slug}`
    const jaRegistrou = getCookie(cookieKey)

    if (srcParam === 'ativacao' && !jaRegistrou) {
      setCookie(cookieKey, 'ativacao', 7)
      insertLog({
        acao: 'VISITA_POS_ATIVACAO',
        detalhes: {
          nome_prestador: prestador.nome,
          slug,
          origem: 'link_whatsapp',
          src: 'ativacao',
        },
        entidadeId: String(prestador.id),
      })
      return
    }

    if (!srcParam && jaRegistrou === 'ativacao') {
      insertLog({
        acao: 'RETORNO_POS_ATIVACAO',
        detalhes: {
          nome_prestador: prestador.nome,
          slug,
          origem: 'retorno_cookie',
        },
        entidadeId: String(prestador.id),
      })
    }
  }, [prestador?.id, srcParam])
}