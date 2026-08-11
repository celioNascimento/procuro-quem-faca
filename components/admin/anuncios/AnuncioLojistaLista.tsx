// components/admin/anuncios/AnuncioLojistaLista.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Pencil, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-1 py-1 transition-all hover:border-zinc-300"
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${checked ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
        {checked ? <Eye size={12} /> : <EyeOff size={12} />}
      </span>
      <span className={`pr-2 text-[10px] font-semibold uppercase tracking-widest ${checked ? 'text-emerald-600' : 'text-zinc-400'}`}>
        {checked ? 'Ativo' : 'Rascunho'}
      </span>
    </button>
  )
}

function AnuncioRow({ anuncio, onEdit, onDelete, onToggleAtivo }: any) {
  const isExpirado = anuncio.data_expiracao && new Date(anuncio.data_expiracao) < new Date()

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-3 hover:border-zinc-200 transition-colors">
      <div className="h-14 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-50">
        {anuncio.imagem_url && <img src={anuncio.imagem_url} alt={anuncio.titulo} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-zinc-800">{anuncio.anunciantes?.razao_social ?? anuncio.titulo}</p>
        <p className="truncate text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5">
          {anuncio.posicao} · {anuncio.cliques ?? 0} cliques · {anuncio.impressoes ?? 0} impressões
          {anuncio.data_expiracao && (
            <span className={isExpirado ? 'text-red-500 ml-1 font-semibold' : 'text-emerald-500 ml-1 font-semibold'}>
              · {isExpirado ? 'Expirado' : `Válido até ${new Date(anuncio.data_expiracao).toLocaleDateString('pt-BR')}`}
            </span>
          )}
        </p>
      </div>
      <Toggle checked={anuncio.status} onChange={(v: boolean) => onToggleAtivo(anuncio.id, v)} />
      <button onClick={() => onEdit(anuncio)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-700">
        <Pencil size={15} />
      </button>
      <button onClick={() => onDelete(anuncio.id)} className="rounded-lg p-2 text-zinc-300 hover:bg-red-50 hover:text-red-500">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

type Props = {
  anuncios: any[]
  loading: boolean
  onEdit: (anuncio: any) => void
  onDelete: (id: string) => void
  onToggleAtivo: (id: string, ativo: boolean) => void
}

export function AnuncioLojistaLista({ anuncios, loading, onEdit, onDelete, onToggleAtivo }: Props) {
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)

  if (loading) {
    return <p className="mt-6 text-[11px] text-zinc-300 uppercase tracking-widest">Carregando...</p>
  }

  if (anuncios.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
        <p className="text-[13px] font-semibold text-zinc-500">Nenhum anúncio cadastrado ainda</p>
        <p className="mt-1 text-[11px] text-zinc-300">Cadastre o primeiro lojista pra testar como o banner aparece no site</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        {anuncios.map((a) => (
          <AnuncioRow
            key={a.id}
            anuncio={a}
            onEdit={onEdit}
            onDelete={(id: string) => setConfirmarExclusao(id)}
            onToggleAtivo={onToggleAtivo}
          />
        ))}
      </div>

      <AnimatePresence>
        {confirmarExclusao && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <p className="text-[13px] font-semibold text-zinc-800">Excluir este anúncio?</p>
              <p className="mt-1 text-[11px] text-zinc-400">Essa ação não pode ser desfeita. Se quiser só pausar, use o botão de visibilidade em vez de excluir.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setConfirmarExclusao(null)} className="rounded-xl px-3.5 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-zinc-100">Cancelar</button>
                <button
                  onClick={() => { onDelete(confirmarExclusao); setConfirmarExclusao(null) }}
                  className="rounded-xl bg-red-500 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}