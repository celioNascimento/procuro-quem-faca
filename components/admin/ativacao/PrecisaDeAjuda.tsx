// components/admin/ativacao/PrecisaDeAjuda.tsx
// Quem já tem conta e travou antes de aparecer no feed. Só exibe; as regras vêm de lib/ativacao/ajuda.ts.

import { MessageCircle } from 'lucide-react'
import { Badge, Card, EmptyState } from '@/components/admin/ui'
import {
  DIAS_PARADO, mensagemDeAjuda, ORIENTACAO_MOTIVO, resumoDaAjuda, ROTULO_MOTIVO,
  type ItemDeAjuda, type MotivoAjuda,
} from '@/lib/ativacao/ajuda'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'

const MOTIVOS: MotivoAjuda[] = ['sem_trabalho', 'aguardando_cliente', 'aguardando_finalizar']

export function PrecisaDeAjuda({ itens }: { itens: ItemDeAjuda[] }) {
  const resumo = resumoDaAjuda(itens)

  return (
    <Card
      titulo="Precisa de ajuda"
      descricao="Contas reais que travaram antes de aparecer no feed. Quem está parado há mais tempo vem primeiro."
    >
      {itens.length === 0 ? (
        <EmptyState titulo="Ninguém travado agora" descricao="Quando alguém criar a conta e não publicar, ou deixar um trabalho parado, aparece aqui." />
      ) : (
        <>
          <ul className="mb-4 flex flex-wrap gap-2" data-testid="ajuda-resumo">
            {MOTIVOS.filter((m) => resumo[m] > 0).map((m) => (
              <li key={m}><Badge tom="neutro">{resumo[m]} · {ROTULO_MOTIVO[m]}</Badge></li>
            ))}
          </ul>

          <ul className="divide-y divide-slate-100" data-testid="ajuda-lista">
            {itens.map((item) => {
              const conversa = buildLinkWhatsapp(item.whatsapp, mensagemDeAjuda(item))
              return (
                <li key={item.chave} className="py-3" data-testid="ajuda-item">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-pqf-ink">{item.nome}</p>
                      <p className="text-xs text-pqf-muted">
                        {item.cidade ?? 'Sem cidade'}{item.titulo ? ` · ${item.titulo}` : ''}
                      </p>
                    </div>
                    <Badge tom={item.parado ? 'alerta' : 'neutro'}>
                      {item.dias === 0 ? 'hoje' : `há ${item.dias} ${item.dias === 1 ? 'dia' : 'dias'}`}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-pqf-ink">{ROTULO_MOTIVO[item.motivo]}</p>
                  <p className="text-xs text-pqf-muted">{ORIENTACAO_MOTIVO[item.motivo]}</p>
                  {conversa && (
                    <a href={conversa} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-pqf-blue hover:underline">
                      <MessageCircle size={14} aria-hidden="true" /> Chamar no WhatsApp
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-pqf-muted">Parado = {DIAS_PARADO} dias ou mais na mesma etapa. Perfis de exemplo não entram.</p>
        </>
      )}
    </Card>
  )
}
