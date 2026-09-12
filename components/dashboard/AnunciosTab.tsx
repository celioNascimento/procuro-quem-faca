// components/dashboard/AnunciosTab.tsx

import { NUMERO_WHATSAPP_PQF } from '@/lib/config/contato'

export default function AnunciosTab() {
  const mensagem = encodeURIComponent('Olá! Sou prestador no Procuro Quem Faça e tenho interesse em saber mais sobre destaque de perfil.')
  const linkWhatsapp = `https://wa.me/${NUMERO_WHATSAPP_PQF}?text=${mensagem}`

  return (
    <div className="animate-in slide-in-from-right-2 duration-300 max-w-sm mx-auto pt-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <h4 className="font-black italic text-2xl tracking-tighter uppercase leading-none">Destaque sua<br/>marca</h4>
        <p className="text-[11px] font-bold uppercase opacity-80 mt-4 leading-relaxed">Apareça no topo das buscas da sua cidade.</p>
        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 block w-full rounded-2xl bg-white py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
        >
          Ver Planos
        </a>

       </div>
      </div>
  )
}
