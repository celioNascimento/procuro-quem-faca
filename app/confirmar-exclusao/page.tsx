'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import { useConfirmarExclusaoConta } from '@/hooks/useConfirmarExclusaoConta'

export default function ConfirmarExclusao() {
  const {
    loading, confirmText, setConfirmText, confirmado,
    motivo, setMotivo, deleting, erro, executarExclusao,
  } = useConfirmarExclusaoConta()

  if (loading) return null

  return (
    <main className="min-h-screen bg-white font-sans">
      <Header href="/cadastro" />

      <div className="max-w-xl mx-auto pt-32 md:pt-40 px-6 text-center pb-20">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">
          Confirmar Exclusão
        </h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
          Ação permanente e irreversível
        </p>

        <div className="text-left space-y-3 mb-8">
          <label className="text-slate-400 font-black text-[9px] uppercase tracking-widest ml-4">
            Por que você está saindo? (Log de Qualidade)
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Não encontrei clientes, o app é difícil de usar..."
            className="w-full p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none focus:border-red-200 text-sm text-slate-700 resize-none h-28 transition-all font-medium"
          />
        </div>

        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] mb-10 text-left space-y-3">
          <label className="text-slate-400 font-black text-[9px] uppercase tracking-widest">
            Digite <span className="text-red-500">EXCLUIR</span> para confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none focus:border-red-300 text-sm font-bold text-slate-700 tracking-widest uppercase"
          />
        </div>

        {erro && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-500 text-[10px] font-black text-center uppercase tracking-wider">
            {erro}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={executarExclusao}
            disabled={!confirmado || deleting}
            className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all ${
              confirmado && !deleting
                ? 'bg-red-600 text-white shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {deleting ? 'APAGANDO...' : 'CONFIRMAR EXCLUSÃO'}
          </button>

          <Link
            href="/cadastro"
            className="text-slate-400 font-black text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors py-4 italic"
          >
            Voltar para o Perfil
          </Link>
        </div>
      </div>
    </main>
  )
}