'use client'

interface PreferenciaFotosProps {
  valor: boolean
  onChange: (valor: boolean) => void
  modo?: 'cadastro' | 'edicao'
}

export function PreferenciaFotos({ valor, onChange, modo = 'edicao' }: PreferenciaFotosProps) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Portfólio</p>
      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">Fotos por padrão</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {valor
          ? 'Ao criar um serviço, “com registro fotográfico” aparece selecionado. Você pode trocar para “sem fotos” em cada serviço.'
          : 'Ao criar um serviço, “sem fotos” aparece selecionado. Você pode trocar para “com registro fotográfico” em cada serviço.'}
      </p>
      {modo === 'cadastro' && (
        <p className="mt-2 text-xs font-semibold text-slate-500">Essa é apenas a escolha inicial; ela não obriga fotos em nenhum serviço.</p>
      )}
      <button type="button" onClick={() => onChange(!valor)} className={`mt-5 rounded-xl px-5 py-3 text-sm font-bold transition ${valor ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
        {valor ? 'Começar com fotos' : 'Começar sem fotos'}
      </button>
    </section>
  )
}
