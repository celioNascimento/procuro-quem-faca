//components/CookieConsent.tsx

'use client'
import { useCookieConsent } from '@/hooks/useCookieConsent'

export default function CookieConsent() {
  const { isVisible, aceitar } = useCookieConsent()

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
              onClick={aceitar}
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