//components/perfil/SecaoLocalizacao.tsx

'use client'

import type { Estado, Regiao, Cidade } from '@/types/localizacao'

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
  const cidadeSedeNome = listaCidades.find(c => String(c.id) === String(cidadeId))?.nome

  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
      <h2 className="font-bold uppercase text-[11px] tracking-widest text-slate-400 mb-4">Onde você atende?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={estadoSigla || ''}
          onChange={e => onEstadoChange(e.target.value)}
          className={inputStyle}
          required
        >
          <option value="">Estado</option>
          {listaEstados.map(est => (
            <option key={est.sigla} value={est.sigla}>{est.nome}</option>
          ))}
        </select>

        <select
          value={regiaoId || ''}
          onChange={e => onRegiaoChange(e.target.value)}
          className={inputStyle}
          disabled={!estadoSigla}
        >
          <option value="">Região (Opcional)</option>
          {listaRegioes.map(reg => (
            <option key={reg.id} value={reg.id}>{reg.nome}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
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
          <option value="">Cidade Sede</option>
          {listaCidades.map(cid => (
            <option key={cid.id} value={cid.id}>{cid.nome}</option>
          ))}
        </select>

        <input
          value={bairro || ''}
          placeholder="Bairro"
          onChange={e => onBairroChange(e.target.value)}
          className={inputStyle}
        />
      </div>

      {regiaoId && cidadesRegiao.length > 1 && cidadeId && (
        <div className="pt-6 border-t border-slate-50">
          <label className="text-slate-400 font-bold text-[10px] uppercase block mb-4 tracking-widest">
            Cidades vizinhas que você também atende:
          </label>
          <div className="flex flex-wrap gap-2">
            {cidadesRegiao
              .filter(c => String(c.id) !== String(cidadeId))
              .map(cid => (
                <button
                  key={cid.id}
                  type="button"
                  onClick={() => onToggleCidade(cid.nome)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-semibold uppercase transition-all border ${
                    cidadesAtendidas?.includes(cid.nome)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cid.nome}
                </button>
              ))}
          </div>
        </div>
      )}
    </section>
  )
}