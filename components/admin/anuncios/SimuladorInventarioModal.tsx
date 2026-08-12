// components/admin/anuncios/SimuladorInventarioModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Search, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { useSegmentacaoReferencia } from '@/hooks/useSegmentacaoReferencia'
import { verificarInventarioSegmento } from '@/lib/services/adminAnuncios.service'

const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-300'
const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest block mb-1.5'

type Props = {
  onClose: () => void
}

export function SimuladorInventarioModal({ onClose }: Props) {
  const { estados, grupos, buscarRegioes, buscarCidades, buscarCategorias } = useSegmentacaoReferencia()
  
  const [posicao, setPosicao] = useState('entre_cards')
  const [estadoSigla, setEstadoSigla] = useState('')
  const [regiaoId, setRegiaoId] = useState('')
  const [cidadeId, setCidadeId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')

  const [regioes, setRegioes] = useState<{id: string, nome: string}[]>([])
  const [cidades, setCidades] = useState<{id: string, nome: string}[]>([])
  const [categorias, setCategorias] = useState<{id: string, nome: string}[]>([])

  const [resultado, setResultado] = useState<{
    vagasTotais: number
    vagasDisponiveis: number
    totalPrestadores: number
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
    if (!grupoId) return setCategorias([])
    buscarCategorias(grupoId).then(setCategorias)
  }, [grupoId, buscarCategorias])

  useEffect(() => {
    if (!cidadeId || !categoriaId || !posicao) {
      setResultado(null)
      return
    }
    
    let isMounted = true
    setResultado(prev => prev ? { ...prev, loading: true } : { vagasTotais: 0, vagasDisponiveis: 0, totalPrestadores: 0, ocupados: 0, proximaExpiracao: null, loading: true })
    
    verificarInventarioSegmento(cidadeId, categoriaId, posicao)
      .then(res => {
        if (isMounted) setResultado({ ...res, loading: false })
      })
      .catch(() => {
        if (isMounted) setResultado(null)
      })

    return () => { isMounted = false }
  }, [cidadeId, categoriaId, posicao])

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
              <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-widest font-medium">Inventário em tempo real</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Posição do Anúncio</label>
            <select className={inputClass} value={posicao} onChange={e => setPosicao(e.target.value)}>
              <option value="entre_cards">Entre os cards de prestadores</option>
              <option value="topo_busca">Topo do resultado da busca</option>
              <option value="topo_perfil">Topo do perfil do prestador</option>
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cidade</label>
              <select className={inputClass} value={cidadeId} onChange={e => setCidadeId(e.target.value)} disabled={!regiaoId}>
                <option value="">Selecione</option>
                {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select className={inputClass} value={categoriaId} onChange={e => setCategoriaId(e.target.value)} disabled={!grupoId}>
                <option value="">Selecione primeiro o Grupo</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="col-span-2">
               <label className={labelClass}>Grupo (Filtro auxiliar)</label>
               <select className={inputClass} value={grupoId} onChange={e => { setGrupoId(e.target.value); setCategoriaId('') }}>
                 <option value="">Selecione</option>
                 {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
               </select>
            </div>
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="mt-6 border-t border-zinc-100 pt-6">
          {!resultado ? (
            <div className="text-center py-6 text-zinc-300">
              <TrendingUp size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-[11px] font-medium uppercase tracking-widest">Preencha os campos para calcular</p>
            </div>
          ) : resultado.loading ? (
            <div className="text-center py-6 text-blue-400 animate-pulse">
              <p className="text-[11px] font-medium uppercase tracking-widest">Calculando base de dados...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Status da Praça</p>
                  <p className="text-sm font-semibold text-zinc-700">{resultado.totalPrestadores} prestadores ativos</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Capacidade Total</p>
                  <p className="text-sm font-bold text-zinc-900">{resultado.vagasTotais} vagas</p>
                </div>
              </div>

              {resultado.vagasTotais === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-2xl border border-zinc-200 text-center">
                  <AlertCircle size={20} className="text-zinc-400 mb-2" />
                  <p className="text-[13px] font-semibold text-zinc-700">Praça em desenvolvimento</p>
                  <p className="text-[11px] text-zinc-500 mt-1">São necessários ao menos 4 prestadores para abrir 1 vaga de anúncio nesta categoria.</p>
                </div>
              ) : resultado.vagasDisponiveis > 0 ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0"><CheckCircle2 size={20} /></div>
                  <div>
                    <p className="text-[13px] font-bold text-emerald-700">Espaço liberado para venda!</p>
                    <p className="text-[11px] font-medium text-emerald-600/80 mt-0.5">Existem {resultado.vagasDisponiveis} vagas livres neste momento.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shrink-0"><Clock size={20} /></div>
                    <div>
                      <p className="text-[13px] font-bold text-amber-700">Lotação Máxima Atingida</p>
                      <p className="text-[11px] font-medium text-amber-600/80 mt-0.5">Todas as {resultado.vagasTotais} vagas estão ocupadas.</p>
                    </div>
                  </div>
                  {resultado.proximaExpiracao && (
                    <div className="mt-2 border-t border-amber-200/50 pt-2 text-[11px] text-amber-700 font-medium">
                      💡 Venda um agendamento. A próxima vaga será liberada automaticamente em: 
                      <strong className="block text-sm mt-0.5">{new Date(resultado.proximaExpiracao).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
