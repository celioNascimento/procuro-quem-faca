// components/painel/AdCardPainelCliente.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { listarAnunciosAtivosPorPraca, registrarMetricaAnuncio, type AnuncioComAnunciante } from '@/lib/services/adminAnuncios.service'
import { AdCardFallback } from '@/components/ads/AdCardFallback'
import type { AdFallback } from '@/types/ads'
import type { ClienteServico } from '@/types/clienteServicos'

const POSICAO = 'dashboard_cliente'

// Fallback próprio deste banner — plataforma é gratuita pro cliente, então
// sem venda pra essa praça o espaço reforça esse valor em vez de ficar
// vazio ou usar um fallback genérico de categoria de serviço.
const FALLBACK_PADRAO: AdFallback = {
  emoji: '🤝',
  titulo: 'Procuro Quem Faça é 100% gratuito pra você',
  subtitulo: 'Sem taxas escondidas — encontre, contrate e avalie seus profissionais de confiança.',
  cta: 'Ver meus projetos',
  cor: 'from-blue-600 to-indigo-600',
  href: () => '/painel/perfil',
}

/**
 * Banner de anúncio B2C no topo da área do cliente (app/painel/perfil) —
 * público distinto do banner da dashboard do prestador (AdCardDashboard.tsx).
 * Lá o anunciante é fornecedor de insumo pro prestador trabalhar; aqui é o
 * "próximo passo" da jornada do cliente após o serviço (ex: seguradora,
 * financeira, decoração) — decisão comercial tomada no cadastro admin, não
 * travada no código.
 *
 * Resolve a praça (cidade+categoria) a partir do PRESTADOR do serviço mais
 * recente do cliente (a lista já vem ordenada por created_at desc em
 * useServicosCliente). O select de fetchClienteServicos não traz cidade_id/
 * categoria_id — só o necessário para os outros usos dessa tela — então uma
 * query pontual e isolada busca esses dois campos aqui, sem alterar mais o
 * contrato de dados do service.
 *
 * Não usa <AdCard> (renderiza a imagem/link diretamente), então registra
 * impressão/clique aqui mesmo via registrarMetricaAnuncio, espelhando
 * AdCard.tsx e AdCardDashboard.tsx.
 */
export function AdCardPainelCliente({ servicos }: { servicos: ClienteServico[] }) {
  const [anuncio, setAnuncio] = useState<AnuncioComAnunciante | null | undefined>(undefined) // undefined = carregando

  useEffect(() => {
    let cancelado = false

    async function carregar() {
      try {
        const servicoRecente = servicos[0]
        const prestadorId = servicoRecente?.prestadores?.id
        if (!prestadorId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const { data: prestador, error } = await supabase
          .from('prestadores')
          .select('cidade_id, categoria_id')
          .eq('id', prestadorId)
          .maybeSingle()

        if (error) throw error

        const cidadeId = prestador?.cidade_id ? String(prestador.cidade_id) : null
        const categoriaId = prestador?.categoria_id ? String(prestador.categoria_id) : null

        if (!cidadeId || !categoriaId) {
          if (!cancelado) setAnuncio(null)
          return
        }

        const anunciosDaPraca = await listarAnunciosAtivosPorPraca(cidadeId, categoriaId, POSICAO)
        if (!cancelado) setAnuncio(anunciosDaPraca[0] ?? null)
      } catch {
        if (!cancelado) setAnuncio(null)
      }
    }

    if (servicos.length > 0) {
      carregar()
    } else {
      setAnuncio(null)
    }

    return () => {
      cancelado = true
    }
  }, [servicos])

  // Registra 1 impressão assim que o anúncio real é resolvido e renderizado.
  useEffect(() => {
    if (!anuncio?.id) return
    registrarMetricaAnuncio(anuncio.id, anuncio.segmentacao_id_ativa, 'impressao')
  }, [anuncio])

  function handleClick() {
    if (!anuncio?.id) return
    registrarMetricaAnuncio(anuncio.id, anuncio.segmentacao_id_ativa, 'clique')
  }

  // Enquanto resolve (undefined), não renderiza nada — evita "pulo" de
  // layout mostrando o fallback e depois trocando pelo anúncio real.
  if (anuncio === undefined) return null

  if (!anuncio || !anuncio.imagem_url) {
    return (
      <div className="mb-6">
        <AdCardFallback fallback={FALLBACK_PADRAO} />
      </div>
    )
  }

  return (
    <a
      href={anuncio.link_destino || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="relative mb-6 block w-full overflow-hidden rounded-2xl shadow-sm transition-opacity hover:opacity-95"
    >
      <img src={anuncio.imagem_url} alt={anuncio.titulo} className="h-auto w-full object-cover" />
      <div className="pointer-events-none absolute right-3 top-3 z-10">
        <span className="rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          Publicidade
        </span>
      </div>
    </a>
  )
}
