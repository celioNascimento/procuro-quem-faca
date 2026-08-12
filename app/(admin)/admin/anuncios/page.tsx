// app/(admin)/admin/anuncios/page.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertCircle, Megaphone, Copy, Check, Search } from 'lucide-react'
import { useAdminAnuncios } from '@/hooks/useAdminAnuncios'
import { AnuncioLojistaForm, type AnuncioLojistaFormValues } from '@/components/admin/anuncios/AnuncioLojistaForm'
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

export default function PainelAnunciosLojista() {
  const { anuncios, loading, enviando, erro, cadastrarNovoAnuncio, editarAnuncio, toggleAtivo, remover } = useAdminAnuncios()
  const [editando, setEditando] = useState<any>(null) // null | 'new' | anuncio
  const [senhaModal, setSenhaModal] = useState<{ senha: string; email: string } | null>(null)
  const [simuladorAberto, setSimuladorAberto] = useState(false)

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

  const ativos = anuncios.filter((a: any) => a.status).length

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
            <button
              onClick={() => setEditando('new')}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-zinc-800 transition-colors"
            >
              <Plus size={15} /> Novo anúncio
            </button>
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
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">{anuncios.length - ativos}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Cliques totais</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">
            {anuncios.reduce((sum: number, a: any) => sum + (a.cliques ?? 0), 0)}
          </span>
        </div>
      </section>

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
          <AnuncioLojistaForm
            initial={editando === 'new' ? null : editando}
            onSave={handleSave}
            onCancel={() => setEditando(null)}
            enviando={enviando}
          />
        </div>
      )}

      <AnuncioLojistaLista
        anuncios={anuncios}
        loading={loading}
        onEdit={setEditando}
        onDelete={remover}
        onToggleAtivo={toggleAtivo}
      />

      {simuladorAberto && <SimuladorInventarioModal onClose={() => setSimuladorAberto(false)} />}
      {senhaModal && <SenhaTemporariaModal senha={senhaModal.senha} email={senhaModal.email} onClose={() => setSenhaModal(null)} />}
    </div>
  )
}
