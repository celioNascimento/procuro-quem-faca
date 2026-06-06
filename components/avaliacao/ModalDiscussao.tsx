import { X, Loader2, Send } from 'lucide-react'
import type { FotoOrdenada, Comentario, Projeto } from '@/hooks/useAvaliacao'

type Props = {
  foto: FotoOrdenada
  projeto: Projeto
  comentarios: Comentario[]
  novoComentario: string
  setNovoComentario: (v: string) => void
  enviando: boolean
  onEnviar: () => void
  onClose: () => void
}

export function ModalDiscussao({
  foto,
  projeto,
  comentarios,
  novoComentario,
  setNovoComentario,
  enviando,
  onEnviar,
  onClose,
}: Props) {
  const labelFase =
    foto.ordem === 1 ? 'Início' : foto.ordem === 2 ? 'Execução' : 'Conclusão'

  const comentariosDaFoto = comentarios.filter((c) => c.foto_id === foto.id)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] shadow-2xl">

        {/* Painel de imagem */}
        <div className="flex-1 bg-slate-100 relative flex items-center justify-center overflow-hidden">
          <img
            src={foto.url_foto}
            className="w-full h-full object-contain"
            alt={`Fase ${labelFase}`}
          />

          {/* Fechar (mobile) */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-3 bg-black/20 backdrop-blur-md rounded-full text-white md:hidden active:scale-90 transition-all"
          >
            <X size={20} />
          </button>

          {/* Badge de fase */}
          <div className="absolute top-5 left-5 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
            Fase {labelFase}
          </div>
        </div>

        {/* Painel de discussão */}
        <div className="w-full md:w-[400px] bg-white flex flex-col border-l border-slate-50">

          {/* Cabeçalho */}
          <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 italic">
                Discussão Técnica
              </h3>
            </div>
            <button
              onClick={onClose}
              className="hidden md:block text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]/50">
            {/* Nota do prestador */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0 overflow-hidden border border-white shadow-sm">
                <img
                  src={projeto.prestadores?.foto_perfil}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <p className="text-[13px] font-medium text-slate-600 leading-relaxed italic">
                  {foto.legenda || 'Nota técnica enviada pelo prestador.'}
                </p>
              </div>
            </div>

            {/* Comentários */}
            {comentariosDaFoto.map((com) => (
              <div
                key={com.id}
                className={`flex gap-3 ${com.autor_tipo === 'cliente' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex-1 p-4 rounded-2xl border ${
                    com.autor_tipo === 'cliente'
                      ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-md'
                      : 'bg-white text-slate-700 border-slate-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="text-[13px] font-medium leading-relaxed">{com.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input de novo comentário */}
          <div className="p-5 bg-white border-t border-slate-50 shrink-0">
            <div className="relative">
              <input
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onEnviar()}
                placeholder="Tirar dúvida técnica..."
                className="w-full pl-6 pr-14 py-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none text-[13px] font-medium focus:border-blue-400 focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={onEnviar}
                disabled={enviando || !novoComentario.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl active:scale-90 transition-all disabled:opacity-30 shadow-lg shadow-blue-100"
              >
                {enviando ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}