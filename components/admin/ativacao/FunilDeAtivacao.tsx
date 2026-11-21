// components/admin/ativacao/FunilDeAtivacao.tsx
// Mostra onde as pessoas convidadas travam. Só exibe; a conta vem de lib/ativacao/funil.ts.

import { Card } from '@/components/admin/ui'
import { leituraDoFunil, type Funil } from '@/lib/ativacao/funil'

export function FunilDeAtivacao({ funil }: { funil: Funil }) {
  return (
    <Card titulo="Funil de ativação" descricao="De quem recebeu o convite, quantos chegaram em cada etapa.">
      <p className="mb-4 rounded-lg bg-pqf-blue-soft px-3 py-2 text-sm font-semibold text-pqf-ink" data-testid="funil-leitura">
        {leituraDoFunil(funil)}
      </p>

      <ol className="space-y-3">
        {funil.etapas.map((etapa) => (
          <li key={etapa.chave} data-testid={`funil-${etapa.chave}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-pqf-ink">{etapa.rotulo}</span>
              <span className="tabular-nums text-pqf-muted">
                <strong className="text-pqf-ink">{etapa.total}</strong>
                {etapa.chave !== 'convidados' && ` · ${etapa.percentual}%`}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
              <div className="h-full rounded-full bg-pqf-blue" style={{ width: `${etapa.total > 0 ? Math.max(4, etapa.percentual) : 0}%` }} />
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs leading-5 text-pqf-muted">
        {funil.recusaram > 0 && <>{funil.recusaram} recusaram e não seguem no funil. </>}
        {funil.contasSemConvite > 0 && <>{funil.contasSemConvite} contas reais chegaram sem passar por um convite aqui. </>}
        Perfis de exemplo não entram na conta.
      </p>
    </Card>
  )
}
