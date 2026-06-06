'use client'
import { ShieldCheck } from 'lucide-react'
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

  const iniciais = nomeCliente.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans antialiased">
      <HeaderCliente nomeCliente={nomeCliente} />

      {zoomImage && (
        <ZoomImageModal url={zoomImage} onClose={() => setZoomImage(null)} />
      )}

      <div className="max-w-5xl mx-auto px-5 pt-24 md:pt-36 animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Coluna Esquerda — identidade */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="lg:sticky lg:top-36 flex flex-col gap-6">

              {/* Card do cliente */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-500" />
                <div className="px-8 pb-8 -mt-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-blue-600 border-4 border-white shadow-xl flex items-center justify-center text-white font-black text-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover rounded-[1.2rem]" alt="Avatar" />
                    ) : (
                      iniciais || '?'
                    )}
                  </div>
                  <h2 className="text-base font-black text-slate-800 mt-3 leading-none text-center uppercase italic tracking-tight">
                    {nomeCliente || 'Cliente'}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Conectado como cliente
                  </span>
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Aguardando aprovação</p>
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
                    <p className="text-sm font-black italic uppercase leading-none tracking-tight">Protocolo Seguro</p>
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
            <div>
              <h1 className="text-4xl md:text-5xl font-black italic uppercase text-slate-800 leading-[0.9] tracking-tighter">
                Projetos<br /><span className="text-blue-600">Pendentes</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-500 mt-2">
                Você tem <span className="font-bold text-slate-800">{servicos.length}</span>{' '}
                {servicos.length === 1 ? 'projeto aguardando' : 'projetos aguardando'} aprovação.
              </p>
            </div>

            <div className="space-y-6">
              {servicos.map(servico => (
                <ServicoCard
                  key={servico.id}
                  servico={servico}
                  onZoom={setZoomImage}
                  onAceitar={handleAceitar}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}