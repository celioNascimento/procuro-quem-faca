'use client'
import { useEffect, useRef, useState } from 'react'

export default function AnuncioCard({ anuncio }) {
  const adRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  if (!anuncio) return null

  useEffect(() => {
    if (anuncio.tipo !== 'google') return;

    const initAd = () => {
      try {
        if (typeof window !== "undefined" && window.adsbygoogle && adRef.current) {
          const width = adRef.current.offsetWidth;
          if (width >= 250 && !adRef.current.getAttribute('data-adsbygoogle-status')) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
          }
        }
      } catch (e) {
        console.warn("AdSense logic:", e);
      }
    };

    const timer = setTimeout(initAd, 800);
    return () => clearTimeout(timer);
  }, [anuncio]);

  return (
    <div className="py-2 animate-in fade-in slide-in-from-bottom-2 w-full">
      {/* CSS DE CONTENÇÃO ABSOLUTA */}
      <style jsx global>{`
        /* Ataca todas as camadas que o Google cria */
        .google-fixed-height, 
        .google-fixed-height ins, 
        .google-fixed-height iframe,
        .google-fixed-height span {
          max-height: 130px !important; /* Trava absoluta */
          height: 130px !important;
          overflow: hidden !important;
        }
      `}</style>

      <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-4 mb-2">Publicidade</p>
      
      {anuncio.tipo === 'google' ? (
        <div className="w-full bg-white rounded-[2rem] border border-slate-100 overflow-hidden relative h-[130px] flex items-center justify-center google-fixed-height">
          
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest animate-pulse">
                Carregando...
              </span>
            </div>
          )}

          <div 
            ref={adRef}
            className="w-full"
            /* Forçamos o HTML do banco a também carregar com a trava inline */
            dangerouslySetInnerHTML={{ 
              __html: anuncio.codigo_google.replace('<ins', '<ins style="display:block; width:100%; height:130px !important;"') 
            }} 
          />
          
          <span className="absolute bottom-2 right-6 text-[7px] text-slate-400/50 uppercase font-black pointer-events-none tracking-widest z-20">
            Google Partner
          </span>
        </div>
      ) : (
        <a 
          href={anuncio.link_destino} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full h-32 md:h-44 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden relative group shadow-sm hover:shadow-md transition-all"
        >
          {anuncio.imagem_url && (
            <img 
              src={anuncio.imagem_url} 
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
              alt="Anúncio"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6">
            <span className="text-white font-bold text-sm tracking-tight drop-shadow-md uppercase">
              {anuncio.titulo}
            </span>
          </div>
        </a>
      )}
    </div>
  )
}
