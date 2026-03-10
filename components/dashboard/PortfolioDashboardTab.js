'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import UploadWizard from './UploadWizard'
import { Plus, ImageOff, CheckCircle2, Clock, AlertCircle, Pencil, Camera } from 'lucide-react'

export default function PortfolioDashboardTab() {
  const [projetos, setProjetos] = useState([])
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [meuPrestadorId, setMeuPrestadorId] = useState(null)
  const [projetoParaEdicao, setProjetoParaEdicao] = useState(null)

  const carregarDados = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prestador } = await supabase
        .from('prestadores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (prestador) {
        setMeuPrestadorId(prestador.id)
        const { data: meusProjetos } = await supabase
          .from('portfolio_projetos')
          .select(`*, portfolio_fotos(id, url_foto, ordem), avaliacoes(id)`)
          .eq('prestador_id', prestador.id)
          .order('created_at', { ascending: false })

        setProjetos(meusProjetos?.map(p => ({ ...p, notifCount: 0 })) || [])
      }
    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  const abrirEdicao = (projeto) => { setProjetoParaEdicao(projeto); setShowWizard(true) }
  const abrirNovo   = () => { setProjetoParaEdicao(null); setShowWizard(true) }

  const statusConfig = (proj) => {
    const jaAvaliado = proj.avaliacoes?.length > 0
    const s = proj.status
    if (s === 'em_registro')  return { label: 'Rascunho',            icon: <Pencil size={9} />,       cls: 'bg-slate-100 text-slate-500 border-slate-200' }
    if (s === 'pendente')     return { label: 'Aguard. cliente',     icon: <Clock size={9} />,         cls: 'bg-amber-50 text-amber-600 border-amber-200' }
    if (s === 'em_execucao')  return { label: 'Em progresso',        icon: <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />, cls: 'bg-blue-50 text-blue-600 border-blue-200' }
    if (s === 'finalizado' && jaAvaliado)   return { label: 'Concluído',           icon: <CheckCircle2 size={9} />, cls: 'bg-green-50 text-green-600 border-green-200' }
    if (s === 'finalizado' && !jaAvaliado)  return { label: 'Aguard. avaliação',   icon: <AlertCircle size={9} />,  cls: 'bg-amber-50 text-amber-600 border-amber-200' }
    return { label: s, icon: null, cls: 'bg-slate-100 text-slate-500 border-slate-200' }
  }

  if (loading) return (
    <div className="px-5 md:px-8 space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-[2rem]" />)}
    </div>
  )

  // ── Wizard ──────────────────────────────────────────────────────────────
  if (showWizard && meuPrestadorId) return (
    <div className="px-5 md:px-8">
      {/* Mini header dentro da aba */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tight">
            {projetoParaEdicao ? 'Gerenciar Serviço' : 'Novo Serviço'}
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            Preencha os dados abaixo
          </p>
        </div>
        <button
          onClick={() => setShowWizard(false)}
          className="px-4 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
        >
          ← Voltar
        </button>
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
        <UploadWizard
          key={projetoParaEdicao?.id || 'novo'}
          prestadorId={meuPrestadorId}
          projetoExistente={projetoParaEdicao}
          onComplete={() => { setShowWizard(false); setProjetoParaEdicao(null); carregarDados() }}
        />
      </div>
    </div>
  )

  // ── Lista ──────────────────────────────────────────────────────────────
  const concluidos  = projetos.filter(p => p.status === 'finalizado' && p.avaliacoes?.length > 0).length
  const ativos      = projetos.filter(p => ['pendente','em_execucao'].includes(p.status)).length

  return (
    <div className="px-5 md:px-8 pb-20 space-y-6">

      {/* ── Cabeçalho com métricas ── */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden">
        {/* Decoração geométrica */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-4 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Portfólio</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight leading-none">
              {projetos.length === 0 ? 'Nenhum Projeto' : `${projetos.length} ${projetos.length === 1 ? 'Projeto' : 'Projetos'}`}
            </h2>
            {projetos.length > 0 && (
              <div className="flex items-center gap-4 mt-3">
                {concluidos > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                    <CheckCircle2 size={12} className="text-green-300" />
                    {concluidos} concluído{concluidos > 1 ? 's' : ''}
                  </span>
                )}
                {ativos > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-100">
                    <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                    {ativos} ativo{ativos > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={abrirNovo}
            className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 active:scale-95 transition-all shadow-lg shadow-blue-800/20 shrink-0 w-full md:w-auto"
          >
            <Plus size={16} strokeWidth={3} />
            Adicionar Trabalho
          </button>
        </div>
      </div>

      {/* ── Estado vazio ── */}
      {projetos.length === 0 && (
        <div
          onClick={abrirNovo}
          className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center gap-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Camera size={28} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
          </div>
          <div>
            <p className="text-[13px] font-black text-slate-400 uppercase italic tracking-tight">Nenhum projeto ainda</p>
            <p className="text-[11px] text-slate-300 font-medium mt-1">Clique aqui para adicionar seu primeiro trabalho</p>
          </div>
        </div>
      )}

      {/* ── Grid de projetos ── */}
      {projetos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projetos.map(proj => {
            const fotos = proj.portfolio_fotos || []
            const capa  = [...fotos].sort((a, b) => b.ordem - a.ordem)[0]?.url_foto
            const { label, icon, cls } = statusConfig(proj)

            return (
              <div
                key={proj.id}
                onClick={() => abrirEdicao(proj)}
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 cursor-pointer overflow-hidden flex"
              >
                {/* Thumbnail */}
                <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 bg-slate-50 relative self-stretch">
                  {capa ? (
                    <img
                      src={capa}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={proj.titulo}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff size={20} className="text-slate-200" />
                    </div>
                  )}
                  {/* Contador de fotos */}
                  {fotos.length > 0 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      {fotos.length}
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
                        {icon}{label}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-800 text-[14px] leading-tight truncate group-hover:text-blue-600 transition-colors">
                      {proj.titulo}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-300 font-medium">
                      {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-200">
                      Editar →
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}