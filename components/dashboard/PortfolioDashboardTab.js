'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import UploadWizard from './UploadWizard'
import { Plus } from 'lucide-react'
// import { MessageSquare } from 'lucide-react' // Chat estacionado

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
          .select(`
            *, 
            portfolio_fotos(id, url_foto, ordem), 
            avaliacoes(id)
            /* , projeto_mensagens(id, lido, remetente_tipo) */ -- Chat estacionado
          `)
          .eq('prestador_id', prestador.id)
          .order('created_at', { ascending: false })
        
        // Chat estacionado: Lógica de contagem de notificações removida do fluxo principal
        const projetosProcessados = meusProjetos?.map(proj => {
          return { ...proj, notifCount: 0 };
        });

        setProjetos(projetosProcessados || [])
      }
    } catch (err) {
      console.error("Erro dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
    
    /* -- Chat Realtime estacionado para cumprir cronograma principal --
    const channel = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'projeto_mensagens' 
      }, () => {
        carregarDados() 
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    */
  }, [carregarDados])

  const abrirEdicao = (projeto) => {
    setProjetoParaEdicao(projeto)
    setShowWizard(true)
  }

  const abrirNovo = () => {
    setProjetoParaEdicao(null) 
    setShowWizard(true)
  }

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-100 rounded-[2.5rem]" />
      ))}
    </div>
  )

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER DO DASHBOARD - Tipografia Limpa e Alinhamento */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-50 shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
            {showWizard ? (projetoParaEdicao ? 'Gerenciar Serviço' : 'Novo Serviço') : 'Portfólio Ativo'}
          </h2>
          <p className="text-slate-500 text-[12px] font-medium mt-1 flex items-center gap-2">
            {!showWizard && (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                {projetos.length} {projetos.length === 1 ? 'Projeto Publicado' : 'Projetos Publicados'}
              </>
            )}
            {showWizard && 'Preencha os dados do serviço abaixo'}
          </p>
        </div>

        <button 
          onClick={showWizard ? () => setShowWizard(false) : abrirNovo}
          className={`group flex items-center gap-2 px-6 py-3.5 md:py-4 rounded-[2rem] text-[13px] font-bold transition-all duration-300 w-full md:w-auto justify-center ${
            showWizard 
            ? 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95'
          }`}
        >
          {showWizard ? '← Voltar para Lista' : (
            <>
              <Plus size={18} />
              <span>Adicionar Trabalho</span>
            </>
          )}
        </button>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      {showWizard && meuPrestadorId ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          <UploadWizard 
            key={projetoParaEdicao?.id || 'novo'} 
            prestadorId={meuPrestadorId} 
            projetoExistente={projetoParaEdicao}
            onComplete={() => {
              setShowWizard(false)
              setProjetoParaEdicao(null)
              carregarDados()
            }} 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {projetos.map(proj => {
            const fotos = proj.portfolio_fotos || []
            const capa = fotos.sort((a,b) => b.ordem - a.ordem)[0]?.url_foto
            
            const jaAvaliado = proj.avaliacoes?.length > 0
            const aguardandoAvaliacao = proj.status === 'finalizado' && !jaAvaliado

            return (
              <div 
                key={proj.id} 
                onClick={() => abrirEdicao(proj)}
                className="group relative bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 cursor-pointer flex items-center"
              >
                
                {/* Imagem de Capa do Projeto */}
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-slate-50 overflow-hidden shrink-0 relative">
                  <img src={capa || '/placeholder-job.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors" />
                </div>

                {/* Informações do Projeto */}
                <div className="pl-5 pr-4 md:pr-6 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                     <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                       aguardandoAvaliacao ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 
                       jaAvaliado ? 'bg-green-50 text-green-600 border-green-100' : 
                       'bg-slate-50 text-slate-500 border-slate-200'
                     }`}>
                       {aguardandoAvaliacao ? 'Aguardando Avaliação' : jaAvaliado ? 'Concluído' : 'Em Progresso'}
                     </span>
                     <span className="text-slate-400 text-[10px] font-medium whitespace-nowrap">
                       • {fotos.length} {fotos.length === 1 ? 'Foto' : 'Fotos'}
                     </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 text-[15px] md:text-base leading-tight group-hover:text-blue-600 transition-colors truncate">
                    {proj.titulo}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    <span className="text-blue-600 text-[11px] md:text-[12px] font-semibold">
                      Gerenciar Serviço →
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