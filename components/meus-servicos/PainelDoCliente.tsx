'use client'
import { useState } from 'react'
import { User, Clock, Loader2, CheckCircle2, ClipboardList, LayoutGrid } from 'lucide-react'
import { useRouter } from 'next/navigation'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import LoginGate from './LoginGate'
import ServicoCard from './ServicoCard'
import ZoomImageModal from './ZoomImageModal'
import { usePainelCliente } from '@/hooks/usePainelCliente'

// ── Tipos ──────────────────────────────────────────────────────────────────────
type Filtro = 'todos' | 'pendente' | 'em_execucao' | 'concluido'

// ── Config das linhas de filtro ────────────────────────────────────────────────
const FILTROS: {
  valor: Filtro
  label: string
  sublabel: string
  icon: React.ElementType
  cor: string        // texto + ícone quando inativo
  corAtiva: string   // fundo quando ativo
  corIcone: string   // cor do ícone quando ativo
}[] = [
  {
    valor: 'todos',
    label: 'Todos',
    sublabel: 'projetos',
    icon: LayoutGrid,
    cor: 'text-slate-400',
    corAtiva: 'bg-slate-800',
    corIcone: 'text-white',
  },
  {
    valor: 'pendente',
    label: 'Pendentes',
    sublabel: 'aguardando aprovação',
    icon: ClipboardList,
    cor: 'text-blue-400',
    corAtiva: 'bg-blue-600',
    corIcone: 'text-white',
  },
  {
    valor: 'em_execucao',
    label: 'Em andamento',
    sublabel: 'em execução',
    icon: Loader2,
    cor: 'text-amber-400',
    corAtiva: 'bg-amber-500',
    corIcone: 'text-white',
  },
  {
    valor: 'concluido',
    label: 'Concluídos',
    sublabel: 'finalizados',
    icon: CheckCircle2,
    cor: 'text-emerald-500',
    corAtiva: 'bg-emerald-600',
    corIcone: 'text-white',
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

  const contadores: Record<Filtro, number> = {
    todos:       servicos.length,
    pendente:    totalPendentes,
    em_execucao: emAndamento.length,
    concluido:   concluidos.length,
  }

  // ── Serviços filtrados ────────────────────────────────────────────────────────
  const servicosFiltrados = (() => {
    if (filtroAtivo === 'pendente')    return [...pendentes, ...emRegistro]
    if (filtroAtivo === 'em_execucao') return emAndamento
    if (filtroAtivo === 'concluido')   return concluidos
    return servicos
  })()

  const getModo = (status: string) => {
    if (status === 'em_execucao') return 'andamento' as const
    if (status === 'concluido')   return 'concluido' as const
    return 'pendente' as const
  }

  const getOnAceitar = (servico: any) => {
    if (servico.status === 'em_execucao')
      return () => router.push(`/acompanhamento/${servico.avaliacao_token}`)
    if (servico.status === 'concluido')
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

              {/* Card de filtros — lista vertical */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Meus projetos
                  </p>
                </div>

                <div className="flex flex-col pb-3">
                  {FILTROS.map((filtro, i) => {
                    const ativo = filtroAtivo === filtro.valor
                    const count = contadores[filtro.valor]
                    const Icon  = filtro.icon

                    // Oculta linhas sem projetos (exceto "Todos")
                    if (filtro.valor !== 'todos' && count === 0) return null

                    return (
                      <button
                        key={filtro.valor}
                        onClick={() => setFiltroAtivo(filtro.valor)}
                        className={`
                          relative flex items-center gap-3 px-6 py-3.5
                          transition-all duration-200 text-left
                          ${ativo ? 'bg-slate-50' : 'hover:bg-slate-50/60'}
                        `}
                      >
                        {/* Indicador lateral ativo */}
                        {ativo && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-blue-600" />
                        )}

                        {/* Ícone */}
                        <div className={`
                          w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                          transition-all duration-200
                          ${ativo ? `${filtro.corAtiva}` : 'bg-slate-100'}
                        `}>
                          <Icon
                            size={14}
                            className={ativo ? filtro.corIcone : filtro.cor}
                          />
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[11px] font-black uppercase tracking-wider leading-none ${ativo ? 'text-slate-800' : 'text-slate-500'}`}>
                            {filtro.label}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 capitalize">
                            {count === 1 ? '1 projeto' : `${count} projetos`}
                          </p>
                        </div>

                        {/* Contador badge */}
                        <span className={`
                          text-[10px] font-black px-2 py-0.5 rounded-full
                          ${ativo ? `${filtro.corAtiva} text-white` : 'bg-slate-100 text-slate-400'}
                        `}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
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

            {/* Título da seção ativa */}
            <div className="flex items-center gap-3">
              {(() => {
                const f = FILTROS.find(f => f.valor === filtroAtivo)!
                const Icon = f.icon
                return (
                  <>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${f.corAtiva}`}>
                      <Icon size={13} className="text-white" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {f.label} · {contadores[filtroAtivo]} {contadores[filtroAtivo] === 1 ? 'projeto' : 'projetos'}
                    </p>
                  </>
                )
              })()}
            </div>

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
                <Clock size={32} className="mb-3 opacity-40" />
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