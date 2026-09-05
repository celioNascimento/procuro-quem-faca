//dashboard/wizard/WizardCompleted.tsx

import { CheckCircle2, ChevronRight, ChevronLeft, MoreHorizontal, User, Share2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useUploadWizard } from '@/hooks/useUploadWizard'
import { useAvaliacaoDoProjeto } from '@/hooks/useAvaliacaoDoProjeto'
import { useAvaliacaoClienteDoProjeto } from '@/hooks/useAvaliacaoClienteDoProjeto'
import { supabase } from '@/lib/supabase'
import { AvaliacaoClienteRapida } from '../AvaliacoesDashboardTab'
import { useState } from 'react'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
  prestadorId: number
}

// Renomeado de UploadWizard para WizardCompleted
export function WizardCompleted({ hookData, prestadorId }: Props) {
  const { titulo, projetoId, fotosData, comentariosSlideAtual, currentSlide } = hookData.state
  const { fotosCarrossel, fotoAtual, semFotos } = hookData.derived
  const { prevSlide, nextSlide, handleShare } = hookData.actions

  // Só busca avaliação no fluxo sem_fotos — no fluxo com fotos o feedback
  // do cliente já aparece via comentariosSlideAtual (comentários por foto).
  const { avaliacao, loading: loadingAvaliacao } = useAvaliacaoDoProjeto(semFotos ? projetoId : null)

  // Avaliação que o PRESTADOR fez sobre o CLIENTE (tabela avaliacoes_clientes).
  // Buscada do banco em vez de guardada em estado local, para persistir
  // corretamente ao sair e voltar da tela.
  const { avaliacao: avaliacaoCliente, loading: loadingAvaliacaoCliente, refetch: refetchAvaliacaoCliente } = useAvaliacaoClienteDoProjeto(projetoId)
  const jaAvaliouCliente = !!avaliacaoCliente

  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const enviarAvaliacaoCliente = async (nota: number, motivos: string[]) => {
    setErroEnvio(null)
    const clienteUserId = hookData.state.clienteUserId
    if (!projetoId || !clienteUserId || !prestadorId) {
      setErroEnvio('Não foi possível identificar este cliente.')
      return
    }
    const { error } = await supabase.from('avaliacoes_clientes').insert({
      projeto_id: projetoId,
      prestador_id: Number(prestadorId),
      cliente_user_id: clienteUserId,
      nota,
      motivos,
    })
    if (error) {
      console.error('[v0] Falha ao salvar avaliação do cliente:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      const mensagem =
        error.code === '23505'
          ? 'Este cliente já foi avaliado neste serviço.'
          : error.code === '42501'
            ? 'Você não tem permissão para avaliar este projeto. Verifique se o cliente está vinculado e se o serviço foi concluído.'
            : error.code === '42P01'
              ? 'A função de avaliações ainda não está disponível neste ambiente.'
              : 'Não foi possível enviar agora. Tente novamente.'

      setErroEnvio(mensagem)
      return
    }
    // Atualiza a partir do banco em vez de estado local — mantém a UI
    // consistente com o que está realmente persistido.
    await refetchAvaliacaoCliente()
  }

  return (
    <div className="flex flex-col w-full">
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-50 shrink-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-green-50 border-green-100 text-green-600">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase italic leading-none tracking-tight">{titulo}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Serviço Concluído</p>
          </div>
        </div>
        <MoreHorizontal className="text-slate-300 cursor-pointer" />
      </div>

      {semFotos ? (
        /* Fluxo sem foto: sem carrossel de imagem — mostra o feedback real
           do cliente (comentário + indicação) direto abaixo do header,
           sem repetir ícone/título de "concluído" que já está no header. */
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-100">
          {loadingAvaliacao ? (
            <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ) : avaliacao ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Feedback do cliente</p>
                {avaliacao.indica !== null && (
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${
                    avaliacao.indica
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}>
                    {avaliacao.indica ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                    {avaliacao.indica ? 'Indica' : 'Não indica'}
                  </span>
                )}
              </div>
              {avaliacao.comentario ? (
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed italic bg-white p-4 rounded-2xl border border-slate-100">
                  "{avaliacao.comentario}"
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Cliente não deixou comentário.</p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Avaliação ainda não encontrada.</p>
          )}
        </div>
      ) : (
        <div className="relative flex aspect-[4/3] min-h-[350px] max-h-[560px] shrink-0 items-center justify-center overflow-hidden bg-slate-900 group">
          {fotoAtual.url ? (
            <>
              <img src={fotoAtual.url} width={1200} height={900} loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover blur-3xl opacity-40 scale-125" aria-hidden="true" />
              <img src={fotoAtual.url} width={1200} height={900} loading="eager" decoding="async" className="relative z-10 max-h-full max-w-full object-contain shadow-2xl" alt="Registro final" />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/50" role="status" aria-label="Carregando imagens do projeto">
              <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
              <span className="text-[10px] font-black uppercase tracking-widest">Carregando registros</span>
            </div>
          )}
          <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/20 z-30">
            Fase 0{fotoAtual.etapa}
          </div>
          {fotosCarrossel.length > 1 && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-40">
              <button onClick={prevSlide} className="w-10 h-10 bg-white/10 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"><ChevronLeft size={20} /></button>
              <button onClick={nextSlide} className="w-10 h-10 bg-white/10 hover:bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"><ChevronRight size={20} /></button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col bg-white border-t border-slate-50 overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 p-5">
          {loadingAvaliacaoCliente ? (
            <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
          ) : jaAvaliouCliente ? (
            <>
              <AvaliacaoClienteRapida
                onSubmit={enviarAvaliacaoCliente}
                somenteLeitura
                notaInicial={avaliacaoCliente!.nota}
                motivosIniciais={avaliacaoCliente!.motivos}
              />
              <p className="mt-3 text-center text-xs font-bold text-green-700">Avaliação do cliente registrada.</p>
            </>
          ) : (
            <>
              <AvaliacaoClienteRapida onSubmit={enviarAvaliacaoCliente} />
              {!hookData.state.clienteUserId && <p className="mt-3 text-center text-[11px] font-bold text-amber-700">Este projeto antigo ainda não está vinculado a uma conta de cliente.</p>}
              {erroEnvio && <p role="alert" className="mt-3 text-center text-xs font-bold text-red-600">{erroEnvio}</p>}
            </>
          )}
        </div>
        {!semFotos && (
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest italic">Legenda</span>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed italic pl-4 border-l-2 border-slate-100">
                {fotosData[fotoAtual.etapa]?.legenda || "Nenhum detalhamento."}
              </p>
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Interações do Cliente</h4>
                <div className="flex gap-1.5">
                  {fotosCarrossel.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`} />
                  ))}
                </div>
              </div>
              {comentariosSlideAtual.length === 0 ? (
                <p className="text-[11px] text-slate-300 italic pl-1">Sem comentários para esta fase.</p>
              ) : (
                comentariosSlideAtual.map((com) => (
                  <div key={com.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center border border-slate-100 shadow-sm">
                      <User size={14} className="text-slate-400" />
                    </div>
                    <div className="max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-tight bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100">
                      {com.texto}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <div className="p-5 px-8 border-t border-slate-50 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-6 text-slate-400">
            <Share2 size={22} className="hover:text-blue-600 cursor-pointer transition-colors" onClick={handleShare} />
          </div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">ID: {projetoId?.split('-')[0] || '...'}</span>
        </div>
      </div>
    </div>
  )
}
