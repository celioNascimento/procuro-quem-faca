'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import UploadWizard from './UploadWizard'
import { MessageSquare } from 'lucide-react'

export default function PortfolioDashboardTab() {
  const [projetos, setProjetos] = useState([])
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)
  const [meuPrestadorId, setMeuPrestadorId] = useState(null)
  const [projetoParaEdicao, setProjetoParaEdicao] = useState(null)

  // --- LÓGICA DE PERSISTÊNCIA DE LEITURA (PRESTADOR) ---
  const getUltimaLidaLocal = (projetoId, fotoId) => {
    if (typeof window === 'undefined') return null
    const salvo = localStorage.getItem(`lido_prestador_${projetoId}_${fotoId}`)
    return salvo || null
  }

  const marcarComoLidoLocal = (projetoId, comentarios) => {
    // Agrupa por foto e pega o ID da mensagem mais recente
    const ultimasPorFoto = {}
    comentarios.forEach(c => {
      if (!ultimasPorFoto[c.foto_id] || new Date(c.criado_at) > new Date(ultimasPorFoto[c.foto_id].criado_at)) {
        ultimasPorFoto[c.foto_id] = c
      }
    })

    Object.keys(ultimasPorFoto).forEach(fotoId => {
      localStorage.setItem(`lido_prestador_${projetoId}_${fotoId}`, ultimasPorFoto[fotoId].id)
    })
  }
  // ----------------------------------------------------

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
            portfolio_fotos(*), 
            avaliacoes(id),
            portfolio_comentarios(id, foto_id, autor_tipo, criado_at)
          `)
          .eq('prestador_id', prestador.id)
          .order('created_at', { ascending: false })
        
        setProjetos(meusProjetos || [])
      }
    } catch (err) {
      console.error("Erro dashboard:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const abrirEdicao = (projeto) => {
    // Antes de abrir, "limpamos" as notificações marcando as mensagens atuais como lidas localmente
    if (projeto.portfolio_comentarios) {
      marcarComoLidoLocal(projeto.id, projeto.portfolio_comentarios)
    }
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
            
            const jaAvaliado = proj.avaliacoes?.length > 0
            const aguardandoAvaliacao = proj.status === 'finalizado' && !jaAvaliado

            // --- NOVA LÓGICA DE NOTIFICAÇÃO (Persistente) ---
            const threadsComNovidade = new Set();
            const fotosProcessadas = new Set();
            
            // Ordena mensagens da mais recente para a mais antiga
            const mensagensOrdenadas = [...(proj.portfolio_comentarios || [])].sort(
              (a, b) => new Date(b.criado_at) - new Date(a.criado_at)
            );

            mensagensOrdenadas.forEach(msg => {
              if (!fotosProcessadas.has(msg.foto_id)) {
                const ultimaLidaId = getUltimaLidaLocal(proj.id, msg.foto_id);
                
                // Só notifica se: (Autor for cliente) E (A mensagem for diferente da última lida salva)
                if (msg.autor_tipo === 'cliente' && msg.id !== ultimaLidaId) {
                  threadsComNovidade.add(msg.foto_id);
                }
                fotosProcessadas.add(msg.foto_id);
              }
            });

            const countNovidades = threadsComNovidade.size;

            return (
              <div 
                key={proj.id} 
                onClick={() => abrirEdicao(proj)}
                className="group relative bg-white p-2 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer flex items-center"
              >
                {countNovidades > 0 && (
                  <div className="absolute -top-2 -right-2 z-20 bg-red-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-red-100 flex items-center gap-1 animate-bounce">
                    <MessageSquare size={8} fill="currentColor" />
                    {countNovidades} {countNovidades === 1 ? 'Nova Ideia' : 'Novas Ideias'}
                  </div>
                )}

                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 overflow-hidden shrink-0 relative">
                  <img src={capa || '/placeholder-job.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                </div>

                <div className="pl-6 pr-8 flex-1">
                  <div className="flex items-center gap-2 mb-2">
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
                    Interagir e Editar →
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}