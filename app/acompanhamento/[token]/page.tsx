  // app/acompanhamento/[token]/page.tsx

  'use client'
  import { use } from 'react'
  import { useAcompanhamento } from '@/hooks/useAcompanhamento'
  import HeaderCliente        from '@/components/perfil/HeaderCliente'
  import { CardPrestador }    from '@/components/acompanhamento/CardPrestador'
  import { LinhaDeTempo }     from '@/components/acompanhamento/LinhaDeTempo'
  import { StatusMini }       from '@/components/acompanhamento/StatusMini'
  import { ModalDiscussao }   from '@/components/acompanhamento/ModalDiscussao'
  import { RodapeSeguranca }  from '@/components/acompanhamento/RodapeSeguranca'

  export default function PaginaAcompanhamento({
    params: paramsPromise,
  }: {
    params: Promise<{ token: string }>
  }) {
    const { token } = use(paramsPromise)

    const {
      projeto, comentarios, fotosOrdenadas, temConclusao, labelEtapaAtual,
      loading, mounted, fotoSelecionada, setFotoSelecionada,
      novoComentario, setNovoComentario, enviandoComentario,
      handleShare, handleEnviarComentario,
    } = useAcompanhamento(token)

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
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">

            {/* Coluna esquerda — sticky */}
            <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">
              <CardPrestador
                projeto={projeto}
                onShare={handleShare}
              />
              {temConclusao && (
                <StatusMini
                  labelEtapaAtual={labelEtapaAtual}
                  totalFotos={fotosOrdenadas.length}
                />
              )}
              <RodapeSeguranca />
            </aside>

            {/* Coluna direita */}
            <div className="flex-1 min-w-0 space-y-5">
              <LinhaDeTempo
                fotosOrdenadas={fotosOrdenadas}
                comentarios={comentarios}
                labelEtapaAtual={labelEtapaAtual}
                status={projeto.status}
                onFotoClick={setFotoSelecionada}
              />
              <div className="lg:hidden">
                <RodapeSeguranca />
              </div>
            </div>

          </div>
        </main>

        {fotoSelecionada && (
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