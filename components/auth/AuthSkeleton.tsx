//components/auth/AuthSkeleton.tsx

'use client'

export default function AuthSkeleton() {
  return (
    <div className="w-full max-w-[420px] bg-white p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden animate-pulse">
      
      {/* Glow Placeholder sutil no topo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100/50" />

      {/* Logo Placeholder */}
      <div className="flex justify-center mb-8">
        <div className="w-32 h-14 bg-slate-100 rounded-2xl" />
      </div>

      {/* Título e Subtítulo */}
      <div className="h-6 w-3/4 bg-slate-100 rounded-lg mx-auto mb-3" />
      <div className="h-3 w-1/2 bg-slate-50 rounded-lg mx-auto mb-10" />

      <div className="space-y-6">
        {/* Google Button Placeholder */}
        <div className="w-full h-14 bg-slate-50 rounded-[1.25rem]" />

        {/* Divisor */}
        <div className="flex items-center gap-4 my-10">
          <div className="h-[1px] flex-grow bg-slate-100" />
          <div className="w-10 h-2 bg-slate-100 rounded" />
          <div className="h-[1px] flex-grow bg-slate-100" />
        </div>

        {/* Inputs Form */}
        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <div className="w-12 h-2 bg-slate-100 rounded ml-4" />
            <div className="w-full h-14 bg-slate-50 rounded-[1.25rem]" />
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-2 bg-slate-100 rounded ml-4" />
            <div className="w-full h-14 bg-slate-50 rounded-[1.25rem]" />
          </div>
        </div>

        {/* Button Placeholder */}
        <div className="w-full h-14 bg-blue-50 rounded-[1.25rem] mt-4" />
      </div>

      {/* Footer Link */}
      <div className="mt-12 w-24 h-2 bg-slate-100 rounded-full mx-auto" />
    </div>
  )
}
