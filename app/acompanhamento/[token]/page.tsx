'use client'
import { use } from 'react'
import { useAvaliacao } from '@/hooks/useAvaliacao'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import { CardPrestador }        from '@/components/acompanhamento/CardPrestador'
import { LinhaDeTempo }         from '@/components/acompanhamento/LinhaDeTempo'
import { StatusMini }           from '@/components/acompanhamento/StatusMini'
import CarrosselFinalizacao from '@/components/acompanhamento/CarrosselFinalizacao'
import { BlocoAvaliacao }       from '@/components/acompanhamento/BlocoAvaliacao'
import { ModalDiscussao }       from '@/components/acompanhamento/ModalDiscussao'
import { RodapeSeguranca }      from '@/components/acompanhamento/RodapeSeguranca'

export default function PaginaAvaliacaoCliente({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(paramsPromise)

  const {
    projeto, avaliacaoExistente, comentarios, fotosOrdenadas, fotosCarrossel,
    temConclusao, labelEtapaAtual, visualmenteConcluido,
    loading, mounted, fotoSelecionada, setFotoSelecionada,
    currentSlide, nextSlide, prevSlide,
    nota, setNota, hoverNota, setHoverNota,
    comentarioGeral, setComentarioGeral, indica, setIndica, submitting,
    novoComentario, setNovoComentario, enviandoComentario,
    handleShare, handleEnviarComentario, handleFinalizarAvaliacao,
  } = useAvaliacao(token)

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-bold text-slate-300 uppercase tracking-widest animate-pulse">
        Sincronizando Relatórios...
      </div>
    )
  }

  if (!projeto) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-36 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/*
          FIX: adicionado `items-start` para que o flex container não
          estique os filhos — sem isso o aside nunca tem altura menor
          que o pai e o sticky não dispara.
          O `lg:flex-row` já existia; só garantimos que ambas as colunas
          se alinham pelo topo e têm altura própria.
        */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Coluna esquerda — sticky no desktop */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">
            <CardPrestador
              projeto={projeto}
              onShare={handleShare}
            />

            {visualmenteConcluido && (
              <StatusMini
                labelEtapaAtual={labelEtapaAtual}
                totalFotos={fotosOrdenadas.length}
              />
            )}

            <RodapeSeguranca />
          </aside>

          {/* Coluna direita — conteúdo principal (rola normalmente) */}
          <div className="flex-1 min-w-0 space-y-5">

            {!visualmenteConcluido && (
              <LinhaDeTempo
                fotosOrdenadas={fotosOrdenadas}
                comentarios={comentarios}
                labelEtapaAtual={labelEtapaAtual}
                status={projeto.status}
                onFotoClick={setFotoSelecionada}
              />
            )}

            {visualmenteConcluido && (
              <CarrosselFinalizacao
                projeto={projeto}
                fotosCarrossel={fotosCarrossel}
                currentSlide={currentSlide}
                onNext={nextSlide}
                onPrev={prevSlide}
                avaliacaoExistente={avaliacaoExistente}
              />
            )}

            {!visualmenteConcluido && temConclusao && (
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

      {fotoSelecionada && !visualmenteConcluido && (
        <ModalDiscussao
          foto={fotoSelecionada}
          projeto={projeto}
          comentarios={comentarios}
          novoComentario={novoComentario}
          setNovoComentario={setNovoComentario}
          enviando={enviandoComentario}
          onEnviar={handleEnviarComentario}
          onClose={() => setFotoSelecionada(null)}
        />
      )}
    </div>
  )
}