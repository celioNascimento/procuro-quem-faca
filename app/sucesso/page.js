'use client'
import Link from 'next/link'
import { CheckCircle2, Award, Heart, Share2, ArrowRight } from 'lucide-react'

export default function PaginaSucesso() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans antialiased">
      <div className="max-w-sm w-full space-y-8 animate-in fade-in zoom-in duration-700">
        
        {/* ÍCONE DE SUCESSO DE ALTO IMPACTO */}
        <div className="relative inline-flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-blue-600/10 blur-[60px] rounded-full scale-150" />
          <div className="w-24 h-24 bg-blue-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 relative z-10">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-50 animate-bounce">
            <Award size={20} className="text-amber-500" />
          </div>
        </div>

        {/* TEXTO DE PRESTÍGIO */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Serviço Concluído!</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Obrigado por confiar no nosso ecossistema técnico.</p>
        </div>

        {/* CARD DE RESUMO SUTIL */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-6">
          <p className="text-[13px] font-bold text-slate-600 italic leading-relaxed">
            Sua avaliação foi registrada com sucesso e ajuda a manter o rigor de qualidade dos nossos profissionais.
          </p>
          
          <div className="flex items-center justify-center gap-4 py-2 border-y border-slate-50">
            <Heart size={18} className="text-pink-500 fill-pink-500" />
            <span className="text-[10px] font-black uppercase text-slate-800 italic">Obrigado pela preferência!</span>
          </div>

          {/* BOTÃO AZUL REFINADO */}
          <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 hover:shadow-blue-200 transition-all">
            Compartilhar Resultado <Share2 size={14} />
          </button>
        </div>

        {/* VOLTAR PARA INÍCIO */}
        <Link href="/" className="inline-flex items-center gap-2 text-blue-500/60 hover:text-blue-600 font-black uppercase text-[10px] tracking-[0.3em] italic hover:gap-4 transition-all">
          Voltar para a Home <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
