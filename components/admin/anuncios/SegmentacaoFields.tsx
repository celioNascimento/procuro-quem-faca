// components/admin/anuncios/SegmentacaoFields.tsx
'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useSegmentacaoReferencia } from '@/hooks/useSegmentacaoReferencia'
import type { Segmentacao } from '@/lib/services/adminAnuncios.service'

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[12px] text-zinc-800 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:bg-zinc-50 disabled:text-zinc-300'

const labelClass = 'text-[9px] font-medium text-zinc-400 uppercase tracking-widest'

type Opcao = { id?: string; sigla?: string; nome: string }

function LinhaSegmentacao({
  valor,
  onChange,
  onRemove,
  podeRemover,
}: {
  valor: Segmentacao
  onChange: (v: Segmentacao) => void
  onRemove: () => void
  podeRemover: boolean
}) {
  const { estados, grupos, buscarRegioes, buscarCidades, buscarCategorias } = useSegmentacaoReferencia()
  const [regioes, setRegioes] = useState<Opcao[]>([])
  const [cidades, setCidades] = useState<Opcao[]>([])
  const [categorias, setCategorias] = useState<Opcao[]>([])

  // Cascata: estado -> região (reseta região/cidade ao trocar estado)
  useEffect(() => {
    if (!valor.estadoSigla) {
      setRegioes([])
      return
    }
    buscarRegioes(valor.estadoSigla).then(setRegioes)
  }, [valor.estadoSigla, buscarRegioes])

  // Cascata: região -> cidade
  useEffect(() => {
    if (!valor.regiaoId) {
      setCidades([])
      return
    }
    buscarCidades(valor.regiaoId).then(setCidades)
  }, [valor.regiaoId, buscarCidades])

  // Cascata: grupo -> categoria
  useEffect(() => {
    if (!valor.grupoId) {
      setCategorias([])
      return
    }
    buscarCategorias(valor.grupoId).then(setCategorias)
  }, [valor.grupoId, buscarCategorias])

  function handleEstado(estadoSigla: string) {
    onChange({ ...valor, estadoSigla, regiaoId: '', cidadeId: '' })
  }

  function handleRegiao(regiaoId: string) {
    onChange({ ...valor, regiaoId, cidadeId: '' })
  }

  function handleGrupo(grupoId: string) {
    onChange({ ...valor, grupoId, categoriaId: '' })
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        <label className="block">
          <span className={labelClass}>Estado</span>
          <select className={inputClass} value={valor.estadoSigla} onChange={(e) => handleEstado(e.target.value)}>
            <option value="">Selecione</option>
            {estados.map((e) => (
              <option key={e.sigla} value={e.sigla}>{e.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Região</span>
          <select className={inputClass} value={valor.regiaoId} onChange={(e) => handleRegiao(e.target.value)} disabled={!valor.estadoSigla}>
            <option value="">Selecione</option>
            {regioes.map((r) => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Cidade</span>
          <select className={inputClass} value={valor.cidadeId} onChange={(e) => onChange({ ...valor, cidadeId: e.target.value })} disabled={!valor.regiaoId}>
            <option value="">Selecione</option>
            {cidades.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Grupo</span>
          <select className={inputClass} value={valor.grupoId} onChange={(e) => handleGrupo(e.target.value)}>
            <option value="">Selecione</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Categoria</span>
          <select className={inputClass} value={valor.categoriaId} onChange={(e) => onChange({ ...valor, categoriaId: e.target.value })} disabled={!valor.grupoId}>
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-1">
          <label className="block flex-1">
            <span className={labelClass}>Valor (R$)</span>
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              className={inputClass} 
              placeholder="0,00"
              value={valor.valorCobrado || ''} 
              onChange={(e) => onChange({ ...valor, valorCobrado: Number(e.target.value) })} 
            />
          </label>
          {podeRemover && (
            <button
              type="button"
              onClick={onRemove}
              className="mb-0.5 shrink-0 rounded-lg p-2 text-zinc-300 hover:bg-red-50 hover:text-red-500"
              title="Remover esta segmentação"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const SEGMENTACAO_VAZIA: Segmentacao = { estadoSigla: '', regiaoId: '', cidadeId: '', grupoId: '', categoriaId: '', valorCobrado: 0 }

type Props = {
  value: Segmentacao[]
  onChange: (v: Segmentacao[]) => void
}

/**
 * Responsabilidade única: gerenciar a lista de segmentações do anúncio
 * e calcular o valor cobrado total em tempo real para a UI.
 */
export function SegmentacaoFields({ value, onChange }: Props) {
  const linhas = value.length > 0 ? value : [SEGMENTACAO_VAZIA]

  function atualizarLinha(index: number, nova: Segmentacao) {
    const copia = [...linhas]
    copia[index] = nova
    onChange(copia)
  }

  function adicionarLinha() {
    onChange([...linhas, { ...SEGMENTACAO_VAZIA }])
  }

  function removerLinha(index: number) {
    onChange(linhas.filter((_, i) => i !== index))
  }

  const valorTotal = linhas.reduce((acc, linha) => acc + (linha.valorCobrado || 0), 0)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <span className="text-[12px] font-bold text-zinc-800">Direcionamento e Valores</span>
          <p className="text-[10px] text-zinc-400 mt-0.5">Defina onde o anúncio aparece e o valor cobrado por praça</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Total do Anúncio</span>
          <p className="text-lg font-black text-emerald-600 leading-none mt-0.5">
            R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className={labelClass}>Segmentações Cadastradas</span>
        <button
          type="button"
          onClick={adicionarLinha}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <Plus size={12} /> Adicionar região/categoria
        </button>
      </div>
      <div className="space-y-2">
        {linhas.map((linha, i) => (
          <LinhaSegmentacao
            key={i}
            valor={linha}
            onChange={(v) => atualizarLinha(i, v)}
            onRemove={() => removerLinha(i)}
            podeRemover={linhas.length > 1}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-zinc-300">
        Todos os campos são obrigatórios em cada linha. Use "Adicionar região/categoria" para o mesmo anúncio aparecer em mais de um local.
      </p>
    </div>
  )
}
