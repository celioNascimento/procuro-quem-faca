// app/(admin)/admin/anuncios/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, AlertCircle, Megaphone, Copy, Check,
  Search, ChevronDown, Users, BarChart2, SlidersHorizontal
} from 'lucide-react'
import { useAdminAnuncios } from '@/hooks/useAdminAnuncios'
import { AnuncioLojistaForm, type AnuncioLojistaFormValues, type PreenchimentoLojista } from '@/components/admin/anuncios/AnuncioLojistaForm'
import { AnuncioClienteForm } from '@/components/admin/anuncios/AnuncioClienteForm'
import { AnuncioLojistaLista } from '@/components/admin/anuncios/AnuncioLojistaLista'
import { MapaVagasPracas } from '@/components/admin/anuncios/MapaVagasPracas'
import { MetricasAnuncios } from '@/components/admin/anuncios/MetricasAnuncios'
import { SimuladorInventarioModal } from '@/components/admin/anuncios/SimuladorInventarioModal'
import { SimuladorClienteModal, type PreenchimentoCliente } from '@/components/admin/anuncios/SimuladorClienteModal'

function SenhaTemporariaModal({ senha, email, onClose }: { senha: string; email: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)
  function copiar() {
    navigator.clipboard.writeText(senha)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Conta criada para o lojista</p>
        <p className="mt-2 text-sm text-zinc-600">
          Essa senha aparece uma vez. Envie por WhatsApp para <strong className="text-zinc-900">{email}</strong>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
          <code className="flex-1 text-sm font-mono text-zinc-800">{senha}</code>
          <button onClick={copiar} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700">
            {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          Entendi, ja copiei
        </button>
      </motion.div>
    </div>
  )
}

type FiltroStatus = 'todos' | 'ativos' | 'rascunhos' | 'expirados'
type Aba = 'anuncios' | 'mapa' | 'metricas'

type NovoLojistaComDados = { modo: 'new_lojista'; preenchimento: PreenchimentoLojista }
type NovoClienteComDados = { modo: 'new_cliente'; preenchimento: PreenchimentoCliente }
type ModoEdicao =
  | null
  | 'new_lojista'
  | 'new_cliente'
  | NovoLojistaComDados
  | NovoClienteComDados
  | { id: string; posicao: string; [key: string]: any }

export default function PainelAnunciosLojista() {
  const { anuncios, loading, enviando, erro, cadastrarNovoAnuncio, editarAnuncio, toggleAtivo, remover } = useAdminAnuncios()
  const [editando, setEditando] = useState<ModoEdicao>(null)
  const [senhaModal, setSenhaModal] = useState<{ senha: string; email: string } | null>(null)
  const [simuladorAberto, setSimuladorAberto] = useState(false)
  const [simuladorClienteAberto, setSimuladorClienteAberto] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('ativos')
  const [menuNovoAberto, setMenuNovoAberto] = useState(false)
  const [menuConsultarAberto, setMenuConsultarAberto] = useState(false)
  const [aba, setAba] = useState<Aba>('anuncios')

  async function handleSave(data: AnuncioLojistaFormValues) {
    try {
      if (data.idExistente) {
        const { segmentacoes, ...anuncioSemSegmentacao } = data.anuncio
        await editarAnuncio(
          data.idExistente,
          anuncioSemSegmentacao,
          segmentacoes,
          data.imagemFile,
          data.anuncianteIdExistente ?? undefined
        )
      } else {
        const resultado = await cadastrarNovoAnuncio({ lojista: data.lojista, anuncio: data.anuncio, imagemFile: data.imagemFile })
        if (resultado.senhaTemporaria) setSenhaModal({ senha: resultado.senhaTemporaria, email: data.lojista.email })
      }
      setEditando(null)
    } catch {
      // erro exposto via hook
    }
  }

  const agora = new Date()
  const ativos    = anuncios.filter((a: any) => a.status && !(a.data_expiracao && new Date(a.data_expiracao) < agora)).length
  const rascunhos = anuncios.filter((a: any) => !a.status).length
  const expirados = anuncios.filter((a: any) => a.data_expiracao && new Date(a.data_expiracao) < agora).length

  const anunciosFiltrados = anuncios.filter((a: any) => {
    const isExpirado = a.data_expiracao && new Date(a.data_expiracao) < agora
    if (filtroStatus === 'ativos')    return a.status && !isExpirado
    if (filtroStatus === 'rascunhos') return !a.status
    if (filtroStatus === 'expirados') return isExpirado
    return true
  })

  function ehModoObjeto(v: ModoEdicao): v is NovoLojistaComDados | NovoClienteComDados | { id: string; posicao: string; [key: string]: any } {
    return typeof v === 'object' && v !== null
  }

  const isFormCliente =
    editando === 'new_cliente' ||
    (ehModoObjeto(editando) && 'modo' in editando && editando.modo === 'new_cliente') ||
    (ehModoObjeto(editando) && 'posicao' in editando && editando.posicao === 'dashboard_cliente')

  const initialParaFormCliente =
    ehModoObjeto(editando) && 'modo' in editando && editando.modo === 'new_cliente'
      ? editando.preenchimento
      : ehModoObjeto(editando) && 'posicao' in editando ? editando : null

  const initialParaFormLojista =
    ehModoObjeto(editando) && 'modo' in editando && editando.modo === 'new_lojista'
      ? editando.preenchimento
      : ehModoObjeto(editando) && 'posicao' in editando && editando.posicao !== 'dashboard_cliente'
        ? editando : null

  function usarDadosDoSimuladorCliente(dados: PreenchimentoCliente) {
    setSimuladorClienteAberto(false)
    setEditando({ modo: 'new_cliente', preenchimento: dados })
  }

  function usarDadosDoSimuladorLojista(dados: PreenchimentoLojista) {
    setSimuladorAberto(false)
    setEditando({ modo: 'new_lojista', preenchimento: dados })
  }

  const contadorAnuncios =
    filtroStatus === 'ativos'    ? ativos :
    filtroStatus === 'rascunhos' ? rascunhos :
    filtroStatus === 'expirados' ? expirados :
    anuncios.length

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-6">

      {/* Header: duas linhas no mobile, uma linha no desktop */}
      <header className="pt-6 md:pt-10 pb-5 border-b border-zinc-100">
        <div className="flex items-center justify-between gap-3">
          {/* Titulo + badge */}
          <div className="flex items-center gap-2 min-w-0">
            <Megaphone size={15} className="text-zinc-400 shrink-0" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 leading-none">
              Anuncios
            </h1>
            {!loading && ativos > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shrink-0">
                {ativos} {ativos === 1 ? 'ativo' : 'ativos'}
              </span>
            )}
          </div>

          {/* Acoes — sempre visivel, compacto no mobile */}
          {!editando && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Consultar */}
              <div className="relative">
                <button
                  onClick={() => setMenuConsultarAberto(!menuConsultarAberto)}
                  className="flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  <Search size={14} />
                  <span className="hidden sm:inline ml-0.5">Consultar</span>
                  <ChevronDown size={12} className={`transition-transform ${menuConsultarAberto ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menuConsultarAberto && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuConsultarAberto(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl"
                      >
                        <button
                          onClick={() => { setSimuladorAberto(true); setMenuConsultarAberto(false) }}
                          className="flex w-full items-center gap-2.5 rounded-xl p-3 text-left hover:bg-zinc-50"
                        >
                          <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg shrink-0"><Search size={14} /></div>
                          <div>
                            <span className="block text-[13px] font-bold text-zinc-900">Vagas de Lojista</span>
                            <span className="block text-[11px] text-zinc-500">Busca, perfil e painel do prestador</span>
                          </div>
                        </button>
                        <button
                          onClick={() => { setSimuladorClienteAberto(true); setMenuConsultarAberto(false) }}
                          className="flex w-full items-center gap-2.5 rounded-xl p-3 text-left hover:bg-zinc-50"
                        >
                          <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg shrink-0"><Users size={14} /></div>
                          <div>
                            <span className="block text-[13px] font-bold text-zinc-900">Painel do Cliente</span>
                            <span className="block text-[11px] text-zinc-500">Segmentado so por cidade</span>
                          </div>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Novo anuncio */}
              <div className="relative">
                <button
                  onClick={() => setMenuNovoAberto(!menuNovoAberto)}
                  className="flex items-center gap-1 rounded-xl bg-zinc-900 px-3 py-2 text-[12px] font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline ml-0.5">Novo</span>
                  <ChevronDown size={12} className={`transition-transform ${menuNovoAberto ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menuNovoAberto && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuNovoAberto(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl"
                      >
                        <button
                          onClick={() => { setEditando('new_lojista'); setMenuNovoAberto(false) }}
                          className="flex w-full flex-col items-start gap-1 rounded-xl p-3 text-left hover:bg-zinc-50"
                        >
                          <span className="text-[13px] font-bold text-zinc-900">Buscas e Profissionais</span>
                          <span className="text-[11px] text-zinc-500">Segmentado por categoria de servico</span>
                        </button>
                        <button
                          onClick={() => { setEditando('new_cliente'); setMenuNovoAberto(false) }}
                          className="flex w-full flex-col items-start gap-1 rounded-xl p-3 text-left hover:bg-zinc-50"
                        >
                          <span className="text-[13px] font-bold text-zinc-900">Painel do Cliente</span>
                          <span className="text-[11px] text-zinc-500">Segmentado por cidade/regiao</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Abas */}
      {!editando && (
        <div className="border-b border-zinc-100">
          <nav className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setAba('anuncios')}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                aba === 'anuncios' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <SlidersHorizontal size={13} />
              Anuncios
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                aba === 'anuncios' ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-50 text-zinc-400'
              }`}>
                {contadorAnuncios}
              </span>
              {aba === 'anuncios' && (
                <motion.div layoutId="tab-ind" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
            </button>

            <button
              onClick={() => setAba('mapa')}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                aba === 'mapa' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Mapa de vagas
              {aba === 'mapa' && (
                <motion.div layoutId="tab-ind" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
            </button>

            <button
              onClick={() => setAba('metricas')}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                aba === 'metricas' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <BarChart2 size={13} />
              Metricas
              {aba === 'metricas' && (
                <motion.div layoutId="tab-ind" className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
            </button>
          </nav>
        </div>
      )}

      {/* Filtros de status — so na aba Anuncios */}
      {!editando && aba === 'anuncios' && (
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto pb-1">
          {([
            { id: 'ativos',    label: 'Ativos',    count: ativos },
            { id: 'todos',     label: 'Todos',     count: anuncios.length },
            { id: 'rascunhos', label: 'Rascunhos', count: rascunhos },
            { id: 'expirados', label: 'Expirados', count: expirados },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroStatus(f.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-colors shrink-0 ${
                filtroStatus === f.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                filtroStatus === f.id ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Erro do hook */}
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-600"
          >
            <AlertCircle size={14} /> {erro}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formularios */}
      {editando && (
        <div className="mt-6">
          {isFormCliente ? (
            <AnuncioClienteForm
              initial={initialParaFormCliente}
              onSave={handleSave}
              onCancel={() => setEditando(null)}
              enviando={enviando}
            />
          ) : (
            <AnuncioLojistaForm
              initial={initialParaFormLojista}
              onSave={handleSave}
              onCancel={() => setEditando(null)}
              enviando={enviando}
            />
          )}
        </div>
      )}

      {/* Conteudo das abas */}
      {!editando && aba === 'anuncios' && (
        <div className="mt-4">
          <AnuncioLojistaLista
            anuncios={anunciosFiltrados}
            loading={loading}
            onEdit={setEditando}
            onDelete={remover}
            onToggleAtivo={toggleAtivo}
          />
        </div>
      )}

      {!editando && aba === 'mapa' && (
        <div className="mt-6">
          <MapaVagasPracas />
        </div>
      )}

      {!editando && aba === 'metricas' && (
        <MetricasAnuncios />
      )}

      {/* Modais */}
      {simuladorAberto && (
        <SimuladorInventarioModal
          onClose={() => setSimuladorAberto(false)}
          onUsarNoCadastro={usarDadosDoSimuladorLojista}
        />
      )}
      {simuladorClienteAberto && (
        <SimuladorClienteModal
          onClose={() => setSimuladorClienteAberto(false)}
          onUsarNoCadastro={usarDadosDoSimuladorCliente}
        />
      )}
      {senhaModal && (
        <SenhaTemporariaModal
          senha={senhaModal.senha}
          email={senhaModal.email}
          onClose={() => setSenhaModal(null)}
        />
      )}
    </div>
  )
}
