// hooks/useCompartilharTrabalho.ts — compartilhar um trabalho do feed.
// O link abre o perfil do prestador; a mensagem cita o trabalho. No celular abre o menu de compartilhar
// (WhatsApp, Telegram, etc.); no computador copia o link e avisa.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { textoCompartilharTrabalho, type FeedItem } from '@/lib/feed/feed'
import { buildUrlPerfil, compartilharViaNative, registrarCompartilhamento } from '@/lib/services/compartilharPerfil.service'

export const MENSAGEM_LINK_COPIADO = 'Link copiado. Agora é só colar onde quiser.'
export const MENSAGEM_ERRO_COMPARTILHAR = 'Não conseguimos compartilhar agora. Tente de novo.'

export function useCompartilharTrabalho() {
  const [confirmacao, setConfirmacao] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current) }, [])

  const compartilhar = useCallback(async (item: FeedItem) => {
    if (temporizador.current) clearTimeout(temporizador.current)
    setConfirmacao(null)
    setErro(null)
    const resultado = await compartilharViaNative(item.titulo, textoCompartilharTrabalho(item), buildUrlPerfil(item.prestador.slug, item.prestador.id))
    if (resultado === 'erro') { setErro(MENSAGEM_ERRO_COMPARTILHAR); return }
    void registrarCompartilhamento({ prestador_id: item.prestador.id, canal: resultado === 'clipboard' ? 'clipboard' : 'native_share', origem: 'feed' })
    if (resultado === 'clipboard') {
      setConfirmacao(MENSAGEM_LINK_COPIADO)
      temporizador.current = setTimeout(() => setConfirmacao(null), 4000)
    }
  }, [])

  return { compartilhar, confirmacao, erro }
}
