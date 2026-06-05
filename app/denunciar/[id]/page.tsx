'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { criarDenuncia } from '@/lib/services/denuncia.service'

export default function PaginaDenuncia() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function enviarDenuncia() {
    if (!motivo.trim() || !id) return 
    setEnviando(true)
    
    try {
      const prestadorId = Number(id)
      
      // Chamada limpa para a camada de serviço
      await criarDenuncia(prestadorId, motivo)

      setSucesso(true)
      
    } catch (error) {
      console.error(error)
      alert("Ocorreu um erro ao enviar. Tente novamente.")
    } finally { 
      setEnviando(false) 
    }
  }

  // --- TELA DE SUCESSO (ELEGANTE) ---
  if (sucesso) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Fundo Decorativo Sutil */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />
        
        <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-slate-100 text-center relative z-10 animate-in zoom-in-95 duration-500">
          
          {/* Ícone de Escudo Animado */}
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>

          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-4">
            Denúncia Recebida
          </h2>
          
          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-8 px-4">
            Agradecemos por ajudar a manter nossa comunidade segura. Nossa equipe de moderação analisará este perfil imediatamente.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.back()} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Voltar para a Lista
            </button>
            <Link 
              href="/" 
              className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              Ir para o Início
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // --- FORMULÁRIO (PADRÃO) ---
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Header href="/" />
      <div className="max-w-xl mx-auto pt-32 md:pt-40 px-6">
        
        <header className="mb-10 text-center md:text-left">
          <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 inline-block">
            Moderação
          </span>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-2">
            Reportar Perfil
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest font-sans">
            Seu reporte é anônimo e seguro
          </p>
        </header>

        <div className="bg-white p-1 rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-50">
          <div className="p-6 md:p-8 space-y-6">
            
            <div className="space-y-2">
              <label className="block text-slate-400 font-black text-[10px] uppercase tracking-widest ml-2">
                Motivo da Denúncia
              </label>
              <textarea 
                className="w-full h-48 p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 outline-none focus:border-red-400 focus:bg-white text-slate-700 font-bold text-sm placeholder:text-slate-300 transition-all resize-none"
                placeholder="Por favor, descreva o problema encontrado com este prestador..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button 
                onClick={enviarDenuncia}
                disabled={enviando || !motivo.trim()}
                className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${
                  enviando || !motivo.trim() 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                }`}
              >
                {enviando ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Confirmar Denúncia'
                )}
              </button>
              
              <button 
                onClick={() => router.back()} 
                className="py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
        
        <div className="mt-8 text-center px-8">
           <p className="text-[10px] text-slate-300 leading-relaxed">
             Nossa equipe analisa todas as denúncias manualmente. Falsas denúncias podem levar ao banimento da plataforma.
           </p>
        </div>

      </div>
    </main>
  )
}