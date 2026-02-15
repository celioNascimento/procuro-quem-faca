'use client'
import Image from 'next/image'
import { useState, useRef } from 'react'
import FormularioAvaliacao from './FormularioAvaliacao'

export default function ProjetoModal({ projeto, onClose }) {
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)
  // Como é export default, você pode renomear na importação

  const fotos = [...projeto.portfolio_fotos].sort((a, b) => a.ordem - b.ordem)

  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return null
    const d1 = new Date(inicio), d2 = new Date(fim)
    const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24))
    return diffDays === 0 ? "Concluído no mesmo dia" : `${diffDays} ${diffDays > 1 ? 'dias' : 'dia'} de trabalho`
  }

  const duracao = calcularDuracao(projeto.data_inicio, projeto.data_conclusao)

  const minSwipeDistance = 50
  const onTouchStart = (e) => { touchEndX.current = null; touchStartX.current = e.targetTouches[0].clientX }
  const onTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX }
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    if (distance > minSwipeDistance && fotoAtiva < fotos.length - 1) setFotoAtiva(prev => prev + 1)
    if (distance < -minSwipeDistance && fotoAtiva > 0) setFotoAtiva(prev => prev - 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-6xl max-h-[92vh] md:h-[80vh] rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 my-auto flex flex-col md:flex-row">
        
        {/* LADO DA IMAGEM */}
        <div className="relative w-full md:flex-1 bg-slate-50 flex items-center justify-center h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-slate-100 touch-pan-y"
             onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <img key={fotos[fotoAtiva]?.url_foto} src={fotos[fotoAtiva]?.url_foto} className="w-full h-full object-contain p-4 md:p-10 select-none pointer-events-none" alt="Preview"/>
          
          <div className="absolute inset-x-2 md:inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
            <button onClick={(e) => { e.stopPropagation(); if(fotoAtiva > 0) setFotoAtiva(v => v - 1); }}
                    className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-slate-800 pointer-events-auto transition-all ${fotoAtiva === 0 ? 'opacity-0' : 'opacity-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); if(fotoAtiva < fotos.length - 1) setFotoAtiva(v => v + 1); }}
                    className={`w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center text-slate-800 pointer-events-auto transition-all ${fotoAtiva === fotos.length - 1 ? 'opacity-0' : 'opacity-100'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/80 backdrop-blur rounded-xl border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase italic">Etapa <span className="text-blue-600">{fotoAtiva + 1}/{fotos.length}</span></p>
          </div>
        </div>

        {/* LADO DA INFO */}
        <div className="w-full md:w-[380px] bg-white flex flex-col h-full overflow-hidden">
          <div className="p-5 md:p-8 pb-0 flex justify-between items-center z-10">
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${fotos.some(f => f.ordem === 3) ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              {fotos.some(f => f.ordem === 3) ? '✓ Concluído' : '🛠️ Em Evolução'}
            </span>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-red-500 transition-all">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-8 pt-4 space-y-6">
            <section>
              <h3 className="text-xl font-black italic uppercase text-slate-800 leading-tight mb-3">{projeto.titulo}</h3>
              {duracao && (
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 animate-in slide-in-from-left-4">
                  <span className="text-lg">⏱️</span>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tempo de Execução</p>
                    <p className="text-[11px] font-black text-slate-700 uppercase italic">{duracao}</p>
                  </div>
                </div>
              )}
              <p className="text-slate-500 text-xs leading-relaxed font-medium">{projeto.descricao}</p>
            </section>

            {/* FORMULÁRIO DE AVALIAÇÃO INTEGRADO AO FINAL */}
            <section className="pt-6 border-t border-slate-100">
               <FormularioAvaliacao 
                  projetoId={projeto.id} 
                  prestadorId={projeto.prestador_id} 
                  onComplete={() => alert('Feedback enviado!')}
               />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}