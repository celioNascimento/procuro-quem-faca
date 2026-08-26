// components/home/CTAPrestadorSkeleton.tsx

export default function CTAPrestadorSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 w-full px-5 py-4 md:px-8 md:py-5 rounded-[2rem] border border-slate-200/80 bg-white/60 backdrop-blur-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-slate-100 shrink-0" />
        <div className="text-left space-y-2">
          <div className="h-2.5 w-32 md:w-40 rounded bg-slate-100" />
          <div className="h-3 w-40 md:w-52 rounded bg-slate-200" />
        </div>
      </div>
      <div className="w-4 h-4 rounded-full bg-slate-100 shrink-0" />
    </div>
  )
}
