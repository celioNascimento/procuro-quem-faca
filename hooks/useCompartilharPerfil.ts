'use client'
import { useState, useCallback } from 'react'
import type { PrestadorPerfil, ProjetoPerfil } from '@/types/perfil'
import {
  buildUrlPerfil,
  buildTextoPadrao,
  buildTextoWhatsApp,
  compartilharViaNative,
  compartilharViaWhatsApp,
  registrarCompartilhamento,
} from '@/lib/services/compartilharPerfil.service'

// ── Tipos ──────────────────────────────────────────────────────────────────

type Origem = 'perfil_publico' | 'dashboard' | 'pagina_sucesso'

type StatusCompartilhamento = 'ocioso' | 'compartilhando' | 'copiado' | 'erro'

type PrestadorInput = Omit<
  Pick<PrestadorPerfil, 'id' | 'nome' | 'slug' | 'foto_perfil' | 'categorias' | 'categoria'>,
  'id'
> & { id: number }

interface UseCompartilharPerfilOptions {
  prestador: PrestadorInput
  projetos: ProjetoPerfil[]
  origem?: Origem
}

interface UseCompartilharPerfilReturn {
  status: StatusCompartilhamento
  /** Compartilha via Web Share API ou copia o link para a área de transferência */
  compartilhar: () => Promise<void>
  /** Abre WhatsApp com a mensagem formatada. Passa número do destinatário se quiser abrir conversa específica. */
  compartilharWhatsApp: (numeroDestinatario?: string | null) => void
  /** URL pública calculada do perfil */
  urlPerfil: string
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCompartilharPerfil({
  prestador,
  projetos,
  origem = 'perfil_publico',
}: UseCompartilharPerfilOptions): UseCompartilharPerfilReturn {

  const [status, setStatus] = useState<StatusCompartilhamento>('ocioso')

  const totalFinalizados = projetos.filter(p => p.status === 'finalizado').length
  const categoria = prestador.categorias?.nome || prestador.categoria || null
  const urlPerfil = buildUrlPerfil(prestador.slug, prestador.id)

  // ── Compartilhar (native share ou clipboard) ────────────────────────────

  const compartilhar = useCallback(async () => {
    if (status === 'compartilhando') return
    setStatus('compartilhando')

    const texto = buildTextoPadrao(prestador.nome, categoria, totalFinalizados)
    const resultado = await compartilharViaNative(prestador.nome, texto, urlPerfil)

    if (resultado === 'clipboard') {
      setStatus('copiado')
      void registrarCompartilhamento({ prestador_id: prestador.id, canal: 'clipboard', origem })
      setTimeout(() => setStatus('ocioso'), 2000)
      return
    }

    if (resultado === 'native') {
      void registrarCompartilhamento({ prestador_id: prestador.id, canal: 'native_share', origem })
      setStatus('ocioso')
      return
    }

    setStatus('erro')
    setTimeout(() => setStatus('ocioso'), 2000)
  }, [status, prestador, categoria, totalFinalizados, urlPerfil, origem])

  // ── Compartilhar via WhatsApp ────────────────────────────────────────────

  const compartilharWhatsApp = useCallback(
    (numeroDestinatario?: string | null) => {
      const mensagem = buildTextoWhatsApp(prestador.nome, categoria, totalFinalizados, urlPerfil)
      compartilharViaWhatsApp(numeroDestinatario, mensagem)
      void registrarCompartilhamento({ prestador_id: prestador.id, canal: 'whatsapp', origem })
    },
    [prestador, categoria, totalFinalizados, urlPerfil, origem]
  )

  return { status, compartilhar, compartilharWhatsApp, urlPerfil }
}