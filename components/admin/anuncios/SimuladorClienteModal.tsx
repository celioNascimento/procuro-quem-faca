// components/admin/anuncios/SimuladorClienteModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Search, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { useSegmentacaoReferencia } from '@/hooks/useSegmentacaoReferencia'
import { verificarInventarioCliente } from '@/lib/services/adminAnuncios.service'

const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-300'
const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest block mb-1.5'

export type PreenchimentoCliente = {
  estadoSigla: string
  regiaoId: string
  cidadeId: string
}

type Props = {
  onClose: () => void
  onUsarNoCadastro: (dados: PreenchimentoCliente) => void
}

export function SimuladorClienteModal({ onClose, onUsarNoCadastro }: Props) {
  const { estados, buscarRegioes, buscarCidades } = useSegmentacaoReferencia()

  const [estadoSigla, setEstadoSigla] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [cidadeId, setCidadeId] = useState('')

  const [regioes, setRegioes] = useState<{ id: string; nome: string }[]>([])
  const [cidades, setCidades] = useState<{ id: string; nome: string }[]>([])

  const [resultado, setResultado] = useState<{
    vagasTotais: number
    vagasDisponiveis: number
    ocupados: number
    proximaExpiracao: string | null
    loading: boolean
  } | null>(null)

  useEffect(() => {
    if (!estadoSigla) return setRegioes([])
    buscarRegioes(estadoSigla).then(setRegioes)
  }, [estadoSigla, buscarRegioes])

  useEffect(() => {
    if (!regiaoId) return setCidades([])
    buscarCidades(regiaoId).then(setCidades)
  }, [regiaoId, buscarCidades])

  useEffect(() => {
    if (!cidadeId) {
      setResultado(null)
      return
    }

    let isMounted = true
    setResultado(prev => prev ? { ...prev, loading: true } : { vagasTotais: 0, vagasDisponiveis: 0, ocupados: 0, proximaExpiracao: null, loading: true })

    verificarInventarioCliente(cidadeId)
      .then(res => {
        if (isMounted) setResultado({ ...res, loading: false })
      })
      .catch(() => {
        if (isMounted) setResultado(null)
      })

    return () => { isMounted = false }
  }, [cidadeId])

  const podeUsarNoCadastro = resultado && !resultado.loading && resultado.vagasDisponiveis > 0

  function usarNoCadastro() {
    if (!podeUsarNoCadastro) return
    onUsarNoCadastro({ estadoSigla, regiaoId, cidadeId })
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-zinc-900">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none">Consultar Disponibilidade</h2>
              <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-widest font-medium">Painel do Cliente (B2C)</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] text-zinc-400 leading-relaxed -mt-2">
            O Painel do Cliente segmenta apenas por cidade — não exige categoria de serviço.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Estado</label>
              <select className={inputClass} value={estadoSigla} onChange={e => { setEstadoSigla(e.target.value); setRegiaoId(''); setCidadeId('') }}>
                <option value="">Selecione</option>
                {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Região</label>
              <select className={inputClass} value={regiaoId} onChange={e => { setRegiaoId(e.target.value); setCidadeId('') }} disabled={!estadoSigla}>
                <option value="">Selecione</option>
                {regioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Cidade</label>
            <select className={inputClass} value={cidadeId} onChange={e => setCidadeId(e.target.value)} disabled={!regiaoId}>
              <option value="">Selecione</option>
              {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="mt-6 border-t border-zinc-100 pt-6">
          {!resultado ? (
            <div className="text-center py-6 text-zinc-300">
              <Search size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-[11px] font-medium uppercase tracking-widest">Selecione uma cidade para calcular</p>
            </div>
          ) : resultado.loading ? (
            <div className="text-center py-6 text-blue-400 animate-pulse">
              <p className="text-[11px] font-medium uppercase tracking-widest">Calculando base de dados...</p>
            </div>
          ) : resultado.vagasDisponiveis > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0"><CheckCircle2 size={20} /></div>
                <div>
                  <p className="text-[13px] font-bold text-emerald-700">Vaga disponível!</p>
                  <p className="text-[11px] font-medium text-emerald-600/80 mt-0.5">Essa cidade está livre para um anúncio do Painel do Cliente.</p>
                </div>
              </div>
              <button
                onClick={usarNoCadastro}
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-[12px] font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Usar esses dados no cadastro <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shrink-0"><Clock size={20} /></div>
                <div>
                  <p className="text-[13px] font-bold text-amber-700">Vaga ocupada</p>
                  <p className="text-[11px] font-medium text-amber-600/80 mt-0.5">Já existe um anúncio ativo do Painel do Cliente nessa cidade.</p>
                </div>
              </div>
              {resultado.proximaExpiracao && (
                <div className="mt-2 border-t border-amber-200/50 pt-2 text-[11px] text-amber-700 font-medium">
                  💡 A vaga será liberada automaticamente em:
                  <strong className="block text-sm mt-0.5">{new Date(resultado.proximaExpiracao).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
