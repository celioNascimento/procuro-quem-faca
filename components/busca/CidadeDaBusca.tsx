'use client'
// components/busca/CidadeDaBusca.tsx
//
// Linha logo abaixo do título: diz de qual cidade são os resultados e dá o caminho
// para ver outras. Antes a lista ficava presa à cidade salva sem a pessoa saber.

import { MapPin } from 'lucide-react'
import type { OrigemCidade } from '@/lib/buscaFiltros'

type Props = {
  cidadeNome: string | null
  origem: OrigemCidade
  ampliar: boolean
  /** Cidade salva do usuário (para oferecer "voltar"). */
  cidadeSalvaNome: string | null
  onVerOutrasCidades: () => void
  onVoltarParaMinhaCidade: () => void
}

const botao =
  'min-h-11 rounded-lg px-2 text-sm font-semibold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'

export function CidadeDaBusca({
  cidadeNome, origem, ampliar, cidadeSalvaNome, onVerOutrasCidades, onVoltarParaMinhaCidade,
}: Props) {
  // Vale para a cidade salva, a escolhida nos filtros e a escrita na busca ("pedreiro em Maringá"):
  // em todos os casos a pessoa precisa de um caminho para ver as outras cidades.
  if (cidadeNome && (origem === 'salva' || origem === 'filtro' || origem === 'texto')) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
        <MapPin size={16} className="shrink-0 text-blue-600" aria-hidden="true" />
        <span>
          Mostrando profissionais de <strong className="font-bold text-slate-800">{cidadeNome}</strong>
        </span>
        <button type="button" onClick={onVerOutrasCidades} className={botao}>
          Ver outras cidades
        </button>
      </div>
    )
  }

  if (!cidadeNome && ampliar) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
        <MapPin size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        <span>Mostrando profissionais de <strong className="font-bold text-slate-800">todas as cidades</strong></span>
        {cidadeSalvaNome && (
          <button type="button" onClick={onVoltarParaMinhaCidade} className={botao}>
            Voltar para {cidadeSalvaNome}
          </button>
        )}
      </div>
    )
  }

  return null
}
