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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      <div className="max-w-xl mx-auto px-5 pt-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <CardPrestador
          projeto={projeto}
          onShare={handleShare}
        />

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
          <StatusMini
            labelEtapaAtual={labelEtapaAtual}
            totalFotos={fotosOrdenadas.length}
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

        <RodapeSeguranca />
      </div>

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