'use client'
import { User } from 'lucide-react'
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

              {/* O que acontece ao autorizar */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Ao autorizar o serviço
                </p>
                <div className="space-y-3">
                  {[
                    { n: '01', texto: 'Você confirma que o prestador pode iniciar o trabalho' },
                    { n: '02', texto: 'Um token único e criptografado é gerado para rastrear o projeto' },
                    { n: '03', texto: 'Você poderá acompanhar e avaliar ao final' },
                  ].map(item => (
                    <div key={item.n} className="flex items-start gap-3">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 rounded-lg px-2 py-1 shrink-0 mt-0.5">
                        {item.n}
                      </span>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                        {item.texto}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Coluna Direita — serviços */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="space-y-6">
              {servicos.map(servico => (
                <ServicoCard
                  key={servico.id}
                  servico={servico}
                  onZoom={setZoomImage}
                  onAceitar={handleAceitar}
                  hidePrestador
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}