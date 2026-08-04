'use client'
import { use } from 'react'
import { useAvaliar } from '@/hooks/useAvaliacao'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import { CardPrestador } from '@/components/acompanhamento/CardPrestador'
import CarrosselFinalizacao from '@/components/acompanhamento/CarrosselFinalizacao'
import { BlocoAvaliacao } from '@/components/acompanhamento/BlocoAvaliacao'
import { RodapeSeguranca } from '@/components/acompanhamento/RodapeSeguranca'

export default function PaginaAvaliar({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(paramsPromise)

  const {
    projeto, avaliacaoExistente, avaliacaoFinalizada,
    fotosCarrossel, currentSlide, nextSlide, prevSlide,
    loading, mounted,
    nota, setNota, hoverNota, setHoverNota,
    comentarioGeral, setComentarioGeral,
    indica, setIndica, submitting,
    handleFinalizarAvaliacao,
  } = useAvaliar(token)

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-bold text-slate-300 uppercase tracking-widest animate-pulse">
        Carregando avaliação...
      </div>
    )
  }

  if (!projeto) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-36 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Coluna esquerda — sticky */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">
            <CardPrestador projeto={projeto} />
            <RodapeSeguranca />
          </aside>

          {/* Coluna direita */}
          <div className="flex-1 min-w-0 space-y-5">

            <CarrosselFinalizacao
              projeto={projeto}
              fotosCarrossel={fotosCarrossel}
              currentSlide={currentSlide}
              onNext={nextSlide}
              onPrev={prevSlide}
              avaliacaoExistente={avaliacaoExistente}
            />

            {!avaliacaoFinalizada && (
              <BlocoAvaliacao
                nota={nota}
                setNota={setNota}
                hoverNota={hoverNota}
                setHoverNota={setHoverNota}
                comentarioGeral={comentarioGeral}
                setComentarioGeral={setComentarioGeral}
                indica={indica}
                setIndica={setIndica}
                submitting={submitting}
                onSubmit={handleFinalizarAvaliacao}
              />
            )}

            <div className="lg:hidden">
              <RodapeSeguranca />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}