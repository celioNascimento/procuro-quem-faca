// app/(admin)/admin/anuncios/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertCircle, Megaphone, Copy, Check, Search, ChevronDown } from 'lucide-react'
import { useAdminAnuncios } from '@/hooks/useAdminAnuncios'
import { AnuncioLojistaForm, type AnuncioLojistaFormValues } from '@/components/admin/anuncios/AnuncioLojistaForm'
import { AnuncioClienteForm } from '@/components/admin/anuncios/AnuncioClienteForm'
import { AnuncioLojistaLista } from '@/components/admin/anuncios/AnuncioLojistaLista'
import { SimuladorInventarioModal } from '@/components/admin/anuncios/SimuladorInventarioModal'

const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest'

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
          Essa senha só aparece uma vez. Copie e envie por WhatsApp para <strong className="text-zinc-900">{email}</strong>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
          <code className="flex-1 text-sm font-mono text-zinc-800">{senha}</code>
          <button onClick={copiar} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700">
            {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          Entendi, já copiei
        </button>
      </motion.div>
    </div>
  )
}

type FiltroStatus = 'todos' | 'ativos' | 'rascunhos' | 'expirados'
type ModoEdicao = null | 'new_lojista' | 'new_cliente' | { id: string; posicao: string; [key: string]: any }

export default function PainelAnunciosLojista() {
  const { anuncios, loading, enviando, erro, cadastrarNovoAnuncio, editarAnuncio, toggleAtivo, remover } = useAdminAnuncios()
  const [editando, setEditando] = useState<ModoEdicao>(null)
  const [senhaModal, setSenhaModal] = useState<{ senha: string; email: string } | null>(null)
  const [simuladorAberto, setSimuladorAberto] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [menuNovoAberto, setMenuNovoAberto] = useState(false)

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
      // erro já exposto via hook — form permanece aberto pra corrigir
    }
  }

  const agora = new Date()
  const ativos = anuncios.filter((a: any) => a.status).length
  const rascunhos = anuncios.filter((a: any) => !a.status).length
  const expirados = anuncios.filter((a: any) => a.data_expiracao && new Date(a.data_expiracao) < agora).length

  // Aplicação do filtro selecionado
  const anunciosFiltrados = anuncios.filter((a: any) => {
    const estaExpirado = a.data_expiracao && new Date(a.data_expiracao) < agora
    if (filtroStatus === 'ativos') return a.status && !estaExpirado
    if (filtroStatus === 'rascunhos') return !a.status
    if (filtroStatus === 'expirados') return estaExpirado
    return true
  })

  // Define qual formulário deve ser renderizado
  const isFormCliente = editando === 'new_cliente' || (typeof editando === 'object' && editando?.posicao === 'dashboard_cliente')

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-6 md:pt-10 pb-6 md:pb-8 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Megaphone size={12} className="text-zinc-400" />
            <p className={labelClass}>Lojistas & fornecedores</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-none">Anúncios</h1>
        </div>
        {!editando && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimuladorAberto(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Search size={15} /> Consultar Vagas
            </button>
            
            {/* Dropdown Menu para Novo Anúncio */}
            <div className="relative">
              <button
                onClick={() => setMenuNovoAberto(!menuNovoAberto)}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                <Plus size={15} /> Novo anúncio <ChevronDown size={14} className={`transition-transform ${menuNovoAberto ? 'rotate-180' : ''}`} />
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
                        <span className="text-[13px] font-bold text-zinc-900">Anúncio em Buscas e Profissionais</span>
                        <span className="text-[11px] text-zinc-500">Exige segmentação por categoria de serviço</span>
                      </button>
                      <button
                        onClick={() => { setEditando('new_cliente'); setMenuNovoAberto(false) }}
                        className="flex w-full flex-col items-start gap-1 rounded-xl p-3 text-left hover:bg-zinc-50"
                      >
                        <span className="text-[13px] font-bold text-zinc-900">Anúncio no Painel do Cliente</span>
                        <span className="text-[11px] text-zinc-500">Segmentado apenas por cidade/região</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-6">
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Cadastrados</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">{anuncios.length}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-emerald-500 bg-emerald-600 shadow-sm shadow-emerald-100">
          <p className="text-[9px] font-medium uppercase tracking-widest mb-2 text-emerald-100">Ativos</p>
          <span className="text-2xl md:text-3xl font-bold text-white leading-none">{ativos}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Rascunho</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">{rascunhos}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Cliques totais</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">
            {anuncios.reduce((sum: number, a: any) => sum + (a.cliques ?? 0), 0)}
          </span>
        </div>
      </section>

      {/* Botões de Filtro */}
      {!editando && (
        <div className="flex items-center gap-2 pt-6 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroStatus('todos')}
            className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors shrink-0 ${
              filtroStatus === 'todos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todos ({anuncios.length})
          </button>
          <button
            onClick={() => setFiltroStatus('ativos')}
            className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors shrink-0 ${
              filtroStatus === 'ativos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Ativos ({ativos})
          </button>
          <button
            onClick={() => setFiltroStatus('rascunhos')}
            className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors shrink-0 ${
              filtroStatus === 'rascunhos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Rascunhos ({rascunhos})
          </button>
          <button
            onClick={() => setFiltroStatus('expirados')}
            className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors shrink-0 ${
              filtroStatus === 'expirados' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Expirados ({expirados})
          </button>
        </div>
      )}

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

      {editando && (
        <div className="mt-6">
          {isFormCliente ? (
            <AnuncioClienteForm
              initial={typeof editando === 'object' ? editando : null}
              onSave={handleSave}
              onCancel={() => setEditando(null)}
              enviando={enviando}
            />
          ) : (
            <AnuncioLojistaForm
              initial={typeof editando === 'object' ? editando : null}
              onSave={handleSave}
              onCancel={() => setEditando(null)}
              enviando={enviando}
            />
          )}
        </div>
      )}

      {!editando && (
        <div className="mt-6">
          <AnuncioLojistaLista
            anuncios={anunciosFiltrados}
            loading={loading}
            onEdit={setEditando}
            onDelete={remover}
            onToggleAtivo={toggleAtivo}
          />
        </div>
      )}

      {simuladorAberto && <SimuladorInventarioModal onClose={() => setSimuladorAberto(false)} />}
      {senhaModal && <SenhaTemporariaModal senha={senhaModal.senha} email={senhaModal.email} onClose={() => setSenhaModal(null)} />}
    </div>
  )
}
