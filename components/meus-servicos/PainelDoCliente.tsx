'use client'
import { ShieldCheck, User } from 'lucide-react'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import LoginGate from './LoginGate'
import ServicoCard from './ServicoCard'
import ZoomImageModal from './ZoomImageModal'
import { usePainelCliente } from '@/hooks/usePainelCliente'

export default function PainelDoCliente() {
  const {
    session, servicos, loading,
    zoomImage, setZoomImage,
    tokenUrl, nomeCliente, avatarUrl,
    handleAceitar,
  } = usePainelCliente()

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  if (!session) return <LoginGate tokenUrl={tokenUrl} />

  // Pega dados do primeiro serviço (prestador é o mesmo para todos os cards)
  const prestador = servicos[0]?.prestadores

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans antialiased">
      <HeaderCliente nomeCliente={nomeCliente} />

      {zoomImage && (
        <ZoomImageModal url={zoomImage} onClose={() => setZoomImage(null)} />
      )}

      <div className="max-w-5xl mx-auto px-5 pt-24 md:pt-36 animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Coluna Esquerda */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="lg:sticky lg:top-36 flex flex-col gap-6">

              {/* Card do prestador */}
              {prestador && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-500" />
                  <div className="px-8 pb-8 -mt-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      {prestador.foto_perfil ? (
                        <img
                          src={prestador.foto_perfil}
                          className="w-full h-full object-cover"
                          alt={prestador.nome}
                        />
                      ) : (
                        <User size={32} className="text-slate-300" />
                      )}
                    </div>
                    <h2 className="text-base font-black text-slate-800 mt-3 leading-none text-center uppercase italic tracking-tight">
                      {prestador.nome}
                    </h2>
                    {prestador.categoria?.nome && (
                      <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {prestador.categoria.nome}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Resumo */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Aguardando aprovação
                </p>
                <span className="text-4xl font-black text-slate-800">{servicos.length}</span>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {servicos.length === 1 ? 'projeto pendente' : 'projetos pendentes'}
                </p>
              </div>

              {/* Protocolo seguro */}
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black italic uppercase leading-none tracking-tight">
                      Protocolo Seguro
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-relaxed">
                      Ao autorizar, você gera um token único de acompanhamento criptografado.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Coluna Direita — serviços */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">

            {/* Título no padrão do app */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Meus Projetos
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'pendente', label: 'Aceitar' },
                ].map(f => (
                  <span
                    key={f.id}
                    className="px-5 py-2.5 rounded-full text-[12px] font-semibold border bg-blue-600 text-white border-blue-600"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {servicos.map(servico => (
                <ServicoCard
                  key={servico.id}
                  servico={servico}
                  onZoom={setZoomImage}
                  onAceitar={handleAceitar}
                  hidePrestador // oculta o cabeçalho do prestador no card pois já está na esquerda
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}