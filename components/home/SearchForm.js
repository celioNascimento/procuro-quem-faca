'use client'
import { useRef } from 'react';

export default function SearchForm({ busca, setBusca, onSubmit, temErro }) {
  const inputRef = useRef(null);

  const handleSubmitInterno = (e) => {
    e.preventDefault();
    const valorReal = inputRef.current?.value || "";
    if (onSubmit) onSubmit(e, valorReal);
  };

  return (
    <form onSubmit={handleSubmitInterno} className="w-full flex flex-col items-center gap-4 group mb-12">
      <div className="w-full relative">
        {/* Glow sutil: Vermelho apenas se houver erro, senão azul padrão */}
        <div className={`absolute -inset-1 rounded-[2.2rem] blur opacity-10 transition-opacity duration-500 ${
          temErro ? 'bg-red-500' : 'bg-blue-600'
        }`}></div>

        <input
          ref={inputRef}
          type="text"
          // O Placeholder muda para indicar o que falta
          placeholder={temErro ? "Digite algo para buscar..." : "O que você precisa hoje?"}
          value={busca || ''}
          onChange={(e) => setBusca(e.target.value)}
          className={`relative w-full h-16 md:h-20 pl-8 pr-8 md:pr-44 rounded-[2.2rem] border shadow-2xl outline-none text-lg md:text-xl transition-all duration-300 font-medium ${
            temErro 
              ? 'border-red-400 bg-white placeholder:text-red-400 shadow-red-100' 
              : 'border-slate-200 bg-white text-slate-700 focus:border-blue-500 shadow-blue-900/5'
          }`}
        />

        <button 
          type="submit" 
          className="hidden md:block absolute right-2.5 top-2.5 bottom-2.5 bg-blue-600 text-white px-10 rounded-[1.7rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all active:scale-95"
        >
          BUSCAR
        </button>
      </div>

      <button 
        type="submit" 
        className="md:hidden w-40 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-200 active:scale-95"
      >
        BUSCAR
      </button>
    </form>
  );
}