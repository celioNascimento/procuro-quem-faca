'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import UploadWizard from './UploadWizard'

export default function PortfolioDashboardTab() {
  const [projetos, setProjetos] = useState([])
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [meuPrestadorId, setMeuPrestadorId] = useState(null)
  const [projetoParaEdicao, setProjetoParaEdicao] = useState(null)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
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
        // Buscamos os projetos e incluímos a contagem de avaliações para definir o status real
        const { data: meusProjetos } = await supabase
          .from('portfolio_projetos')
          .select('*, portfolio_fotos(*), avaliacoes(id)')
          .eq('prestador_id', prestador.id)
          .order('created_at', { ascending: false })
        
        setProjetos(meusProjetos || [])
      }
    } catch (err) {
      console.error("Erro dashboard:", err)
    } finally {
      setLoading(false)
    }
  }

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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">
            {showWizard ? (projetoParaEdicao ? 'Editar Registro' : 'Novo Serviço') : 'Portfólio Ativo'}
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {projetos.length} Projetos Publicados
          </p>
        </div>

        <button 
          onClick={showWizard ? () => setShowWizard(false) : abrirNovo}
          className={`group flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
            showWizard 
            ? 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50 shadow-slate-100' 
            : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-blue-200 hover:-translate-y-1 shadow-blue-100'
          }`}
        >
          {showWizard ? '← Cancelar' : (
            <>
              <span>+ Adicionar Trabalho</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-lg group-hover:bg-white/40 transition-colors">N</span>
            </>
          )}
        </button>
      </header>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projetos.map(proj => {
            const fotos = proj.portfolio_fotos || []
            const capa = fotos.sort((a,b) => b.ordem - a.ordem)[0]?.url_foto
            
            // Lógica de Status Precisa
            const jaAvaliado = proj.avaliacoes?.length > 0
            const aguardandoAvaliacao = proj.status === 'finalizado' && !jaAvaliado

            return (
              <div 
                key={proj.id} 
                onClick={() => abrirEdicao(proj)}
                className="group relative bg-white p-2 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer flex items-center"
              >
                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 overflow-hidden shrink-0 relative">
                  <img src={capa || '/placeholder-job.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                </div>

                <div className="pl-6 pr-8 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     {/* TAG DE STATUS ALTERADA: Azul para Aguardando Avaliação, Verde para Finalizado/Avaliado e Slate para Progresso */}
                     <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-lg ${
                       aguardandoAvaliacao ? 'bg-blue-50 text-blue-600 animate-pulse' : 
                       jaAvaliado ? 'bg-green-50 text-green-600' : 
                       'bg-slate-50 text-slate-400'
                     }`}>
                        {aguardandoAvaliacao ? 'Aguardando Avaliação' : jaAvaliado ? 'Concluído' : 'Em Progresso'}
                     </span>
                     <span className="text-slate-300 text-[8px] font-bold uppercase tracking-widest">• {fotos.length} Fotos</span>
                  </div>
                  
                  <h4 className="font-black text-slate-700 uppercase italic text-sm leading-tight group-hover:text-blue-600 transition-colors truncate">
                    {proj.titulo}
                  </h4>
                  
                  <p className="text-blue-400 text-[9px] font-bold uppercase mt-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Editar Detalhes →
                  </p>
                </div>

                <div className="absolute right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                   </div>
                </div>
              </div>
            )
          })}

          {projetos.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
               <span className="text-5xl block mb-6 opacity-30">📂</span>
               <h3 className="text-slate-400 font-black uppercase italic tracking-widest text-sm">Seu portfólio está em branco</h3>
               <p className="text-slate-300 text-[10px] font-bold uppercase mt-2">Adicione seu primeiro serviço para atrair mais clientes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}