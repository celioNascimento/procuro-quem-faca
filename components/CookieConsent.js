// Arquivo: components/CookieConsent.js
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CookieConsent() {

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    verificarConsentimento()
  }, [])

  const verificarConsentimento = async () => {
    // 1. Verificação Local
    const localConsent = localStorage.getItem('app_cookie_consent')
    if (localConsent) return 

    // 2. Verificação no Banco
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data: logExistente } = await supabase
        .from('logs_atividades')
        .select('id')
        .eq('usuario_id', session.user.id)
        .eq('acao', 'ACEITE_COOKIES')
        .limit(1)
        .single()

      if (logExistente) {
        localStorage.setItem('app_cookie_consent', 'true')
        return 
      }
    }

    // 3. Mostra banner
    const timer = setTimeout(() => setIsVisible(true), 1500)
    return () => clearTimeout(timer)
  }

  const handleAceitar = async () => {
    localStorage.setItem('app_cookie_consent', 'true')
    setIsVisible(false)
    
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id || null
    const userEmail = session?.user?.email || null

    try {
      await supabase.from('logs_atividades').insert({
        acao: 'ACEITE_COOKIES',
        entidade_tipo: 'consentimento',
        usuario_id: userId,
        usuario_email: userEmail,
        detalhes: { 
          navegador: window.navigator.userAgent, 
          resolucao: `${window.screen.width}x${window.screen.height}`,
          data_aceite: new Date().toISOString()
        }
      })
    } catch (err) {
      console.error('Erro silencioso ao registrar cookie:', err)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999]">
      <div className="bg-white/95 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] shadow-2xl shadow-blue-900/10 animate-in slide-in-from-bottom-10 duration-700">
        <div className="flex items-start gap-4">
          <div className="bg-amber-100 p-3 rounded-2xl shrink-0 animate-bounce-slow">
            <span className="text-2xl">🍪</span>
          </div>
          <div className="flex-1">
            <h3 className="text-slate-900 font-black uppercase italic text-sm mb-2 tracking-tight">
              Sua privacidade importa
            </h3>
            <p className="text-slate-500 text-[10px] font-bold leading-relaxed mb-4">
              Utilizamos cookies para melhorar sua experiência e registrar estatísticas de acesso. Ao continuar, você concorda com nossa política.
            </p>
            <button 
              onClick={handleAceitar}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors shadow-lg active:scale-95"
            >
              Aceitar e Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
