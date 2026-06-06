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
    tokenUrl, nomeCliente,
    handleAceitar,
  } = usePainelCliente()

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  if (!session) return <LoginGate tokenUrl={tokenUrl} />

  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-32 font-sans antialiased">
      <HeaderCliente nomeCliente={nomeCliente} />

      {zoomImage && (
        <ZoomImageModal url={zoomImage} onClose={() => setZoomImage(null)} />
      )}

      <div className="max-w-xl mx-auto px-6 pt-24 md:pt-36 space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-slate-800 leading-[0.9] tracking-tighter">
            Projetos<br /><span className="text-blue-600">Pendentes</span>
          </h1>
          <p className="text-[11px] font-medium text-slate-500 pl-1">
            Você tem <span className="font-bold text-slate-800">{servicos.length}</span>{' '}
            {servicos.length === 1 ? 'projeto aguardando' : 'projetos aguardando'} aprovação.
          </p>
        </div>

        <div className="space-y-8">
          {servicos.map(servico => (
            <ServicoCard
              key={servico.id}
              servico={servico}
              onZoom={setZoomImage}
              onAceitar={handleAceitar}
            />
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-lg font-black italic uppercase leading-none tracking-tight">Protocolo Seguro</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 leading-relaxed max-w-[200px]">
                Ao autorizar, você gera um token único de acompanhamento criptografado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}