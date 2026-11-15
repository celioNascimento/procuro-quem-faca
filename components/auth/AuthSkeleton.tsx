//components/auth/AuthSkeleton.tsx

'use client'

// Espelha a tela de login (app/login/page.tsx): mesmas larguras por breakpoint,
// mesmo espaçamento e mesma ordem de blocos, para a tela não pular ao carregar.
export default function AuthSkeleton() {
  return (
    <div className="w-full max-w-[420px] md:max-w-[480px] lg:max-w-[560px] bg-white px-8 pt-8 pb-10 md:px-12 md:pt-10 md:pb-12 lg:px-16 lg:pt-14 lg:pb-16 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden animate-pulse">

      {/* Barra decorativa topo */}
      <div className="absolute top-0 left-0 right-0 h-1 md:h-1.5 bg-slate-100/60" />

      {/* Logo */}
      <div className="flex justify-center mb-5 lg:mb-6">
        <div className="aspect-[3/1] w-56 md:w-64 lg:w-72 max-w-full bg-slate-100 rounded-2xl" />
      </div>

      {/* Título */}
      <div className="h-6 lg:h-8 w-3/4 bg-slate-100 rounded-lg mx-auto mb-2 lg:mb-3" />

      {/* Subtítulo "Área do Profissional" */}
      <div className="h-3.5 w-1/3 bg-slate-100 rounded mx-auto mb-2 lg:mb-3" />

      {/* Texto de apoio */}
      <div className="space-y-2 mb-7 lg:mb-9">
        <div className="h-3.5 w-4/5 bg-slate-100 rounded mx-auto" />
        <div className="h-3.5 w-3/5 bg-slate-100 rounded mx-auto" />
      </div>

      {/* Botão Google */}
      <div className="w-full h-[52px] lg:h-14 bg-slate-100 rounded-3xl" />

      {/* Divisor */}
      <div className="flex items-center gap-4 my-6 lg:my-8">
        <div className="h-px flex-grow bg-slate-200" />
        <div className="w-16 h-3 bg-slate-100 rounded" />
        <div className="h-px flex-grow bg-slate-200" />
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-4 lg:gap-5 text-left">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          <div className="w-12 h-3 bg-slate-100 rounded ml-1" />
          <div className="w-full h-[52px] lg:h-16 bg-slate-100 rounded-[1.25rem]" />
        </div>

        <div className="flex flex-col gap-1.5 lg:gap-2">
          <div className="flex justify-between items-center ml-1 mr-1">
            <div className="w-14 h-3 bg-slate-100 rounded" />
            <div className="w-28 h-3 bg-slate-100 rounded" />
          </div>
          <div className="w-full h-[52px] lg:h-16 bg-slate-100 rounded-[1.25rem]" />
        </div>

        {/* Botão principal */}
        <div className="w-full h-[52px] lg:h-16 bg-blue-100 rounded-[1.5rem] mt-2 lg:mt-4" />
      </div>

      {/* Link de voltar */}
      <div className="mx-auto mt-6 lg:mt-8 w-40 h-3.5 bg-slate-100 rounded-full" />
    </div>
  )
}
