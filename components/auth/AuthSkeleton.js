'use client'

export default function AuthSkeleton() {
  return (
    /* Ajuste Cirúrgico: Mantemos o wrapper flex-grow para ocupar o espaço do layout,
       mas garantimos que a div fixa seja renderizada de forma idêntica no servidor e cliente.
    */
    <div className="flex-grow flex flex-col">
      <div 
        className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex flex-col items-center justify-center p-6 pointer-events-auto"
        aria-hidden="true"
      >
        {/* Logo Placeholder */}
        <div className="w-32 h-14 bg-slate-200/60 rounded-2xl mb-8 animate-pulse" />
        
        {/* Card Placeholder */}
        <div className="w-full max-w-[400px] bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 animate-pulse">
          <div className="flex flex-col items-center mb-8">
            <div className="w-40 h-8 bg-slate-100 rounded-xl mb-3" />
            <div className="w-48 h-3 bg-slate-50 rounded-lg" />
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-2 bg-slate-100 rounded ml-4" />
              <div className="w-full h-14 bg-slate-50/80 rounded-2xl border border-slate-50" />
            </div>
            
            <div className="space-y-2">
              <div className="w-12 h-2 bg-slate-100 rounded ml-4" />
              <div className="w-full h-14 bg-slate-50/80 rounded-2xl border border-slate-50" />
            </div>
            
            <div className="w-full h-14 bg-slate-200/50 rounded-2xl mt-4" />
          </div>
        </div>

        {/* Back Link Placeholder */}
        <div className="mt-10 w-32 h-3 bg-slate-100 rounded-full animate-pulse" />
      </div>
    </div>
  )
}