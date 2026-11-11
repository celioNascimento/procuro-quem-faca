// app/meus-dados/page.tsx
//
// Acesso e portabilidade: a pessoa vê o que o PQF guarda sobre ela, o histórico dos aceites e baixa tudo em JSON.

'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import { useMeusDados } from '@/hooks/useMeusDados'
import { ROTULO_CONSENTIMENTO } from '@/lib/meusDados/resumo'

const formatarData = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{titulo}</h2>
      {children}
    </section>
  )
}

export default function MeusDados() {
  const { dados, resumo, carregando, precisaLogin, erro, baixar } = useMeusDados()

  return (
    <main className="min-h-screen bg-[#FDFDFD] pt-32 font-sans">
      <Header href="/" />
      <div className="mx-auto max-w-2xl space-y-6 px-6 pb-16 pt-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Meus dados</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Veja o que o PQF guarda sobre você e baixe uma cópia. Como tratamos esses dados está na{' '}
            <Link href="/privacidade" className="font-bold text-blue-600 underline">Política de Privacidade</Link>.
          </p>
        </div>

        {carregando && <p role="status" className="text-sm text-slate-400">Carregando seus dados...</p>}

        {precisaLogin && (
          <Cartao titulo="Entre na sua conta">
            <p className="text-sm text-slate-600">Para ver e baixar seus dados, entre na sua conta.</p>
            <Link href="/login" className="inline-block rounded-2xl bg-blue-600 px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-white">
              Entrar
            </Link>
          </Cartao>
        )}

        {erro && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{erro}</p>}

        {dados && (
          <>
            <Cartao titulo="Sua conta">
              <dl className="space-y-1 text-sm text-slate-700">
                <div className="flex justify-between gap-4"><dt className="text-slate-400">E-mail</dt><dd className="font-semibold">{dados.conta?.email ?? '—'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Conta criada em</dt><dd className="font-semibold">{formatarData(dados.conta?.criada_em)}</dd></div>
              </dl>
            </Cartao>

            <Cartao titulo="O que guardamos">
              {resumo.length === 0 ? (
                <p className="text-sm text-slate-500">Ainda não há dados além da conta.</p>
              ) : (
                <ul className="divide-y divide-slate-50 text-sm text-slate-700">
                  {resumo.map(item => (
                    <li key={item.chave} className="flex items-center justify-between py-2.5">
                      <span>{item.rotulo}</span>
                      <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">{item.quantidade}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] leading-relaxed text-slate-400">
                Dados de outras pessoas, como nome e WhatsApp dos clientes dos seus projetos, não entram na cópia, porque pertencem a elas.
              </p>
            </Cartao>

            <Cartao titulo="Seus aceites">
              {dados.consentimentos.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum aceite registrado ainda.</p>
              ) : (
                <ul className="divide-y divide-slate-50 text-sm text-slate-700">
                  {dados.consentimentos.map((c, i) => (
                    <li key={`${c.tipo}-${c.aceito_em}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                      <span>{ROTULO_CONSENTIMENTO[c.tipo] ?? c.tipo}</span>
                      <span className="text-[11px] text-slate-400">versão {c.versao_documento} · {formatarData(c.aceito_em)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>

            <Cartao titulo="O que você pode fazer">
              <button
                type="button"
                onClick={baixar}
                className="w-full rounded-[2rem] bg-blue-600 py-5 text-[12px] font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
              >
                Baixar meus dados (JSON)
              </button>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/titular" className="font-bold text-blue-600 underline">Corrigir, me opor ou fazer outro pedido</Link>
                <Link href="/confirmar-exclusao" className="font-bold text-red-600 underline">Excluir minha conta</Link>
              </div>
            </Cartao>
          </>
        )}
      </div>
    </main>
  )
}
