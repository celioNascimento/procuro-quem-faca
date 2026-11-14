//components/cards/PrestadorCard.tsx 

'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import type { Prestador } from '@/types/prestador'
import { corDasIniciais, getIniciais, getLocalizacao, getPerfilHref } from '@/lib/prestadorUtils'
import { visualDaArea } from '@/lib/areaVisual'

type Props = {
  prestador: Prestador
  session: unknown
  registrarLog?: (acao: string, detalhes?: Record<string, unknown>) => void
}

// Largura estimada do badge "+N" (px), reservada de antemão para não
// precisar de uma segunda passada de medição ao decidir o corte.
const LARGURA_BADGE_EXTRA = 44
// Espaço entre badges (gap-1.5 = 6px)
const GAP_BADGES = 6

export default function PrestadorCard({ prestador, session, registrarLog }: Props) {
  const [imgError, setImgError] = useState(false)

  const habilidadesTotais = prestador?.habilidades || []
  const medidorRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [qtdVisivel, setQtdVisivel] = useState<number | null>(null)

  // Mede, antes do browser pintar o frame, quantas habilidades cabem numa
  // única linha do container real do card — evita flash visual e não
  // depende de heurística por caractere (que falha com nomes como
  // "Ar Condicionado" ocupando bem mais espaço que "Pedreiro").
  useLayoutEffect(() => {
    if (!medidorRef.current || !containerRef.current || habilidadesTotais.length === 0) {
      setQtdVisivel(0)
      return
    }

    const larguraDisponivel = containerRef.current.offsetWidth
    const badges = Array.from(medidorRef.current.children) as HTMLElement[]

    let larguraAcumulada = 0
    let count = 0

    for (let i = 0; i < badges.length; i++) {
      const larguraBadge = badges[i].offsetWidth
      const temMaisDepois = i < badges.length - 1
      // Reserva espaço pro "+N" só se ainda houver itens depois deste
      const reservaExtra = temMaisDepois ? LARGURA_BADGE_EXTRA + GAP_BADGES : 0

      const proximaLargura = larguraAcumulada + larguraBadge + (i > 0 ? GAP_BADGES : 0)

      if (proximaLargura + reservaExtra > larguraDisponivel) break

      larguraAcumulada = proximaLargura
      count++
    }

    // Garante ao menos 1 habilidade visível se houver alguma, mesmo que
    // a primeira já estoure sozinha (evita ficar só com "+N" sem contexto)
    setQtdVisivel(Math.max(count, habilidadesTotais.length > 0 ? 1 : 0))
     
  }, [habilidadesTotais.length])

  if (!prestador) return null

  const temFoto = Boolean(prestador.foto_perfil) && !imgError
  // Sem foto: o ícone da área diz o que a pessoa faz; sem ícone conhecido, iniciais coloridas.
  const visualArea = visualDaArea(prestador.grupo_icone)
  const isPublico = prestador.origem_tipo === 'curadoria_publica'
  const perfilHref = getPerfilHref(prestador.slug, prestador.id ?? '')
  const localizacao = getLocalizacao(prestador.bairro ?? undefined, prestador.cidades?.nome)

  const habilidadesVisiveis = qtdVisivel !== null ? habilidadesTotais.slice(0, qtdVisivel) : []
  const extras = qtdVisivel !== null ? habilidadesTotais.length - qtdVisivel : 0

  const reivindicarHref = `/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome || '')}`

  // O card inteiro é clicável sem que o <a> envolva o conteúdo: o link do nome
  // ganha uma camada (after:) que cobre o card (z-10), e o link de reivindicação
  // fica acima dela (z-20). Assim não há link dentro de link, os dois recebem foco
  // do teclado e cada um tem o próprio nome para leitores de tela.
  return (
    <div className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="flex flex-col gap-3 px-4 py-4 md:px-5">
        {/* Identidade: foto, nome, categoria e onde atende — tudo junto, sem blocos vazios */}
        <div className="flex min-w-0 items-center gap-4">
          <div className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border md:size-20 ${temFoto ? 'border-slate-100 bg-slate-50' : visualArea ? visualArea.cores : corDasIniciais(prestador.nome || '')}`}>
            {temFoto ? (
              <img
                src={prestador.foto_perfil ?? undefined}
                className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.02]"
                alt={prestador.nome || 'Prestador'}
                onError={() => setImgError(true)}
              />
            ) : visualArea ? (
              <visualArea.Icone aria-hidden="true" strokeWidth={1.75} className="size-7 md:size-9" />
            ) : (
              <span aria-hidden="true" className="text-lg font-bold tracking-tight md:text-xl">
                {getIniciais(prestador.nome || '')}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-pretty text-base font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 md:text-lg">
              <Link
                href={perfilHref}
                onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
                className="after:absolute after:inset-0 after:z-10 after:rounded-[2rem] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-blue-600"
              >
                <span className="sr-only">Ver perfil de </span>
                {prestador.nome}
              </Link>
            </h2>
            <span className="text-xs font-bold uppercase leading-tight tracking-wide text-blue-600">
              {prestador.categoria}
            </span>
            {(localizacao || isPublico) && (
              <div className="flex flex-wrap items-center gap-x-3">
                {localizacao && (
                  <p className="flex items-center gap-1 text-sm text-slate-600">
                    <MapPin size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    {localizacao}
                  </p>
                )}
                {isPublico && (
                  // A área de toque tem 44px de altura sem aumentar a linha (margem negativa).
                  <Link
                    href={reivindicarHref}
                    title="Este perfil foi montado com dados públicos de contato. Se for o seu, assuma o perfil."
                    className="relative z-20 -my-2 inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-700 hover:decoration-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    Este perfil é seu?
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Só a seta: o card inteiro já é o link, e um botão com texto tirava espaço do nome nos cards de 2 colunas */}
          <span
            aria-hidden="true"
            className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white sm:flex"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </span>
        </div>

        {/* Habilidades (uma linha, medida dinamicamente) */}
        {habilidadesTotais.length > 0 && (
          <div ref={containerRef} className="relative min-h-6 border-t border-slate-100 pt-3">
            {/* Medidor invisível: todas as habilidades numa linha sem quebrar,
                usado só para calcular larguras reais. Nunca visível ao usuário. */}
            <div
              ref={medidorRef}
              className="pointer-events-none absolute left-0 top-3 flex gap-1.5 whitespace-nowrap opacity-0"
              aria-hidden="true"
            >
              {habilidadesTotais.map(hab => (
                <span
                  key={hab}
                  className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {hab}
                </span>
              ))}
            </div>

            {/* Versão real, exibida — só renderiza depois de medir */}
            {qtdVisivel !== null && (
              <div className="flex flex-wrap gap-1.5">
                {habilidadesVisiveis.map(hab => (
                  <span
                    key={hab}
                    className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {hab}
                  </span>
                ))}
                {extras > 0 && (
                  <span className="px-1 py-1 text-xs font-semibold text-slate-500">+{extras}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
