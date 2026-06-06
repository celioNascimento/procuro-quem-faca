'use client'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAvaliacao } from '@/hooks/useAvaliacao'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import { CardPrestador }        from '@/components/avaliacao/CardPrestador'
import { LinhaDeTempo }         from '@/components/avaliacao/LinhaDeTempo'
import { StatusMini }           from '@/components/avaliacao/StatusMini'
import { CarrosselFinalizacao } from '@/components/avaliacao/CarrosselFinalizacao'
import { BlocoAvaliacao }       from '@/components/avaliacao/BlocoAvaliacao'
import { ModalDiscussao }       from '@/components/avaliacao/ModalDiscussao'
import { RodapeSeguranca }      from '@/components/avaliacao/RodapeSeguranca'

export default function PaginaAvaliacaoCliente({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(paramsPromise)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const {
    // dados
    projeto,
    avaliacaoExistente,
    comentarios,
    fotosOrdenadas,
    fotosCarrossel,
    temConclusao,
    labelEtapaAtual,
    visualmenteConcluido,

    // UI
    loading,
    mounted,
    fotoSelecionada,
    setFotoSelecionada,
    currentSlide,
    nextSlide,
    prevSlide,

    // formulário avaliação
    nota,
    setNota,
    hoverNota,
    setHoverNota,
    comentarioGeral,
    setComentarioGeral,
    indica,
    setIndica,
    submitting,

    // formulário comentário
    novoComentario,
    setNovoComentario,
    enviandoComentario,

    // handlers
    handleShare,
    handleEnviarComentario,
    handleFinalizarAvaliacao,
  } = useAvaliacao(id, token)

  // ── Loading / not mounted ──────────────────────────────────────────────────
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
      {/* Header fixo — ocupa espaço real com padding-top no body */}
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      {/*
        pt-20 compensa o header fixo (~64px + folga).
        No desktop usamos duas colunas: coluna esquerda "sticky" com o card
        do prestador + status, coluna direita com o conteúdo principal.
        Em mobile volta a ser uma coluna normal.
      */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── LAYOUT DESKTOP: duas colunas ────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Coluna esquerda — sticky no desktop */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 space-y-4">
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

          {/* Coluna direita — conteúdo principal */}
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

            {/* RodapeSeguranca aparece aqui só no mobile (no desktop está no aside) */}
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