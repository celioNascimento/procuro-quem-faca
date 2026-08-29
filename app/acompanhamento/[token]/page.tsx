// app/acompanhamento/[token]/page.tsx

'use client'
import { use, useState, useEffect } from 'react'
import { useAcompanhamento }        from '@/hooks/useAcompanhamento'
import { useCasoGarantiaDoProjeto } from '@/hooks/useCasoGarantiaDoProjeto'
import { supabase }                 from '@/lib/supabase'
import HeaderCliente                from '@/components/perfil/HeaderCliente'
import { CardPrestador }            from '@/components/acompanhamento/CardPrestador'
import { LinhaDeTempo }             from '@/components/acompanhamento/LinhaDeTempo'
import { LinhaDeTempoSemFotos }     from '@/components/acompanhamento/LinhaDeTempoSemFotos'
import { StatusMini }               from '@/components/acompanhamento/StatusMini'
import { ModalDiscussao }           from '@/components/acompanhamento/ModalDiscussao'
import { RodapeSeguranca }          from '@/components/acompanhamento/RodapeSeguranca'
import { GarantiaSecaoCliente }     from '@/components/acompanhamento/garantia/GarantiaSecaoCliente'
import AcompanhamentoSkeleton       from '@/components/skeletons/AcompanhamentoSkeleton'

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

  // Fluxo sem_fotos: travado na criação do projeto (ver migration
  // portfolio_projetos.sem_fotos). Quando true, a página usa a timeline
  // simplificada e desativa a seção de garantia (decisão de produto —
  // garantia depende de evidência fotográfica para abertura de caso).
  const semFotos = projeto?.sem_fotos ?? false

  const {
    caso: casoGarantia,
    loading: loadingCaso,
    recarregar: recarregarCaso,
    temGarantiaAtiva,          // derivado pelo hook — ativo só para status em andamento
  } = useCasoGarantiaDoProjeto(projeto?.id ?? null)

  const [clienteUserId, setClienteUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setClienteUserId(data.user?.id ?? null))
  }, [])

  if (!mounted || loading) {
    return <AcompanhamentoSkeleton />
  }

  if (!projeto) return null

  const projetoFinalizado = projeto.status === 'finalizado'

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-36 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">
            <CardPrestador
              projeto={projeto}
              onShare={handleShare}
              temGarantiaAtiva={temGarantiaAtiva}
            />
            {temConclusao && (
              <StatusMini
                labelEtapaAtual={labelEtapaAtual}
                totalFotos={fotosOrdenadas.length}
                temGarantiaAtiva={temGarantiaAtiva}
                statusGarantia={casoGarantia?.status}
              />
            )}
            <RodapeSeguranca />
          </aside>

          <div className="flex-1 min-w-0 space-y-5">
            {semFotos ? (
              <LinhaDeTempoSemFotos
                status={projeto.status}
                aceitoEm={projeto.aceito_at ?? null}
                marcadoConcluidoEm={projeto.marcado_concluido_at ?? null}
              />
            ) : (
              <LinhaDeTempo
                fotosOrdenadas={fotosOrdenadas}
                comentarios={comentarios}
                labelEtapaAtual={labelEtapaAtual}
                status={projeto.status}
                onFotoClick={setFotoSelecionada}
                temGarantiaAtiva={temGarantiaAtiva}
              />
            )}

            {/* Garantia elegível por garantia_dias (verificarElegibilidadeGarantia),
                independente de sem_fotos */}
            {projetoFinalizado && clienteUserId && (
              <GarantiaSecaoCliente
                projetoId={projeto.id}
                clienteUserId={clienteUserId}
                caso={casoGarantia}
                loadingCaso={loadingCaso}
                recarregar={recarregarCaso}
              />
            )}

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
