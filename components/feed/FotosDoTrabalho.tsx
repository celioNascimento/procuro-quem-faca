// components/feed/FotosDoTrabalho.tsx — fotos do trabalho no card, como no Instagram:
// desliza para o lado (várias fotos), pontinhos + contador, e toque duplo curte (só se onDuploToque vier).
'use client'
import { useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'

interface Props {
  fotos: string[]
  titulo: string
  /** null = não dá para curtir (trabalho meu): o toque duplo não faz nada. */
  onDuploToque: (() => void) | null
}

const INTERVALO_TOQUE_DUPLO_MS = 300

export function FotosDoTrabalho({ fotos, titulo, onDuploToque }: Props) {
  const faixa = useRef<HTMLDivElement>(null)
  const ultimoToque = useRef(0)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [atual, setAtual] = useState(0)
  const [coracao, setCoracao] = useState(false)

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current) }, [])

  function aoRolar() {
    const el = faixa.current
    if (!el || !el.clientWidth) return
    setAtual(Math.min(fotos.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))))
  }

  function irPara(indice: number) {
    const el = faixa.current
    if (!el) return
    setAtual(indice)
    el.scrollTo?.({ left: indice * el.clientWidth, behavior: 'smooth' })
  }

  function aoTocar() {
    if (!onDuploToque) return
    const agora = Date.now()
    if (agora - ultimoToque.current > INTERVALO_TOQUE_DUPLO_MS) { ultimoToque.current = agora; return }
    ultimoToque.current = 0
    onDuploToque()
    setCoracao(true)
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setCoracao(false), 800)
  }

  const varias = fotos.length > 1
  return (
    <div className="relative bg-slate-100">
      <div
        ref={faixa} onScroll={aoRolar} onClick={aoTocar} tabIndex={0} role="group" aria-roledescription="carrossel"
        aria-label={`Fotos do trabalho ${titulo}`} data-testid="feed-fotos"
        className="flex touch-manipulation snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((url, i) => (
          <img
            key={url + i} src={url} alt={varias ? `${titulo} (foto ${i + 1} de ${fotos.length})` : titulo} draggable={false}
            loading={i === 0 ? 'eager' : 'lazy'} data-testid="feed-foto"
            className="aspect-[16/10] w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {varias && (
        <>
          <span aria-hidden="true" data-testid="feed-foto-contador" className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
            {atual + 1}/{fotos.length}
          </span>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {fotos.map((_, i) => (
              <button
                key={i} type="button" onClick={() => irPara(i)} aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
                aria-current={i === atual ? 'true' : undefined} data-testid="feed-foto-ponto"
                className="flex size-6 items-center justify-center"
              >
                <span className={`size-2 rounded-full ${i === atual ? 'bg-white' : 'bg-white/50'}`} />
              </button>
            ))}
          </div>
        </>
      )}

      {coracao && (
        <div aria-hidden="true" data-testid="feed-foto-coracao" className="pointer-events-none absolute inset-0 flex items-center justify-center animate-in zoom-in-50 fade-in duration-200">
          <Heart size={84} fill="white" className="text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  )
}
