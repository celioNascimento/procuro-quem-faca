'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Badge, Button, Card } from '@/components/admin/ui'
import { DIAS_PARA_LEMBRAR, META_DIARIA, proximosConvites, restamHoje, enviadosHoje, semResposta, type PerfilDaFila } from '@/lib/ativacao/fila'
import { nomeDoPerfil } from '@/lib/ativacao/lista'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'

interface Props<P extends PerfilDaFila> {
  /** Todos os perfis: é daqui que sai a contagem de hoje e a lista de quem não respondeu. */
  todos: P[]
  /** Perfis dentro do filtro de local escolhido na tela: é daqui que sai a fila de hoje. */
  recorte: P[]
  onEnviar: (perfil: P) => Promise<void>
  onRespondeu: (perfil: P) => Promise<void>
}

function Local({ p }: { p: PerfilDaFila }) {
  return <span className="text-xs text-pqf-muted">{p.cidade ?? 'Sem cidade'}</span>
}

// "Para fazer hoje": quem convidar agora (até a meta do dia) e quem foi contatado e não respondeu.
export function FilaDeHoje<P extends PerfilDaFila>({ todos, recorte, onEnviar, onRespondeu }: Props<P>) {
  const [ocupado, setOcupado] = useState<number | null>(null)
  const agora = new Date()
  const feitos = enviadosHoje(todos, agora)
  const fila = proximosConvites(recorte, restamHoje(todos, agora))
  const lembretes = semResposta(todos, agora)
  const pct = Math.min(100, Math.round((feitos / META_DIARIA) * 100))

  async function executar(id: number, acao: () => Promise<void>) {
    setOcupado(id)
    try { await acao() } finally { setOcupado(null) }
  }

  return (
    <Card
      titulo="Para fazer hoje"
      descricao={`Um convite de cada vez, com o link pessoal. Meta do dia: ${META_DIARIA}.`}
      acoes={<Badge tom={feitos >= META_DIARIA ? 'sucesso' : 'marca'}>{feitos} de {META_DIARIA} enviados hoje</Badge>}
    >
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={META_DIARIA} aria-valuenow={Math.min(feitos, META_DIARIA)} aria-label="Convites enviados hoje">
        <div className="h-full rounded-full bg-pqf-blue transition-all" style={{ width: `${pct}%` }} />
      </div>

      <h3 className="text-sm font-semibold text-pqf-ink">Convidar agora</h3>
      {feitos >= META_DIARIA ? (
        <p className="mt-2 text-sm text-pqf-muted" data-testid="fila-meta-cumprida">Meta de hoje cumprida. Responda quem escrever e volte amanhã.</p>
      ) : fila.length === 0 ? (
        <p className="mt-2 text-sm text-pqf-muted" data-testid="fila-vazia">Ninguém disponível para convidar neste filtro. Perfis sem WhatsApp, sem endereço ou que já têm conta ficam de fora.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100" data-testid="fila-convidar">
          {fila.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-pqf-ink">{nomeDoPerfil(p)}</p>
                <Local p={p} />
              </div>
              <Button variante="primario" disabled={ocupado === p.id} icone={<MessageCircle size={14} aria-hidden="true" />} onClick={() => executar(p.id, () => onEnviar(p))}>
                Enviar convite
              </Button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-6 text-sm font-semibold text-pqf-ink">Sem resposta há {DIAS_PARA_LEMBRAR} dias ou mais</h3>
      {lembretes.length === 0 ? (
        <p className="mt-2 text-sm text-pqf-muted" data-testid="fila-sem-lembretes">Ninguém esperando retorno por mais de {DIAS_PARA_LEMBRAR} dias.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100" data-testid="fila-lembretes">
          {lembretes.map(({ perfil: p, dias }) => {
            const conversa = buildLinkWhatsapp(p.whatsapp)
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-pqf-ink">{nomeDoPerfil(p)}</p>
                  <span className="text-xs text-pqf-muted">Contatado há {dias} dias</span>
                </div>
                {conversa && (
                  <a href={conversa} target="_blank" rel="noreferrer" className="text-sm font-semibold text-pqf-blue hover:underline">
                    Abrir conversa
                  </a>
                )}
                <Button disabled={ocupado === p.id} onClick={() => executar(p.id, () => onRespondeu(p))}>Respondeu</Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
