'use client'
import { useState } from 'react'
import { User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import LoginGate from './LoginGate'
import ServicoCard from './ServicoCard'
import ZoomImageModal from './ZoomImageModal'
import { usePainelCliente } from '@/hooks/usePainelCliente'

// ── Definição das pílulas ──────────────────────────────────────────────────────
type Filtro = 'todos' | 'pendente' | 'em_execucao' | 'concluido'

const PILULAS: { valor: Filtro; label: string; cor: string; corAtiva: string }[] = [
  {
    valor: 'todos',
    label: 'Todos',
    cor: 'bg-slate-100 text-slate-500 border-slate-200',
    corAtiva: 'bg-slate-800 text-white border-slate-800',
  },
  {
    valor: 'pendente',
    label: 'Pendentes',
    cor: 'bg-blue-50 text-blue-500 border-blue-100',
    corAtiva: 'bg-blue-600 text-white border-blue-600',
  },
  {
    valor: 'em_execucao',
    label: 'Em andamento',
    cor: 'bg-amber-50 text-amber-500 border-amber-100',
    corAtiva: 'bg-amber-500 text-white border-amber-500',
  },
  {
    valor: 'concluido',
    label: 'Concluídos',
    cor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    corAtiva: 'bg-emerald-600 text-white border-emerald-600',
  },
]

export default function PainelDoCliente() {
  const router = useRouter()
  const [filtroAtivo, setFiltroAtivo] = useState<Filtro>('todos')

  const {
    session, servicos, loading,
    zoomImage, setZoomImage,
    tokenUrl, nomeCliente,
    handleAceitar,
  } = usePainelCliente()

  // ── Grupos por status ────────────────────────────────────────────────────────
  const emRegistro  = servicos.filter(s => s.status === 'em_registro')
  const pendentes   = servicos.filter(s => s.status === 'pendente')
  const emAndamento = servicos.filter(s => s.status === 'em_execucao')
  const concluidos  = servicos.filter(s => s.status === 'concluido')
  const totalPendentes = pendentes.length + emRegistro.length

  // Contadores para cada pílula
  const contadores: Record<Filtro, number> = {
    todos:       servicos.length,
    pendente:    totalPendentes,
    em_execucao: emAndamento.length,
    concluido:   concluidos.length,
  }

  // ── Serviços filtrados para exibição ─────────────────────────────────────────
  const servicosFiltrados = (() => {
    if (filtroAtivo === 'pendente')    return [...pendentes, ...emRegistro]
    if (filtroAtivo === 'em_execucao') return emAndamento
    if (filtroAtivo === 'concluido')   return concluidos
    return servicos // 'todos'
  })()

  // Modo de cada card (define cor e texto do botão)
  const getModo = (status: string) => {
    if (status === 'em_execucao') return 'andamento' as const
    if (status === 'concluido')   return 'concluido' as const
    return 'pendente' as const
  }

  // Handler unificado por status
  const getOnAceitar = (servico: any) => {
    if (servico.status === 'em_execucao')
      return () => router.push(`/acompanhamento/${servico.avaliacao_token}`)
    if (servico.status === 'concluido')
      return () => router.push(`/avaliar/${servico.avaliacao_token}`)
    return () => handleAceitar(servico)
  }

  // ── Loading / Auth ────────────────────────────────────────────────────────────
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

          {/* ── Coluna Esquerda ── */}
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

              {/* Card de resumo com pílulas de filtro */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Meus projetos
                </p>

                {/* Pílulas */}
                <div className="flex flex-wrap gap-2">
                  {PILULAS.map(pilula => {
                    const ativa = filtroAtivo === pilula.valor
                    const count = contadores[pilula.valor]
                    // Oculta pílulas sem projetos (exceto "Todos")
                    if (pilula.valor !== 'todos' && count === 0) return null
                    return (
                      <button
                        key={pilula.valor}
                        onClick={() => setFiltroAtivo(pilula.valor)}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-full border
                          text-[10px] font-black uppercase tracking-wider
                          transition-all duration-200 active:scale-95
                          ${ativa ? pilula.corAtiva : pilula.cor}
                        `}
                      >
                        {pilula.label}
                        <span className={`
                          px-1.5 py-0.5 rounded-full text-[9px] font-black
                          ${ativa ? 'bg-white/20' : 'bg-white/80'}
                        `}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Contador do filtro ativo */}
                <div>
                  <span className="text-4xl font-black text-slate-800">
                    {contadores[filtroAtivo]}
                  </span>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {contadores[filtroAtivo] === 1 ? 'projeto' : 'projetos'}{' '}
                    {filtroAtivo === 'todos'       && 'no total'}
                    {filtroAtivo === 'pendente'    && 'aguardando aprovação'}
                    {filtroAtivo === 'em_execucao' && 'em andamento'}
                    {filtroAtivo === 'concluido'   && 'concluídos'}
                  </p>
                </div>
              </div>

              {/* Info "ao autorizar" — só aparece quando pendentes estão visíveis */}
              {(filtroAtivo === 'todos' || filtroAtivo === 'pendente') && totalPendentes > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ao autorizar o serviço
                  </p>
                  <div className="space-y-3">
                    {[
                      { n: '01', texto: 'Você confirma que o prestador pode iniciar o trabalho' },
                      { n: '02', texto: 'Um token único é gerado para rastrear o projeto' },
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
              )}

            </div>
          </div>

          {/* ── Coluna Direita — cards filtrados ── */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            {servicosFiltrados.length > 0 ? (
              servicosFiltrados.map(servico => (
                <ServicoCard
                  key={servico.id}
                  servico={servico}
                  onZoom={setZoomImage}
                  onAceitar={getOnAceitar(servico)}
                  hidePrestador
                  modo={getModo(servico.status)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <p className="text-[11px] font-black uppercase tracking-widest">
                  Nenhum projeto nesta categoria
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}