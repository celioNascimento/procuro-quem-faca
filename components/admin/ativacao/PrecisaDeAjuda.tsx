// components/admin/ativacao/PrecisaDeAjuda.tsx
'use client'

// Quem já tem conta e travou antes de aparecer no feed. Só exibe; as regras vêm de lib/ativacao/ajuda.ts.

import { useState } from 'react'
import { Copy, MessageCircle } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Segmented } from '@/components/admin/ui'
import {
  DIAS_PARADO, DIAS_SUMIDO, mensagemDeAjuda, ORIENTACAO_MOTIVO, resumoDaAjuda, ROTULO_MOTIVO, totalDeSumidos,
  type ItemDeAjuda, type MotivoAjuda,
} from '@/lib/ativacao/ajuda'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'

const MOTIVOS: MotivoAjuda[] = ['sem_trabalho', 'aguardando_cliente', 'aguardando_finalizar']

export function PrecisaDeAjuda({ itens, linkExemplo = null }: { itens: ItemDeAjuda[]; linkExemplo?: string | null }) {
  const resumo = resumoDaAjuda(itens)
  const [copia, setCopia] = useState<'nenhuma' | 'copiado' | 'erro'>('nenhuma')
  const [visao, setVisao] = useState<'todos' | 'sumidos'>('todos')
  const sumidos = totalDeSumidos(itens)
  const mostrados = visao === 'sumidos' ? itens.filter((i) => i.sumido) : itens

  async function copiarLink() {
    if (!linkExemplo) return
    try {
      await navigator.clipboard.writeText(linkExemplo)
      setCopia('copiado')
    } catch {
      setCopia('erro')
    }
  }

  return (
    <Card
      titulo="Precisa de ajuda"
      descricao="Contas reais que travaram antes de aparecer no feed. Quem está parado há mais tempo vem primeiro."
    >
      {linkExemplo && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3" data-testid="dica-exemplo">
          <p className="text-sm text-pqf-ink">
            <span className="font-semibold">Dica:</span> depois que a pessoa responder, mande um print do perfil de exemplo no celular. Não mande no primeiro contato.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variante="secundario" onClick={() => void copiarLink()} icone={<Copy size={14} aria-hidden="true" />}>Copiar link do exemplo</Button>
            {copia === 'copiado' && <span role="status" className="text-xs font-semibold text-emerald-700">Link copiado</span>}
            {copia === 'erro' && <span role="alert" className="text-xs font-semibold text-red-700">Não foi possível copiar. Abra o link: {linkExemplo}</span>}
          </div>
        </div>
      )}

      {itens.length === 0 ? (
        <EmptyState titulo="Ninguém travado agora" descricao="Quando alguém criar a conta e não publicar, ou deixar um trabalho parado, aparece aqui." />
      ) : (
        <>
          {sumidos > 0 && (
            <div className="mb-3">
              <Segmented<'todos' | 'sumidos'>
                label="Quem mostrar"
                valor={visao}
                onChange={setVisao}
                opcoes={[{ valor: 'todos', rotulo: 'Todos', contagem: itens.length }, { valor: 'sumidos', rotulo: `Sumidos (${DIAS_SUMIDO}+ dias)`, contagem: sumidos }]}
              />
            </div>
          )}
          <ul className="mb-4 flex flex-wrap gap-2" data-testid="ajuda-resumo">
            {MOTIVOS.filter((m) => resumo[m] > 0).map((m) => (
              <li key={m}><Badge tom="neutro">{resumo[m]} · {ROTULO_MOTIVO[m]}</Badge></li>
            ))}
          </ul>

          <ul className="divide-y divide-slate-100" data-testid="ajuda-lista">
            {mostrados.map((item) => {
              const conversa = buildLinkWhatsapp(item.whatsapp, mensagemDeAjuda(item))
              return (
                <li key={item.chave} className="py-3" data-testid="ajuda-item">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-pqf-ink">{item.nome}</p>
                      <p className="text-xs text-pqf-muted">
                        {item.cidade ?? 'Sem cidade'}{item.titulo ? ` · ${item.titulo}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.sumido && <Badge tom="perigo">Sumido</Badge>}
                      <Badge tom={item.parado ? 'alerta' : 'neutro'}>
                        {item.dias === 0 ? 'hoje' : `há ${item.dias} ${item.dias === 1 ? 'dia' : 'dias'}`}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-pqf-ink">{ROTULO_MOTIVO[item.motivo]}</p>
                  {item.ultimoAcessoDias !== null && (
                    <p className="text-xs text-pqf-muted">
                      Último acesso {item.ultimoAcessoDias === 0 ? 'hoje' : `há ${item.ultimoAcessoDias} ${item.ultimoAcessoDias === 1 ? 'dia' : 'dias'}`}
                    </p>
                  )}
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
          <p className="mt-3 text-xs text-pqf-muted">Parado = {DIAS_PARADO} dias ou mais na mesma etapa. Sumido = {DIAS_SUMIDO} dias ou mais sem entrar. Perfis de exemplo não entram.</p>
        </>
      )}
    </Card>
  )
}
