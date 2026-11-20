// app/(admin)/admin/moderacao/page.tsx — tela "Denúncias" (a URL antiga /admin/moderacao continua, por causa dos links dos e-mails)
'use client'
import { useModeracao } from '@/hooks/useModeracao'
import { DenunciaCard } from '@/components/admin/moderacao/DenunciaCard'
import { EmptyState, PageHeader, Segmented } from '@/components/admin/ui'

type Filtro = 'aberta' | 'resolvida' | 'arquivada' | 'todas'

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'aberta', rotulo: 'Abertas' },
  { valor: 'resolvida', rotulo: 'Resolvidas' },
  { valor: 'arquivada', rotulo: 'Arquivadas' },
  { valor: 'todas', rotulo: 'Todas' },
]

export default function ModeracaoPage() {
  const {
    denuncias, loading, filtro, setFiltro,
    processando, arquivar, resolverSemBloqueio, resolverComBloqueio, desbloquear,
    motivoBloqueio, atualizarMotivo,
  } = useModeracao()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Denúncias"
        descricao="Perfis de prestadores denunciados. Resolva, arquive ou bloqueie o perfil."
      />

      <Segmented<Filtro> label="Filtrar denúncias" valor={filtro} onChange={setFiltro} opcoes={FILTROS} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : denuncias.length === 0 ? (
        <EmptyState titulo="Nenhuma denúncia nesta lista" descricao="Quando alguém denunciar um perfil, ele aparece aqui." />
      ) : (
        <div className="space-y-4">
          {denuncias.map(d => (
            <DenunciaCard
              key={d.id}
              denuncia={d}
              processando={processando}
              motivoBloqueio={motivoBloqueio[d.id] || ''}
              onAtualizarMotivo={valor => atualizarMotivo(d.id, valor)}
              onArquivar={() => arquivar(d.id)}
              onResolverSemBloqueio={() => resolverSemBloqueio(d.id)}
              onResolverComBloqueio={() => resolverComBloqueio(d.id, d.prestador_id, motivoBloqueio[d.id] || d.motivo)}
              onDesbloquear={() => desbloquear(d.id, d.prestador_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
