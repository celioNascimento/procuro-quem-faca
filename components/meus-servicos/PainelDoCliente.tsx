// components/meus-servicos/PainelDoCliente.tsx

'use client'
import { useState } from 'react'
import { User, Clock, Loader2, CheckCircle2, ClipboardList, LayoutGrid, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import LoginGate from './LoginGate'
import ServicoCard from './ServicoCard'
import ZoomImageModal from './ZoomImageModal'
import { usePainelCliente } from '@/hooks/usePainelCliente'

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Filtro = 'todos' | 'pendente' | 'em_execucao' | 'concluido' | 'garantia'

// ── Config das linhas de filtro ────────────────────────────────────────────────
const FILTROS: {
  valor: Filtro
  label: string
}[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'pendente', label: 'Pendentes' },
  { valor: 'em_execucao', label: 'Em andamento' },
  { valor: 'concluido', label: 'Concluídos' },
  { valor: 'garantia', label: 'Garantia' },
]

export default function PainelDoCliente() {
  const router = useRouter()
  const [filtroAtivo, setFiltroAtivo] = useState<Filtro>('todos')

  const {
    session, servicos, servicosGarantia, loading,
    zoomImage, setZoomImage,
    tokenUrl, nomeCliente,
    handleAceitar, handleVerGarantia,
  } = usePainelCliente()

  // ── Grupos por status ────────────────────────────────────────────────────────
  const emRegistro  = servicos.filter(s => s.status === 'em_registro')
  const pendentes   = servicos.filter(s => s.status === 'pendente')
  const emAndamento = servicos.filter(s => s.status === 'em_execucao')
  const concluidos  = servicos.filter(s => s.status === 'finalizado')
  const totalPendentes = pendentes.length + emRegistro.length

  // "Todos" continua contando só o fluxo padrão de projetos — garantia é uma
  // dimensão à parte (um projeto pode estar em "Concluídos" e também
  // aparecer em "Garantia" ao mesmo tempo, não é mutuamente exclusivo).
  const contadores: Record<Filtro, number> = {
    todos:       servicos.length,
    pendente:    totalPendentes,
    em_execucao: emAndamento.length,
    concluido:   concluidos.length,
    garantia:    servicosGarantia.length,
  }

  // ── Serviços filtrados ────────────────────────────────────────────────────────
  const servicosFiltrados = (() => {
    if (filtroAtivo === 'pendente')    return [...pendentes, ...emRegistro]
    if (filtroAtivo === 'em_execucao') return emAndamento
    if (filtroAtivo === 'concluido')   return concluidos
    if (filtroAtivo === 'garantia')    return servicosGarantia
    return servicos
  })()

  const getModo = (servico: any) => {
    if (filtroAtivo === 'garantia') return 'garantia' as const
    if (servico.status === 'em_execucao') return 'andamento' as const
    if (servico.status === 'finalizado')  return 'concluido' as const
    return 'pendente' as const
  }

  const getOnAceitar = (servico: any) => {
    if (filtroAtivo === 'garantia')
      return () => handleVerGarantia(servico)
    if (servico.status === 'em_execucao')
      return () => router.push(`/acompanhamento/${servico.avaliacao_token}`)
    if (servico.status === 'finalizado')
      return () => router.push(`/acompanhamento/${servico.avaliacao_token}`)
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
  // "Múltiplos projetos" agora também considera garantia — se o único projeto
  // do cliente tem um caso de garantia ativo, ainda vale mostrar os filtros
  // para que ele encontre a aba Garantia.
  const hasMultipleProjects = servicos.length > 1 || servicosGarantia.length > 0

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans antialiased">
      <HeaderCliente nomeCliente={nomeCliente} />

      {zoomImage && (
        <ZoomImageModal url={zoomImage} onClose={() => setZoomImage(null)} />
      )}

      <div className="max-w-5xl mx-auto px-5 pt-24 md:pt-36 animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ── Coluna Esquerda ── */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="lg:sticky lg:top-36 flex flex-col gap-6">

              {/* Card do prestador - Padrão Horizontal */}
              {prestador && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-4 transition-all hover:shadow-md">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center">
                    {prestador.foto_perfil ? (
                      <img
                        src={prestador.foto_perfil}
                        className="w-full h-full object-cover"
                        alt={prestador.nome}
                      />
                    ) : (
                      <User size={24} className="text-slate-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {prestador.categoria?.nome && (
                      <p className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em] truncate">
                        {prestador.categoria.nome}
                      </p>
                    )}
                    <h2 className="text-[13px] sm:text-sm font-black text-slate-900 uppercase tracking-tight truncate mt-0.5">
                      {prestador.nome}
                    </h2>
                  </div>
                </div>
              )}

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

              {/* Info da aba Garantia */}
              {filtroAtivo === 'garantia' && servicosGarantia.length > 0 && (
                <div className="bg-orange-50 rounded-[2rem] border border-orange-100 shadow-sm p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-orange-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                      Garantia em aberto
                    </p>
                  </div>
                  <p className="text-[12px] text-orange-700/80 font-medium leading-relaxed">
                    Você tem casos de garantia em andamento. Acompanhe as respostas
                    do prestador e confirme quando o problema for resolvido.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* ── Coluna Direita — Filtros e Cards ── */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">

            {/* Menu de Filtros Horizontal (SÓ aparece se houver > 1 projeto ou garantia ativa) */}
            {hasMultipleProjects && (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {FILTROS.map((filtro) => {
                  const ativo = filtroAtivo === filtro.valor
                  const count = contadores[filtro.valor]
                  
                  if (filtro.valor !== 'todos' && count === 0) return null

                  return (
                    <button
                      key={filtro.valor}
                      onClick={() => setFiltroAtivo(filtro.valor)}
                      type="button"
                      className={`
                        min-h-10 flex items-center gap-2 shrink-0 whitespace-nowrap rounded-xl border px-4 py-2 transition-all
                        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100
                        ${ativo
                          ? filtro.valor === 'garantia'
                            ? 'border-orange-600 bg-orange-600 text-white shadow-sm'
                            : 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : filtro.valor === 'garantia'
                            ? 'border-orange-200 bg-white text-orange-500 hover:border-orange-300'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                        }
                      `}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-wide">
                        {filtro.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Lista de Projetos */}
            <div className="flex flex-col gap-4 mt-2">
              {servicosFiltrados.length > 0 ? (
                servicosFiltrados.map(servico => (
                  <ServicoCard
                    key={servico.id}
                    servico={servico}
                    onZoom={setZoomImage}
                    onAceitar={getOnAceitar(servico)}
                    hidePrestador
                    modo={getModo(servico)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300 bg-white rounded-[2rem] border border-dashed border-slate-200">
                  <Clock size={32} className="mb-3 opacity-40" />
                  <p className="text-[11px] font-black uppercase tracking-widest">
                    Nenhum projeto nesta categoria
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}
