import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Quem Somos',
  description: 'Conheça o Procuro Quem Faça, a plataforma que aproxima clientes de profissionais de confiança.',
}

export default function QuemSomos() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-16 pt-24 text-slate-800 md:px-20 md:pb-20 md:pt-36">
      <Header href="/" />

      <div className="mx-auto max-w-3xl rounded-[3rem] border border-slate-100 bg-white p-8 shadow-sm md:p-16">
        <article>
          <h1 className="mb-8 text-3xl font-black text-slate-900 md:text-4xl">Quem somos</h1>

          <div className="flex flex-col gap-6 text-slate-600 leading-relaxed">
            <p>
              O Procuro Quem Faça nasceu de uma ideia simples: dar ao bom profissional a mesma visibilidade de quem tem uma estrutura maior por trás — para que a qualidade do trabalho seja o que realmente faz a diferença.
            </p>

            <p>
              Sabemos como é difícil, hoje, encontrar um prestador de confiança. Grupos de WhatsApp e indicações informais funcionam, mas não mostram histórico, nem experiência de quem já contratou antes. Do lado do profissional, também não há espaço justo: um trabalho excelente e um inconsistente aparecem do mesmo jeito.
            </p>

            <p>
              Por isso criamos uma plataforma simples, sem cadastro complicado e sem intermediário — você encontra o profissional certo, fala direto pelo WhatsApp, e ajuda outros moradores com sua avaliação depois do serviço.
            </p>

            <p>
              Estamos começando em Londrina, crescendo aos poucos, com atenção a cada detalhe. Se você é cliente ou prestador, obrigado por fazer parte dessa construção com a gente.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/prestadores"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95"
            >
              Buscar prestador
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-700 transition-all hover:border-blue-200 hover:text-blue-600 active:scale-95"
            >
              Cadastre-se gratuitamente
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}
