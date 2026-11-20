'use client'
// components/busca/CidadeDaBusca.tsx
//
// Dentro da linha logo abaixo do título (o contador fica do outro lado). A cidade dos resultados já
// está no título; aqui fica o caminho para ver outras (e, em "todas as cidades", o aviso e o caminho de volta).
// Quando a cidade é a que ficou SALVA no aparelho, também há "Atualizar minha localização": quem muda de
// cidade (ou testou em outra) não fica preso à cidade antiga por 30 dias.

import { MapPin } from 'lucide-react'
import type { OrigemCidade } from '@/lib/buscaFiltros'
import type { EstadoLocalizacao } from '@/lib/contexts/LocationContext'

type Props = {
  cidadeNome: string | null
  origem: OrigemCidade
  ampliar: boolean
  /** Cidade salva do usuário (para oferecer "voltar"). */
  cidadeSalvaNome: string | null
  onVerOutrasCidades: () => void
  onVoltarParaMinhaCidade: () => void
  /** Pede a posição ao aparelho e troca a cidade salva. Sem isto, o botão não aparece. */
  onAtualizarLocalizacao?: () => void
  estadoLocalizacao?: EstadoLocalizacao
}

const linha = 'flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-slate-600'

const botao =
  '-my-2 inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-semibold text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60'

// Resposta honesta quando a atualização não deu certo (a cidade antiga continua valendo).
const AVISOS: Partial<Record<EstadoLocalizacao, string>> = {
  negado: 'Sem a permissão do aparelho não dá para atualizar. Escolha a cidade nos filtros.',
  sem_cidade: 'Ainda não atendemos a cidade onde você está. Mantivemos a cidade anterior.',
  erro: 'Não conseguimos descobrir a sua cidade agora. Tente de novo.',
  indisponivel: 'Este aparelho não deixa usar a localização. Escolha a cidade nos filtros.',
}

export function CidadeDaBusca({
  cidadeNome, origem, ampliar, cidadeSalvaNome, onVerOutrasCidades, onVoltarParaMinhaCidade,
  onAtualizarLocalizacao, estadoLocalizacao = 'parado',
}: Props) {
  // Vale para a cidade salva, a escolhida nos filtros e a escrita na busca ("pedreiro em Maringá"):
  // em todos os casos a pessoa precisa de um caminho para ver as outras cidades.
  if (cidadeNome && (origem === 'salva' || origem === 'filtro' || origem === 'texto')) {
    const podeAtualizar = origem === 'salva' && Boolean(onAtualizarLocalizacao)
    const pedindo = estadoLocalizacao === 'pedindo'
    const aviso = podeAtualizar ? AVISOS[estadoLocalizacao] : undefined

    return (
      <div className={linha}>
        {/* O título logo acima já diz a cidade; aqui fica só o caminho para trocar, e sobra lugar para o contador na mesma linha. */}
        <MapPin size={16} className="shrink-0 text-blue-600" aria-hidden="true" />
        <button type="button" onClick={onVerOutrasCidades} className={botao} title={`Hoje mostrando ${cidadeNome}`}>
          Ver outras cidades
        </button>
        {podeAtualizar && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button type="button" onClick={onAtualizarLocalizacao} disabled={pedindo} className={botao}>
              {pedindo ? 'Procurando a sua cidade…' : 'Não é aqui? Atualizar minha localização'}
            </button>
          </>
        )}
        {aviso && <p role="status" className="basis-full text-xs leading-relaxed text-slate-500">{aviso}</p>}
      </div>
    )
  }

  if (!cidadeNome && ampliar) {
    return (
      <div className={linha}>
        <MapPin size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        <strong className="font-bold text-slate-800">Todas as cidades</strong>
        {cidadeSalvaNome && (
          <>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button type="button" onClick={onVoltarParaMinhaCidade} className={botao}>
              Voltar para {cidadeSalvaNome}
            </button>
          </>
        )}
      </div>
    )
  }

  return null
}
