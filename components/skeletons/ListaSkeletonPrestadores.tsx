export function ListaSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-5 md:px-6 space-y-4 pt-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-full h-32 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse" />
      ))}
    </div>
  )
}