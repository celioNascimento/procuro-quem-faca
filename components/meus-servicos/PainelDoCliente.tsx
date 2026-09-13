// components/meus-servicos/PainelDoCliente.tsx

'use client'
import { useState, useEffect } from 'react'
import { User, Clock, Loader2, ShieldAlert, MessageCircleWarning, Phone, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import LoginGate from './LoginGate'
import ServicoCard from './ServicoCard'
import ServicoCardCompacto from './ServicoCardCompacto'
import ZoomImageModal from './ZoomImageModal'
import { usePainelCliente } from '@/hooks/usePainelCliente'
import PainelDoClienteSkeleton from '@/components/skeletons/PainelDoClienteSkeleton'
import { AdCardPainelCliente } from '@/components/painel/AdCardPainelCliente'
import { ContextualHelp } from '@/components/help/HelpCenter'

export default function PainelDoCliente() {
  const router = useRouter()
  const [tokenSelecionado] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('token')
  )

  const {
    session, servicos, servicosGarantia, servicosReclamacao, loading,
    zoomImage, setZoomImage,
    tokenUrl, nomeCliente,
    handleAceitar, handleRecusar, handleVerGarantia,
    confirmandoWhatsapp, confirmandoErro,
    confirmarWhatsappEAceitar, cancelarConfirmacaoWhatsapp,
  } = usePainelCliente()

  const [whatsappEditado,  setWhatsappEditado]  = useState('')
  const [salvandoWhatsapp, setSalvandoWhatsapp] = useState(false)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    const irParaTopo = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    irParaTopo()
    const frame = requestAnimationFrame(() => {
      irParaTopo()
      requestAnimationFrame(irParaTopo)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (confirmandoWhatsapp?.cliente_whatsapp) {
      queueMicrotask(() => setWhatsappEditado(confirmandoWhatsapp.cliente_whatsapp))
    }
  }, [confirmandoWhatsapp])

  const handleConfirmarWhatsapp = async () => {
    setSalvandoWhatsapp(true)
    try {
      await confirmarWhatsappEAceitar(whatsappEditado)
    } finally {
      setSalvandoWhatsapp(false)
      setWhatsappEditado('')
    }
  }

  const handleCancelarWhatsapp = () => {
    cancelarConfirmacaoWhatsapp()
    setWhatsappEditado('')
  }

  // ── Grupos por status ────────────────────────────────────────────────────────
  const emRegistro  = servicos.filter(s => s.status?.toLowerCase() === 'em_registro')
  const pendentes   = servicos.filter(s => ['pendente', 'aguardando_aceite'].includes(s.status?.toLowerCase() ?? ''))
  const totalPendentes = pendentes.length + emRegistro.length

  const idsComGarantiaAtiva   = new Set(servicosGarantia.map(s => s.id))
  const idsComReclamacaoAtiva = new Set(servicosReclamacao.map(s => s.id))

  const servicosFiltrados = servicos

  const tipoGarantiaAtivaDoServico = (servico: { id: string }): 'garantia' | 'reclamacao' | null => {
    if (idsComGarantiaAtiva.has(servico.id))   return 'garantia'
    if (idsComReclamacaoAtiva.has(servico.id)) return 'reclamacao'
    return null
  }

  const getModo = (servico: (typeof servicos)[number]) => {
    if (tipoGarantiaAtivaDoServico(servico))              return 'garantia'  as const
    if (servico.status?.toLowerCase() === 'em_execucao') return 'andamento' as const
    if (servico.status?.toLowerCase() === 'finalizado')  return 'concluido' as const
    return 'pendente' as const
  }

  const getOnAceitar = (servico: (typeof servicos)[number]) => {
    const status = servico.status?.toLowerCase()
    if (tipoGarantiaAtivaDoServico(servico))
      return () => handleVerGarantia(servico)
    if (status === 'em_execucao')
      return () => router.push(`/acompanhamento/${servico.avaliacao_token}`)
    if (status === 'finalizado')
      return () => router.push(`/acompanhamento/${servico.avaliacao_token}`)
    return () => handleAceitar(servico)
  }

  // ── Status visual para ServicoCardCompacto ───────────────────────────────────
  const getStatusInfo = (servico: (typeof servicos)[number]) => {
    const s        = servico.status?.toLowerCase()
    const temCaso  = tipoGarantiaAtivaDoServico(servico)
    if (temCaso === 'garantia')
      return { label: 'Garantia',     dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', urgente: true  }
    if (temCaso === 'reclamacao')
      return { label: 'Reclamação',   dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', urgente: true  }
    if (s === 'pendente')
      return { label: 'Aguardando',   dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   urgente: false }
    if (s === 'em_execucao')
      return { label: 'Em andamento', dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',      urgente: false }
    if (s === 'finalizado')
      return { label: 'Concluído',    dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border-green-200',   urgente: false }
    return   { label: s ?? '',        dot: 'bg-slate-300',  badge: 'bg-slate-50 text-slate-500 border-slate-200',   urgente: false }
  }

  // ── Loading / Auth ───────────────────────────────────────────────────────────
  if (loading) return <PainelDoClienteSkeleton />
  if (!session) return <LoginGate tokenUrl={tokenUrl} />

  const prestador = servicos[0]?.prestadores
  const projetoSelecionado = tokenSelecionado
    ? servicos.find(s => s.avaliacao_token === tokenSelecionado)
    : undefined

  const outrosServicos = projetoSelecionado
    ? servicos
        .filter(s => s.id !== projetoSelecionado.id)
        .filter(s => {
          const prestadorId = projetoSelecionado.prestadores?.id
          return prestadorId == null || s.prestadores?.id === prestadorId
        })
    : servicosFiltrados

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-10 md:pb-20 font-sans antialiased">
      <HeaderCliente nomeCliente={nomeCliente} />

      {zoomImage && (
        <ZoomImageModal url={zoomImage} onClose={() => setZoomImage(null)} />
      )}

      {confirmandoWhatsapp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100">
                <Phone size={28} />
              </div>
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">
                Confirme seu WhatsApp
              </h3>
              <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
                Precisamos confirmar seu número antes de autorizar o serviço.
              </p>
            </div>

            <input
              type="text"
              value={whatsappEditado}
              onChange={(e) => setWhatsappEditado(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none text-center font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-[15px]"
            />

            {confirmandoErro && (
              <p className="text-[11px] font-bold text-red-500 flex items-center justify-center gap-1.5">
                <AlertCircle size={12} /> {confirmandoErro}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelarWhatsapp}
                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase text-[11px] tracking-wide hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarWhatsapp}
                disabled={!whatsappEditado.trim() || salvandoWhatsapp}
                className="flex-1 py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black uppercase text-[11px] tracking-wide hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                {salvandoWhatsapp ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-5 pt-20 md:pt-32 animate-in fade-in duration-700">
        <AdCardPainelCliente servicos={servicos as unknown as import('@/types/clienteServicos').ClienteServico[]} loading={loading} />

        <div className="mt-1 flex flex-col gap-2 lg:flex-row lg:gap-4">

          {/* ── Coluna Esquerda ── */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="lg:sticky lg:top-36 flex flex-col gap-3">

              {prestador && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center">
                    {prestador.foto_perfil ? (
                      <img src={prestador.foto_perfil} className="w-full h-full object-contain p-1" alt={prestador.nome} />
                    ) : (
                      <User size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {prestador.categoria?.nome && (
                      <p className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em] truncate">
                        {prestador.categoria.nome}
                      </p>
                    )}
                    <h2 className="text-[13px] sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">
                      {prestador.nome}
                    </h2>
                  </div>
                </div>
              )}

              {totalPendentes > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ao autorizar o serviço</p>
                  <div className="space-y-3">
                    {[
                      { n: '01', texto: 'Você confirma que o prestador pode iniciar o trabalho' },
                      { n: '02', texto: 'Um token único é gerado para rastrear o projeto'        },
                      { n: '03', texto: 'Você poderá acompanhar e avaliar ao final'              },
                    ].map(item => (
                      <div key={item.n} className="flex items-start gap-3">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 rounded-lg px-2 py-1 shrink-0 mt-0.5">{item.n}</span>
                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{item.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {servicosGarantia.length > 0 && (
                <div className="bg-orange-50 rounded-[2rem] border border-orange-100 shadow-sm p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Garantia em aberto</p>
                  </div>
                  <p className="text-[12px] text-orange-700/80 font-medium leading-relaxed">
                    Você tem casos de garantia em andamento. Acompanhe as respostas do prestador e confirme quando o problema for resolvido.
                  </p>
                </div>
              )}

              {servicosReclamacao.length > 0 && (
                <div className="bg-orange-50 rounded-[2rem] border border-orange-100 shadow-sm p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageCircleWarning size={14} className="text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Reclamação em aberto</p>
                  </div>
                  <p className="text-[12px] text-orange-700/80 font-medium leading-relaxed">
                    Você tem reclamações em andamento. Acompanhe as respostas do prestador e confirme quando o problema for resolvido.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* ── Coluna Direita ── */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            <div className="mt-1 flex flex-col gap-5">

              {/* Projeto em destaque — card completo */}
              {projetoSelecionado && (
                <section className="flex flex-col gap-3" aria-labelledby="projeto-selecionado-title">
                  <div className="flex items-center justify-between px-1">
                    <h2 id="projeto-selecionado-title" className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                      Projeto selecionado
                    </h2>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-blue-600">
                      Em destaque
                    </span>
                  </div>
                  <div className="rounded-[2.75rem] border-2 border-blue-200 bg-blue-50/40 p-1.5 shadow-[0_20px_60px_-20px_rgba(37,99,235,0.35)]">
                    <ServicoCard
                      servico={projetoSelecionado}
                      onZoom={setZoomImage}
                      onAceitar={getOnAceitar(projetoSelecionado)}
                      hidePrestador
                      modo={getModo(projetoSelecionado)}
                      tipoGarantiaAtiva={tipoGarantiaAtivaDoServico(projetoSelecionado)}
                    />
                    {projetoSelecionado.status?.toLowerCase() === 'pendente' && (
                      <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
                        <p className="text-center text-[11px] font-medium leading-relaxed text-slate-500">
                          Revise os detalhes da proposta antes de decidir. Você pode aceitar pelo WhatsApp ou diretamente aqui.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Deseja recusar este serviço?')) void handleRecusar(projetoSelecionado)
                          }}
                          className="w-full rounded-2xl border border-red-100 bg-red-50 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-red-600 transition-colors hover:bg-red-100"
                        >
                          Recusar serviço
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Outros serviços — cards compactos */}
              {projetoSelecionado && outrosServicos.length > 0 && (
                <section className="flex flex-col gap-2" aria-labelledby="outros-servicos-title">
                  <div className="flex items-center justify-between px-1">
                    <h2 id="outros-servicos-title" className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Outros serviços deste prestador
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400">{outrosServicos.length}</span>
                  </div>
                  <div className="flex flex-col gap-2" role="list" aria-label="Outros serviços do prestador">
                    {outrosServicos.map(servico => (
                      <div key={servico.id} role="listitem">
                        <ServicoCardCompacto
                          servico={servico as unknown as import('@/types/clienteServicos').ClienteServico}
                          statusInfo={getStatusInfo(servico)}
                          tipoGarantiaAtiva={tipoGarantiaAtivaDoServico(servico)}
                          onClick={getOnAceitar(servico)}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Lista geral sem projeto selecionado */}
              {!projetoSelecionado && (
                <section className="flex flex-col gap-3" aria-labelledby="todos-servicos-title">
                  {outrosServicos.length > 0 ? (
                    <div className="flex flex-col gap-3" role="list">
                      {outrosServicos.map(servico => (
                        <div key={servico.id} role="listitem">
                          <ServicoCard
                            servico={servico}
                            onZoom={setZoomImage}
                            onAceitar={getOnAceitar(servico)}
                            hidePrestador
                            modo={getModo(servico)}
                            tipoGarantiaAtiva={tipoGarantiaAtivaDoServico(servico)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white py-24 text-slate-300">
                      <Clock size={32} className="mb-3 opacity-40" />
                      <p className="text-[11px] font-black uppercase tracking-widest">Nenhum projeto encontrado</p>
                    </div>
                  )}
                </section>
              )}

            </div>
          </div>
        </div>

        <div className="mt-6">
          <ContextualHelp context="meus-servicos" title="Dúvidas sobre seus serviços?" />
        </div>
      </div>
    </main>
  )
}
