// components/help/ChatAjuda.tsx
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import type { HelpArticle, HelpAudience } from '@/lib/help/help-content'
import { buscarRespostas, linkWhatsappSuporte, sugestoesIniciais } from '@/lib/help/chat-ajuda'

type Opcao =
  | { texto: string; tipo: 'artigo'; artigo: HelpArticle }
  | { texto: string; tipo: 'resolveu' | 'nao-resolveu' | 'recomecar' }
type Mensagem = {
  autor: 'bot' | 'eu'
  texto?: string
  artigo?: HelpArticle
  opcoes?: Opcao[]
  whatsapp?: string
}

const botao = 'min-h-11 rounded-full border border-blue-200 bg-white px-4 py-2 text-left text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100'

function opcoesDeInicio(audience: HelpAudience, context?: string): Opcao[] {
  return sugestoesIniciais(audience, context).map((artigo) => ({ texto: artigo.title, tipo: 'artigo' as const, artigo }))
}

function saudacao(audience: HelpAudience, context?: string): Mensagem {
  return {
    autor: 'bot',
    texto: 'Oi! Eu ajudo você a usar o Procuro Quem Faça. Escolha uma opção ou escreva sua dúvida com suas palavras.',
    opcoes: opcoesDeInicio(audience, context),
  }
}

function perguntarSeResolveu(outros: HelpArticle[] = []): Mensagem {
  return {
    autor: 'bot',
    texto: outros.length ? 'Isso resolveu a sua dúvida? Se não, veja também:' : 'Isso resolveu a sua dúvida?',
    opcoes: [
      { texto: 'Sim, resolveu', tipo: 'resolveu' },
      ...outros.map((artigo): Opcao => ({ texto: `Ver: ${artigo.title}`, tipo: 'artigo', artigo })),
      { texto: 'Não, preciso de mais ajuda', tipo: 'nao-resolveu' },
    ],
  }
}

export function ChatAjuda({ audience = 'cliente', context }: { audience?: HelpAudience; context?: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => [saudacao(audience, context)])
  const [texto, setTexto] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)
  const jaInteragiu = useRef(false)

  function adicionar(...novas: Mensagem[]) {
    jaInteragiu.current = true
    setMensagens((atual) => [...atual, ...novas])
  }

  function escolher(opcao: Opcao) {
    const fala: Mensagem = { autor: 'eu', texto: opcao.texto }
    if (opcao.tipo === 'artigo') {
      adicionar(fala, { autor: 'bot', artigo: opcao.artigo }, perguntarSeResolveu())
    } else if (opcao.tipo === 'resolveu') {
      adicionar(fala, { autor: 'bot', texto: 'Que bom! Se aparecer outra dúvida, é só chamar.', opcoes: [{ texto: 'Tenho outra dúvida', tipo: 'recomecar' }] })
    } else if (opcao.tipo === 'nao-resolveu') {
      adicionar(fala, { autor: 'bot', texto: 'Sinto muito. Quer tentar outra pergunta ou falar com a nossa equipe?', whatsapp: linkWhatsappSuporte(audience), opcoes: [{ texto: 'Tentar outra pergunta', tipo: 'recomecar' }] })
    } else {
      adicionar(fala, saudacao(audience, context))
    }
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    const pergunta = texto.trim()
    if (!pergunta) return
    setTexto('')
    const achados = buscarRespostas(pergunta, audience)
    if (!achados.length) {
      adicionar(
        { autor: 'eu', texto: pergunta },
        {
          autor: 'bot',
          texto: 'Não achei uma resposta para isso. Você pode reescrever a pergunta, escolher uma das opções ou falar com a nossa equipe.',
          whatsapp: linkWhatsappSuporte(audience, pergunta),
          opcoes: opcoesDeInicio(audience, context),
        },
      )
      return
    }
    const [melhor, ...outros] = achados
    adicionar({ autor: 'eu', texto: pergunta }, { autor: 'bot', texto: 'Encontrei isto para você:' }, { autor: 'bot', artigo: melhor }, perguntarSeResolveu(outros))
  }

  useEffect(() => {
    if (jaInteragiu.current) fimRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [mensagens])

  // Só as opções da última mensagem do robô ficam clicáveis; as antigas viram histórico.
  const ultimaComOpcoes = mensagens.map((m, i) => (m.opcoes?.length ? i : -1)).filter((i) => i >= 0).pop()

  return (
    <section aria-labelledby="chat-ajuda-titulo" className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600" aria-hidden="true"><MessageCircle size={18} /></span>
        <h2 id="chat-ajuda-titulo" className="text-lg font-bold text-slate-900">Converse com a Ajuda</h2>
      </div>

      <div role="log" aria-live="polite" aria-label="Conversa com a Ajuda" className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1">
        {mensagens.map((m, indice) => (
          <div key={indice} className={m.autor === 'eu' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[92%] space-y-3 rounded-2xl px-4 py-3 text-sm leading-6 ${m.autor === 'eu' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-800'}`}>
              {m.texto && <p>{m.texto}</p>}
              {m.artigo && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-900">{m.artigo.title}</p>
                  <p>{m.artigo.summary}</p>
                  {m.artigo.steps && (
                    <ol className="list-decimal space-y-1 pl-5">
                      {m.artigo.steps.map((passo) => <li key={passo}>{passo}</li>)}
                    </ol>
                  )}
                  <Link href={`/ajuda?artigo=${m.artigo.id}`} className="inline-block font-bold text-blue-700 underline">Ver o artigo completo</Link>
                </div>
              )}
              {m.whatsapp && (
                <a href={m.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-green-700 px-4 py-2 font-bold text-white hover:bg-green-800">
                  Falar com a equipe no WhatsApp
                </a>
              )}
              {m.opcoes && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {m.opcoes.map((o) => (
                    <button key={o.texto} type="button" onClick={() => escolher(o)} disabled={indice !== ultimaComOpcoes} className={`${botao} disabled:cursor-default disabled:border-slate-200 disabled:text-slate-500 disabled:hover:bg-white`}>
                      {o.texto}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="mt-4 flex gap-2">
        <label htmlFor="chat-ajuda-texto" className="sr-only">Escreva sua dúvida</label>
        <input
          id="chat-ajuda-texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua dúvida aqui"
          autoComplete="off"
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <button type="submit" disabled={!texto.trim()} aria-label="Enviar dúvida" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500">
          <Send size={18} aria-hidden="true" />
        </button>
      </form>

      <p className="mt-3 text-sm text-slate-600">
        Prefere falar com uma pessoa?{' '}
        <a href={linkWhatsappSuporte(audience)} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline">Chamar a equipe no WhatsApp</a>
      </p>
    </section>
  )
}
