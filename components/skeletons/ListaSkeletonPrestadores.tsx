export function ListaSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-6 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-full h-32 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
      ))}
    </div>
  )
}
