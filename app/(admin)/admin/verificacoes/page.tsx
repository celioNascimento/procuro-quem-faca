// app/(admin)/admin/verificacoes/page.tsx — orquestração: liga o hook ao componente
'use client'
import { BadgeCheck } from 'lucide-react'
import { useAdminVerificacoes } from '@/hooks/useAdminVerificacoes'
import { VerificacaoCard } from '@/components/admin/verificacoes/VerificacaoCard'
import { DocumentoCard } from '@/components/admin/verificacoes/DocumentoCard'
import { useAdminDocumentos } from '@/hooks/useAdminDocumentos'
import { useState } from 'react'

const FILTROS = [
  { valor: 'pendentes', label: 'Aguardando' },
  { valor: 'aprovadas', label: 'Aprovadas' },
  { valor: 'rejeitadas', label: 'Rejeitadas' },
] as const

function SecaoDocumentos() {
  const { itens, loading, filtro, setFiltro, processando, erro, camposDe, atualizar, abrirComprovante, decidir } = useAdminDocumentos()
  return (
    <section data-testid="secao-documentos">
      <p className="mb-4 text-sm text-slate-500">Seguro (nível Ouro) e CND federal (nível Diamante). Confira o comprovante, informe a validade e decida.</p>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map(f => (
          <button key={f.valor} onClick={() => setFiltro(f.valor)} aria-pressed={filtro === f.valor}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${filtro === f.valor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {erro && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      ) : itens.length === 0 ? (
        <p className="py-20 text-center text-sm font-semibold text-slate-400">Nada por aqui nesta lista.</p>
      ) : (
        <div className="space-y-4">
          {itens.map(item => (
            <DocumentoCard key={item.verificacao_id} item={item} processando={processando} campos={camposDe(item.verificacao_id)}
              onCampos={p => atualizar(item.verificacao_id, p)} onAbrir={() => abrirComprovante(item)}
              onAprovar={() => decidir(item, 'aprovada')} onRejeitar={() => decidir(item, 'rejeitada')} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function VerificacoesPage() {
  const [tipo, setTipo] = useState<'cnpj' | 'documentos'>('cnpj')
  const { itens, loading, filtro, setFiltro, processando, erro, motivos, atualizarMotivo, decidir } = useAdminVerificacoes()

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Selos de confiança</p>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 sm:text-3xl">
          Verificações de CNPJ<span className="not-italic text-indigo-600">.</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quando o nome do prestador não confere com a Receita, o CNPJ espera aqui. Aprovar ativa o selo; rejeitar libera o CNPJ.
        </p>
      </header>

      <div role="tablist" aria-label="Tipo de verificação" className="mb-6 flex w-fit gap-1 rounded-2xl bg-slate-100 p-1">
        {([['cnpj', 'CNPJ'], ['documentos', 'Seguro e CND']] as const).map(([id, rotulo]) => (
          <button key={id} role="tab" aria-selected={tipo === id} onClick={() => setTipo(id)} data-testid={`aba-admin-${id}`}
            className={`min-h-10 rounded-xl px-5 text-xs font-black uppercase tracking-widest ${tipo === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
            {rotulo}
          </button>
        ))}
      </div>

      {tipo === 'documentos' ? <SecaoDocumentos /> : (<>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map(f => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            aria-pressed={filtro === f.valor}
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              filtro === f.valor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {erro && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : itens.length === 0 ? (
        <div className="py-20 text-center text-slate-400">
          <BadgeCheck size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold">Nada por aqui nesta lista.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {itens.map(item => (
            <VerificacaoCard
              key={item.verificacao_id}
              item={item}
              processando={processando}
              motivo={motivos[item.verificacao_id] || ''}
              onAtualizarMotivo={valor => atualizarMotivo(item.verificacao_id, valor)}
              onAprovar={() => decidir(item, 'aprovada')}
              onRejeitar={() => decidir(item, 'rejeitada')}
            />
          ))}
        </div>
      )}
      </>)}
    </main>
  )
}
