//components/cards/PrestadorCard.tsx 

'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronRight, Globe } from 'lucide-react'
import type { Prestador } from '@/types/prestador'
import { getIniciais, getLocalizacao, getPerfilHref } from '@/lib/prestadorUtils'

type Props = {
  prestador: Prestador
  session: unknown
  registrarLog?: (acao: string, detalhes?: Record<string, unknown>) => void
}

// Largura estimada do badge "+N" (px), reservada de antemão para não
// precisar de uma segunda passada de medição ao decidir o corte.
const LARGURA_BADGE_EXTRA = 40
// Espaço entre badges (gap-1.5 = 6px)
const GAP_BADGES = 6

export default function PrestadorCard({ prestador, session, registrarLog }: Props) {
  const [imgError, setImgError] = useState(false)
  const router = useRouter()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habilidadesTotais.length])

  if (!prestador) return null

  const isPublico = prestador.origem_tipo === 'curadoria_publica'
  const perfilHref = getPerfilHref(prestador.slug, prestador.id ?? '')
  const localizacao = getLocalizacao(prestador.bairro ?? undefined, prestador.cidades?.nome)

  const habilidadesVisiveis = qtdVisivel !== null ? habilidadesTotais.slice(0, qtdVisivel) : []
  const extras = qtdVisivel !== null ? habilidadesTotais.length - qtdVisivel : 0

  return (
    <Link
      href={perfilHref}
      onClick={() => registrarLog?.('CLIQUE_PERFIL', { nome: prestador.nome })}
      className="group relative block bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex min-h-[190px] flex-col gap-4 px-5 py-5 md:px-6 md:py-6">
        {/* Primeira linha: identidade do prestador */}
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 md:size-28">
            {prestador.foto_perfil && !imgError ? (
              <img
                src={prestador.foto_perfil ?? undefined}
                className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.02]"
                alt={prestador.nome || 'Prestador'}
                onError={() => setImgError(true)}
              />
            ) : (
              <h3 className="text-pretty text-base font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 md:text-lg">
                {getIniciais(prestador.nome || '')}
              </h3>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-pretty text-base font-bold leading-snug tracking-tight text-slate-900 line-clamp-2 md:text-lg">
              {prestador.nome}
            </h3>
            <span className="text-[11px] font-black uppercase leading-none tracking-widest text-blue-600 md:text-xs">
              {prestador.categoria}
            </span>
          </div>
        </div>

        {/* Segunda linha: habilidades (linha própria, medida dinamicamente) */}
        {habilidadesTotais.length > 0 && (
          <div ref={containerRef} className="relative min-h-6 border-t border-slate-100 pt-4">
            {/* Medidor invisível: todas as habilidades numa linha sem quebrar,
                usado só para calcular larguras reais. Nunca visível ao usuário. */}
            <div
              ref={medidorRef}
              className="pointer-events-none absolute left-0 top-4 flex gap-1.5 whitespace-nowrap opacity-0"
              aria-hidden="true"
            >
              {habilidadesTotais.map(hab => (
                <span
                  key={hab}
                  className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
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
                    className="rounded-full border border-slate-100 bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {hab}
                  </span>
                ))}
                {extras > 0 && (
                  <span className="px-1 py-1 text-[9px] font-semibold text-slate-400">+{extras}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Terceira linha: localização + ação */}
        <div className={`mt-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${habilidadesTotais.length > 0 ? '' : 'border-t border-slate-100 pt-4'}`}>
          <div className="flex flex-wrap items-center gap-2">
            {localizacao && (
              <div className="flex items-center gap-1">
                <MapPin size={12} className="shrink-0 text-slate-300" />
                <p className="text-[11px] font-medium tracking-tight text-slate-400">
                  {localizacao}
                </p>
              </div>
            )}
            {isPublico && (
              <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                <Globe size={9} /> Perfil público
              </span>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
            <span className="flex min-h-10 w-full items-center justify-center gap-1 rounded-xl bg-blue-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm shadow-blue-200 transition-all group-hover:bg-blue-700 sm:w-auto sm:min-w-36">
              Ver perfil <ChevronRight size={12} strokeWidth={3} />
            </span>
            {isPublico && (
              <span
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome || '')}`)
                }}
                className="cursor-pointer text-[10px] font-semibold text-slate-400 transition-colors hover:text-blue-600"
              >
                Este perfil é seu?
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
