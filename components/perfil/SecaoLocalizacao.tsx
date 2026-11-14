// components/perfil/SecaoLocalizacao.tsx

'use client'

import { MapPin } from 'lucide-react'
import type { Estado, Regiao, Cidade } from '@/types/localizacao'
import { CartaoSecao, Campo } from '@/components/perfil/CartaoSecao'

interface SecaoLocalizacaoProps {
  estadoSigla: string
  regiaoId: string | number
  cidadeId: string | number
  bairro: string
  cidadesAtendidas: string[]
  listaEstados: Estado[]
  listaRegioes: Regiao[]
  listaCidades: Cidade[]
  cidadesRegiao: Cidade[]
  inputStyle: string
  onEstadoChange: (sigla: string) => void
  onRegiaoChange: (id: string) => void
  onCidadeChange: (id: string) => void
  onBairroChange: (v: string) => void
  onToggleCidade: (nome: string) => void
}

export function SecaoLocalizacao({
  estadoSigla,
  regiaoId,
  cidadeId,
  bairro,
  cidadesAtendidas,
  listaEstados,
  listaRegioes,
  listaCidades,
  cidadesRegiao,
  inputStyle,
  onEstadoChange,
  onRegiaoChange,
  onCidadeChange,
  onBairroChange,
  onToggleCidade,
}: SecaoLocalizacaoProps) {
  return (
    <CartaoSecao
      titulo="Onde você atende?"
      descricao="Assim os clientes da sua cidade encontram você na busca."
      icone={<MapPin size={20} />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Campo id="perfil-estado" rotulo="Estado">
          <select
            id="perfil-estado"
            value={estadoSigla || ''}
            onChange={e => onEstadoChange(e.target.value)}
            className={inputStyle}
            required
          >
            <option value="">Selecione</option>
            {listaEstados.map(est => (
              <option key={est.sigla} value={est.sigla}>{est.nome}</option>
            ))}
          </select>
        </Campo>

        <Campo id="perfil-regiao" rotulo="Região" opcional>
          <select
            id="perfil-regiao"
            value={regiaoId || ''}
            onChange={e => onRegiaoChange(e.target.value)}
            className={inputStyle}
            disabled={!estadoSigla}
          >
            <option value="">Selecione</option>
            {listaRegioes.map(reg => (
              <option key={reg.id} value={reg.id}>{reg.nome}</option>
            ))}
          </select>
        </Campo>

        <Campo id="perfil-cidade" rotulo="Cidade onde você mora ou trabalha">
          <select
            id="perfil-cidade"
            value={cidadeId || ''}
            onChange={e => {
              const id = e.target.value
              const nomeSede = listaCidades.find(c => String(c.id) === String(id))?.nome
              onCidadeChange(id)
              // Remove a cidade sede das cidades atendidas caso esteja lá
              if (nomeSede && cidadesAtendidas.includes(nomeSede)) {
                onToggleCidade(nomeSede)
              }
            }}
            className={inputStyle}
            required
            disabled={!estadoSigla}
          >
            <option value="">Selecione</option>
            {listaCidades.map(cid => (
              <option key={cid.id} value={cid.id}>{cid.nome}</option>
            ))}
          </select>
        </Campo>

        <Campo id="perfil-bairro" rotulo="Bairro" opcional>
          <input
            id="perfil-bairro"
            value={bairro || ''}
            placeholder="Ex.: Centro"
            onChange={e => onBairroChange(e.target.value)}
            className={inputStyle}
          />
        </Campo>
      </div>

      {regiaoId && cidadesRegiao.length > 1 && cidadeId && (
        <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-5">
          <p id="perfil-vizinhas" className="text-sm font-bold text-slate-700">
            Cidades vizinhas que você também atende <span className="ml-1 text-xs font-semibold text-slate-400">(opcional)</span>
          </p>
          <div role="group" aria-labelledby="perfil-vizinhas" className="flex flex-wrap gap-2">
            {cidadesRegiao
              .filter(c => String(c.id) !== String(cidadeId))
              .map(cid => {
                const marcada = !!cidadesAtendidas?.includes(cid.nome)
                return (
                  <button
                    key={cid.id}
                    type="button"
                    aria-pressed={marcada}
                    onClick={() => onToggleCidade(cid.nome)}
                    className={`min-h-9 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                      marcada
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {cid.nome}
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </CartaoSecao>
  )
}
