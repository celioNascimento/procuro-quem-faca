//components/skeletons/PerfilSkeleton.tsx
//
// Esqueleto do perfil público. Segue a página de verdade (PerfilPublicoClient): na esquerda o cartão do
// profissional, as ações e o botão do WhatsApp; na direita a faixa de anúncio, "Sobre" e as abas.
// Mesmas larguras de coluna, mesmos recuos do topo e mesmos raios, para nada pular quando o perfil chega.
// Mudou o layout da página? Ajuste aqui também.

import Header from '@/components/Header'
import { Skeleton } from '@/components/skeletons/Skeleton'

export default function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800" aria-busy="true" aria-label="Carregando perfil público">
      <Header href="/prestadores" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-24 md:pt-26 lg:px-8 lg:pb-8 2xl:max-w-[96rem] 2xl:px-12">
        <div className="grid items-start gap-6 motion-safe:animate-pulse lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-14 2xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">

          {/* Coluna do profissional */}
          <aside className="min-w-0">
            <div className="flex flex-col gap-4 lg:gap-5">
              {/* Cartão: foto/ícone e nome lado a lado no celular, empilhados no desktop */}
              <div className="flex flex-col gap-3">
                <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center gap-4 bg-slate-50 px-5 py-5 lg:flex-col lg:items-stretch lg:px-6">
                    <Skeleton className="h-28 w-32 shrink-0 rounded-2xl md:h-36 md:w-44 lg:h-[clamp(6rem,19vh,13rem)] lg:w-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2 lg:items-center">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 bg-slate-100" />
                    </div>
                  </div>
                  <div className="flex items-center border-t border-slate-100 px-5 py-3 lg:justify-center">
                    <Skeleton className="h-4 w-24 bg-slate-100" />
                  </div>
                </div>

                {/* Denunciar / Compartilhar */}
                <div className="flex gap-2">
                  <div className="h-11 flex-1 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm" />
                  <div className="h-11 flex-1 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm" />
                </div>
              </div>

              {/* Botão do WhatsApp */}
              <Skeleton className="h-14 w-full rounded-[2rem] bg-blue-100/60" />

              {/* Confiança */}
              <div className="hidden flex-col gap-3 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:flex">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/2 bg-slate-100" />
                <Skeleton className="h-3 w-3/5 bg-slate-100" />
              </div>
            </div>
          </aside>

          {/* Coluna de conteúdo */}
          <div className="flex min-w-0 flex-col gap-7 sm:gap-8 lg:gap-10">
            {/* Faixa de anúncio */}
            <div className="h-14 w-full rounded-2xl border border-zinc-100 bg-zinc-50" />

            {/* Sobre */}
            <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-full bg-slate-100" />
              <Skeleton className="h-4 w-4/5 bg-slate-100" />
            </div>

            {/* Abas + conteúdo */}
            <div className="flex flex-col gap-5">
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-square rounded-2xl border border-slate-100 bg-white shadow-sm" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
