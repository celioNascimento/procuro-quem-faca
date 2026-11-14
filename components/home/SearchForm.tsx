//components/home/SearchForm.tsx
//
// Campo de busca da home. Sem foco automático no celular: ele abria o teclado na hora, cobria as
// sugestões e rolava a página. Em computador (mouse), o foco continua automático.

'use client'
import { useEffect, useRef } from 'react'

type Props = {
  busca: string
  setBusca: (valor: string) => void
  onSubmit: (e: React.FormEvent | null, termo: string) => void
  temErro: boolean
}

export default function SearchForm({ busca, setBusca, onSubmit, temErro }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // pointer: fine = mouse/trackpad (computador). Celular e tablet (toque) não recebem foco automático.
    if (window.matchMedia?.('(pointer: fine)').matches) {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [])

  function handleSubmitInterno(e: React.FormEvent) {
    e.preventDefault()
    const valorReal = inputRef.current?.value || ''
    onSubmit(e, valorReal)
  }

  return (
    <form onSubmit={handleSubmitInterno} role="search" className="w-full flex flex-col items-center gap-4 group">
      <div className="w-full relative">
        <div className={`absolute -inset-1 rounded-[2.2rem] blur opacity-10 transition-opacity duration-500 ${
          temErro ? 'bg-red-500' : 'bg-blue-600'
        }`} />

        <input
          ref={inputRef}
          type="text"
          name="q"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="O que você procura?"
          aria-invalid={temErro}
          aria-describedby={temErro ? 'erro-busca' : undefined}
          placeholder="Ex: pedreiro em Londrina"
          value={busca || ''}
          onChange={e => setBusca(e.target.value)}
          className={`relative w-full h-16 md:h-[72px] pl-8 pr-8 md:pr-48 rounded-[2.2rem] border shadow-2xl outline-none text-lg md:text-xl transition-all duration-300 font-medium placeholder:text-slate-500 ${
            temErro
              ? 'border-red-400 bg-white text-slate-700 shadow-red-100'
              : 'border-slate-200 bg-white text-slate-700 focus:border-blue-500 shadow-blue-900/5'
          }`}
        />

        <button
          type="submit"
          className="hidden md:block absolute right-3 top-3 bottom-3 bg-blue-600 text-white px-12 rounded-[1.7rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Buscar
        </button>
      </div>

      {temErro && (
        <p id="erro-busca" role="alert" className="text-sm font-semibold text-red-700">
          Digite o que você procura. Por exemplo: pedreiro.
        </p>
      )}

      <button
        type="submit"
        className="md:hidden w-40 min-h-12 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        Buscar
      </button>
    </form>
  )
}
