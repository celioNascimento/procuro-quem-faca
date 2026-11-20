// app/(admin)/admin/verificacoes/page.tsx — tela "Selos": orquestração, liga o hook ao componente
'use client'
import { useState } from 'react'
import { useAdminVerificacoes } from '@/hooks/useAdminVerificacoes'
import { VerificacaoCard } from '@/components/admin/verificacoes/VerificacaoCard'
import { DocumentoCard } from '@/components/admin/verificacoes/DocumentoCard'
import { useAdminDocumentos } from '@/hooks/useAdminDocumentos'
import { EmptyState, PageHeader, Segmented } from '@/components/admin/ui'

type Filtro = 'pendentes' | 'aprovadas' | 'rejeitadas'
type Tipo = 'cnpj' | 'documentos'

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'pendentes', rotulo: 'Aguardando' },
  { valor: 'aprovadas', rotulo: 'Aprovadas' },
  { valor: 'rejeitadas', rotulo: 'Rejeitadas' },
]

const ABAS: { id: Tipo; rotulo: string }[] = [
  { id: 'cnpj', rotulo: 'CNPJ' },
  { id: 'documentos', rotulo: 'Seguro e CND' },
]

function Erro({ texto }: { texto: string }) {
  return <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{texto}</p>
}

function SecaoDocumentos() {
  const { itens, loading, filtro, setFiltro, processando, erro, camposDe, atualizar, alternarItem, abrirComprovante, decidir } = useAdminDocumentos()
  return (
    <section data-testid="secao-documentos" className="space-y-6">
      <p className="text-sm text-pqf-muted">Seguro (nível Ouro) e CND federal (nível Diamante). Confira o comprovante, informe a validade e decida.</p>
      <Segmented<Filtro> label="Filtrar documentos" valor={filtro as Filtro} onChange={setFiltro as (v: Filtro) => void} opcoes={FILTROS} />
      {erro && <Erro texto={erro} />}
      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
      ) : itens.length === 0 ? (
        <EmptyState titulo="Nada por aqui nesta lista" />
      ) : (
        <div className="space-y-4">
          {itens.map(item => (
            <DocumentoCard key={item.verificacao_id} item={item} processando={processando} campos={camposDe(item.verificacao_id)}
              onCampos={p => atualizar(item.verificacao_id, p)} onAlternarItem={i => alternarItem(item.verificacao_id, i)} onAbrir={() => abrirComprovante(item)}
              onAprovar={() => decidir(item, 'aprovada')} onRejeitar={() => decidir(item, 'rejeitada')} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function VerificacoesPage() {
  const [tipo, setTipo] = useState<Tipo>('cnpj')
  const { itens, loading, filtro, setFiltro, processando, erro, motivos, atualizarMotivo, decidir } = useAdminVerificacoes()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Selos"
        descricao="Quando o nome do prestador não confere com a Receita, o CNPJ espera aqui. Aprovar ativa o selo; rejeitar libera o CNPJ."
      />

      <div role="tablist" aria-label="Tipo de verificação" className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
        {ABAS.map(({ id, rotulo }) => (
          <button key={id} type="button" role="tab" aria-selected={tipo === id} onClick={() => setTipo(id)} data-testid={`aba-admin-${id}`}
            className={`min-h-10 rounded-md px-5 text-sm font-semibold transition-colors ${tipo === id ? 'bg-white text-pqf-blue shadow-sm' : 'text-pqf-muted hover:text-pqf-ink'}`}>
            {rotulo}
          </button>
        ))}
      </div>

      {tipo === 'documentos' ? <SecaoDocumentos /> : (
        <div className="space-y-6">
          <Segmented<Filtro> label="Filtrar verificações" valor={filtro as Filtro} onChange={setFiltro as (v: Filtro) => void} opcoes={FILTROS} />

          {erro && <Erro texto={erro} />}

          {loading ? (
            <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : itens.length === 0 ? (
            <EmptyState titulo="Nada por aqui nesta lista" />
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
        </div>
      )}
    </div>
  )
}
