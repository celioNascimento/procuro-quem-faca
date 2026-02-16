'use client'
import { useEffect, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Star, CheckCircle2, Clock, X, Maximize2, ShieldCheck, ChevronRight, User } from 'lucide-react'
import HeaderCliente from '@/components/HeaderCliente' // Importação do Header com Logo

export default function PaginaAvaliacaoCliente({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [projeto, setProjeto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    setMounted(true)
  }, []);

  useEffect(() => {
    async function carregar() {
      if (!token || !mounted) return
      
      const { data } = await supabase
        .from('portfolio_projetos')
        .select(`*, portfolio_fotos(*), prestadores(nome, foto_perfil, categoria:categorias(nome))`)
        .eq('id', params.id).eq('avaliacao_token', token).single()

      if (data) {
        setProjeto(data)
        localStorage.setItem('cliente_whatsapp', data.cliente_whatsapp)
        if (!data.data_inicio) {
          await supabase.from('portfolio_projetos').update({ data_inicio: new Date().toISOString() }).eq('id', data.id)
        }
      }
      setLoading(false)
    }
    carregar()
  }, [params.id, token, mounted])

  if (!mounted || loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Validando Acesso</p>
    </div>
  )

  if (!projeto) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-slate-100 max-w-sm">
        <span className="text-4xl mb-6 block">🚫</span>
        <h1 className="font-black uppercase italic text-2xl text-slate-800 mb-2 leading-none tracking-tighter">Link Expirado</h1>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Este acesso não é mais válido.</p>
      </div>
    </div>
  )

  const temConclusao = projeto.portfolio_fotos.some(f => f.ordem === 3)

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 font-sans antialiased">
      {/* NOVO HEADER COM LOGO EM PUBLIC E SAUDAÇÃO */}
      <HeaderCliente nomeCliente={projeto.cliente_nome?.split(' ')[0]} />

      <div className="max-w-xl mx-auto px-6 pt-12 space-y-12 animate-in fade-in duration-700">

        {/* HEADER: AUTORIDADE DO PRESTADOR */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src={projeto.prestadores.foto_perfil}
              className="w-24 h-24 rounded-full object-cover border-[6px] border-white shadow-2xl relative z-10"
              alt="Profissional"
            />
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-full z-20 border-4 border-white shadow-lg">
              <ShieldCheck size={16} strokeWidth={3} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
              Olá, {projeto.cliente_nome?.split(' ')[0] || 'Cliente'}
            </h1>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
              Relatório de Entrega • {projeto.prestadores.categoria?.nome}
            </p>
          </div>
        </div>

        {/* CARD DO SERVIÇO */}
        <div className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-200">
            <ShieldCheck size={80} strokeWidth={3} />
          </div>

          <div className="space-y-6 relative z-10 text-center">
            <h2 className="text-3xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
              {projeto.titulo}
            </h2>

            <div className="flex items-center justify-center gap-4">
              <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <User size={14} className="text-blue-600" />
                <div className="text-left">
                  <p className="text-[7px] font-black uppercase text-slate-400 leading-none">Profissional</p>
                  <p className="text-[11px] font-black uppercase italic text-slate-700">{projeto.prestadores.nome}</p>
                </div>
              </div>
              <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                <CheckCircle2 size={14} className="text-green-500" />
                <div className="text-left">
                  <p className="text-[7px] font-black uppercase text-slate-400 leading-none">Status</p>
                  <p className="text-[11px] font-black uppercase italic text-green-600 tracking-tighter">Verificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRADE DE EVIDÊNCIAS */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Registro Fotográfico</p>
            <div className="h-[2px] flex-1 bg-slate-50" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {projeto.portfolio_fotos.sort((a, b) => a.ordem - b.ordem).map((foto) => (
              <button
                key={foto.id}
                onClick={() => setFotoSelecionada(foto)}
                className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 border-2 border-slate-50 shadow-sm active:scale-95 transition-all"
              >
                <img src={foto.url_foto} className="w-full h-full object-cover" alt={foto.legenda} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <Maximize2 size={18} className="text-white opacity-0 group-hover:opacity-100 shadow-md" />
                </div>
                <div className="absolute bottom-2 left-0 right-0 px-2">
                  <span className="w-full block text-[7px] font-black uppercase text-white bg-blue-600/90 py-1 rounded-full backdrop-blur-sm">
                    {foto.legenda}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA DE AVALIAÇÃO */}
        <div className="pt-6">
          {temConclusao ? (
            <div className="bg-white p-10 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black italic uppercase text-slate-800 tracking-tighter">Assinar Conclusão</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">
                  Sua avaliação define o ranking <br />de confiança do profissional.
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverNota(star)}
                    onMouseLeave={() => setHoverNota(0)}
                    onClick={() => setNota(star)}
                    className="transition-all active:scale-90 p-1"
                  >
                    <Star
                      size={36}
                      fill={(hoverNota || nota) >= star ? "#2563eb" : "transparent"}
                      color={(hoverNota || nota) >= star ? "#2563eb" : "#E2E8F0"}
                      strokeWidth={2.5}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <textarea
                  className="w-full p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-blue-100 outline-none text-[12px] font-black uppercase italic text-slate-700 transition-all min-h-[120px] shadow-inner placeholder:text-slate-200"
                  placeholder="Seus comentários aqui..."
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                />
                <button
                  disabled={nota === 0 || submitting}
                  className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const { error } = await supabase.from('avaliacoes').insert({
                        projeto_id: projeto.id,
                        prestador_id: projeto.prestador_id,
                        nota: nota,
                        comentario: comentario,
                        cliente_whatsapp: projeto.cliente_whatsapp
                      })
                      if (error) throw error
                      router.push('/painel/perfil?success=true')
                    } catch (err) {
                      alert("Erro ao enviar avaliação")
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? 'VALIDANDO...' : 'Finalizar e Publicar'}
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center gap-3">
              <Clock className="text-slate-200" size={32} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Aguardando conclusão do serviço</p>
            </div>
          )}
        </div>

        <p className="text-center text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">
          Digital Protocol verified by ProcuroQuemFaça • 2026
        </p>
      </div>

      {/* LIGHTBOX */}
      {fotoSelecionada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-4 animate-in fade-in duration-300" onClick={() => setFotoSelecionada(null)}>
          <button className="absolute top-10 right-6 p-4 bg-slate-100 rounded-full text-slate-800 shadow-lg active:scale-90 transition-transform">
            <X size={24} strokeWidth={3} />
          </button>
          <div className="w-full max-w-lg flex flex-col items-center">
            <img src={fotoSelecionada.url_foto} className="w-full rounded-[2.5rem] shadow-2xl border-4 border-white" alt="Zoom" />
            <span className="mt-6 text-[11px] font-black uppercase italic text-slate-400 tracking-[0.4em]">
              {fotoSelecionada.legenda}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}