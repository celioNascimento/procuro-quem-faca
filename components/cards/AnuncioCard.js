export default function AnuncioCard({ anuncio, registrarLog }) {
  if (!anuncio) return null

  return (
    <div className="py-2 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-4 mb-2">Publicidade</p>
      
      {anuncio.tipo === 'google' ? (
          <div className="w-full h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
            <span className="text-xs text-slate-400">Publicidade Google</span>
          </div>
      ) : (
        <a 
          href={anuncio.link_destino} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full h-32 md:h-44 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden relative group shadow-sm hover:shadow-md transition-all"
          onClick={() => registrarLog && registrarLog('CLIQUE_ANUNCIO', { anuncio_id: anuncio.id })}
        >
          {anuncio.imagem_url ? (
            <img 
              src={anuncio.imagem_url} 
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
              alt="Anúncio"
            />
          ) : null}
          
          {anuncio.imagem_url && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6">
              <span className="text-white font-bold text-sm tracking-tight drop-shadow-md">
                {anuncio.titulo}
              </span>
              <div className="ml-auto bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white font-black uppercase">
                Saiba Mais
              </div>
            </div>
          )}
        </a>
      )}
    </div>
  )
}