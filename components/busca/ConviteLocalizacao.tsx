'use client'
// components/busca/ConviteLocalizacao.tsx
//
// Convite para usar a localização do aparelho. Só aparece quando não sabemos a cidade da pessoa
// e só pede ao navegador depois do toque no botão. O texto diz o que de fato fazemos
// (ver Política de Privacidade, seção 8): usamos a posição só para descobrir a cidade e não guardamos a posição.

import { useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { useLocation, type EstadoLocalizacao } from '@/lib/contexts/LocationContext'
import { conviteDispensado, dispensarConvite } from '@/lib/localizacao'

const MENSAGENS: Partial<Record<EstadoLocalizacao, string>> = {
  negado: 'Tudo bem! Sem a localização, é só escolher a sua cidade nos filtros.',
  sem_cidade: 'Ainda não temos profissionais cadastrados na sua cidade. Abaixo estão os de outras cidades; você pode escolher uma nos filtros.',
  erro: 'Não conseguimos descobrir a sua cidade agora. Tente de novo ou escolha a cidade nos filtros.',
  indisponivel: 'Este aparelho não deixa usar a localização. Escolha a sua cidade nos filtros.',
}

const botaoPrimario =
  'min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
const botaoSecundario =
  'min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600'

// `compacto`: versão curta para a home, onde o convite não pode disputar espaço com a busca.
export function ConviteLocalizacao({ compacto = false }: { compacto?: boolean }) {
  const { estadoLocalizacao, solicitarLocalizacao } = useLocation()
  const [dispensado, setDispensado] = useState(() => conviteDispensado())

  if (dispensado) return null

  function dispensar() {
    dispensarConvite()
    setDispensado(true)
  }

  const mensagem = MENSAGENS[estadoLocalizacao]
  const pedindo = estadoLocalizacao === 'pedindo'

  return (
    <section
      aria-label="Usar a sua localização"
      className={`flex gap-3 rounded-3xl border border-blue-100 bg-blue-50/60 ${compacto ? 'p-3 md:p-4' : 'p-4 md:p-5'}`}
    >
      {/* Na versão curta, o ícone some no celular para os dois botões caberem lado a lado */}
      <div className={`${compacto ? 'hidden sm:flex' : 'flex'} size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600`}>
        <MapPin size={20} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        {mensagem ? (
          <>
            <p role="status" className="text-sm leading-relaxed text-slate-700">{mensagem}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(estadoLocalizacao === 'erro') && (
                <button type="button" onClick={solicitarLocalizacao} className={botaoPrimario}>Tentar de novo</button>
              )}
              <button type="button" onClick={dispensar} className={botaoSecundario}>Ok, entendi</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-base font-bold text-slate-800">Ver quem atende perto de você?</h2>
            {compacto ? (
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                Usamos só para descobrir a cidade; não guardamos a sua posição.{' '}
                <Link href="/privacidade" className="font-semibold text-blue-600 underline underline-offset-4">
                  Como tratamos seus dados
                </Link>
                .
              </p>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Com a sua localização, mostramos primeiro os profissionais da sua cidade e o resultado fica mais certo
                para você. Usamos só para descobrir a cidade: não guardamos a sua posição exata.{' '}
                <Link href="/privacidade" className="font-semibold text-blue-600 underline underline-offset-4">
                  Como tratamos seus dados
                </Link>
                .
              </p>
            )}
            <div className={`${compacto ? 'mt-2' : 'mt-3'} flex flex-wrap gap-2`}>
              <button type="button" onClick={solicitarLocalizacao} disabled={pedindo} className={botaoPrimario}>
                {pedindo ? 'Procurando a sua cidade…' : 'Usar minha localização'}
              </button>
              <button type="button" onClick={dispensar} disabled={pedindo} className={botaoSecundario}>
                Agora não
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
