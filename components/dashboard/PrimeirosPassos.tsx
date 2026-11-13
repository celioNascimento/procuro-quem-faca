// components/dashboard/PrimeirosPassos.tsx
//
// Cartão no topo da aba de trabalhos: diz o que fazer agora, em três passos, com um botão em
// cada. Some sozinho quando os três terminam e pode ser dispensado ("Agora não").
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { SITE_URL } from '@/lib/divulgacao/links'
import { listarPassos, todosConcluidos, totalConcluidos } from '@/lib/dashboard/primeirosPassos'

const CHAVE_DISPENSADO = 'pqf:dashboard:primeiros-passos-dispensado'

interface Props {
  slug?: string | null
  temFotosNaVitrine: boolean
  temTrabalhos: boolean
  onAdicionarFotos: () => void
  onAdicionarTrabalho: () => void
}

export function PrimeirosPassos({ slug, temFotosNaVitrine, temTrabalhos, onAdicionarFotos, onAdicionarTrabalho }: Props) {
  // Começa dispensado para o cartão não piscar antes de ler o armazenamento do navegador.
  const [dispensado, setDispensado] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [erroCopia, setErroCopia] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setDispensado(window.localStorage.getItem(CHAVE_DISPENSADO) === '1')
      } catch {
        // Sem armazenamento (modo privado): o cartão aparece e só some nesta sessão.
        setDispensado(false)
      }
    })
  }, [])

  const passos = listarPassos({ temFotosNaVitrine, temTrabalhos })
  if (dispensado || todosConcluidos(passos)) return null

  const linkDoPerfil = slug ? `${SITE_URL}/${slug}` : null

  const copiarLink = async () => {
    if (!linkDoPerfil) return
    setErroCopia(false)
    try {
      await navigator.clipboard.writeText(linkDoPerfil)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErroCopia(true)
    }
  }

  const dispensar = () => {
    setDispensado(true)
    try {
      window.localStorage.setItem(CHAVE_DISPENSADO, '1')
    } catch {
      // Sem armazenamento: dispensa só nesta sessão.
    }
  }

  const botao =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100'
  const botaoPrincipal = `${botao} bg-blue-600 text-white hover:bg-blue-700`
  const botaoSecundario = `${botao} border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700`

  return (
    <section className="rounded-[1.75rem] border border-blue-100 bg-blue-50/60 p-5 sm:p-6" aria-labelledby="primeiros-passos-titulo">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="primeiros-passos-titulo" className="text-lg font-black tracking-tight text-slate-900">Primeiros passos</h2>
          <p className="mt-0.5 text-sm text-slate-600">{totalConcluidos(passos)} de {passos.length} feitos. Siga a ordem para começar a receber contatos.</p>
        </div>
        <button type="button" onClick={dispensar} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          Agora não
        </button>
      </div>

      <ol className="mt-4 flex flex-col gap-3">
        {passos.map((passo, indice) => (
          <li key={passo.id} className="flex gap-3 rounded-2xl bg-white p-4">
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${passo.concluido ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {passo.concluido ? <Check size={16} strokeWidth={3} /> : indice + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">
                {passo.titulo}
                <span className="sr-only">{passo.concluido ? ' (feito)' : ' (falta fazer)'}</span>
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{passo.descricao}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {passo.id === 'perfil' && linkDoPerfil && (
                  <>
                    <button type="button" onClick={copiarLink} className={botaoPrincipal}>
                      {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                      {copiado ? 'Link copiado' : 'Copiar link do perfil'}
                    </button>
                    <Link href={`/${slug}`} className={botaoSecundario}>
                      <ExternalLink size={16} aria-hidden="true" />
                      Ver meu perfil
                    </Link>
                  </>
                )}
                {passo.id === 'vitrine' && !passo.concluido && (
                  <button type="button" onClick={onAdicionarFotos} className={botaoPrincipal}>Adicionar fotos</button>
                )}
                {passo.id === 'trabalho' && !passo.concluido && (
                  <button type="button" onClick={onAdicionarTrabalho} className={botaoPrincipal}>Adicionar trabalho</button>
                )}
              </div>
              {passo.id === 'perfil' && erroCopia && linkDoPerfil && (
                <p role="alert" className="mt-2 text-sm text-red-700">Não consegui copiar. Selecione e copie o link: {linkDoPerfil}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
