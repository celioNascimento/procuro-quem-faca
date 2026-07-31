// app/(admin)/admin/povoar/page.tsx

'use client'
import { usePovoar } from '@/hooks/usePovoar'

export default function PovoarApp() {
  const { cidades, grupos, categorias, regioes, loading, checkLoading, existe, msg, form, setForm, handleFoneChange, handleSubmit } = usePovoar()

  const inputStyle = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm text-slate-800 placeholder:text-slate-300"
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3 mb-1 block italic"

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 pb-20 pt-10">
      <header className="border-b border-slate-100 pb-8">
        <h1 className="text-3xl font-black text-slate-900 italic uppercase">Povoar<span className="text-indigo-600">.DB</span></h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Painel Administrativo de Curadoria</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="md:col-span-2">
            <label className={labelClass}>Nome Completo / Empresa</label>
            <input required value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))} className={inputStyle} placeholder="Ex: João da Pintura" />
          </div>

          <div>
            <label className={labelClass}>1. Grupo de Atuação</label>
            <select required value={form.grupo_id} onChange={e => setForm(prev => ({ ...prev, grupo_id: e.target.value, categoria_id: '' }))} className={`${inputStyle} border-indigo-100 bg-indigo-50/20`}>
              <option value="">Selecione o Grupo...</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>2. Profissão / Categoria</label>
            <select required disabled={!form.grupo_id} value={form.categoria_id} onChange={e => setForm(prev => ({ ...prev, categoria_id: e.target.value }))} className={inputStyle}>
              <option value="">{form.grupo_id ? "Selecione a Profissão..." : "Escolha um grupo primeiro"}</option>
              {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Cidade Sede</label>
            <select required value={form.cidade_id} onChange={e => setForm(prev => ({ ...prev, cidade_id: e.target.value }))} className={inputStyle}>
              <option value="">Selecione...</option>
              {cidades.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Região (Opcional)</label>
            <select value={form.regiao_id} onChange={e => setForm(prev => ({ ...prev, regiao_id: e.target.value }))} className={inputStyle}>
              <option value="">Automático via Cidade</option>
              {regioes.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>

          <div className="relative">
            <label className={labelClass}>WhatsApp</label>
            <input required value={form.whatsapp} onChange={e => handleFoneChange(e.target.value)} className={`${inputStyle} ${existe ? 'border-red-200 bg-red-50 text-red-600' : ''}`} placeholder="(00) 00000-0000" />
            {checkLoading && <div className="absolute right-4 bottom-4 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          <div>
            <label className={labelClass}>Bairro (Opcional)</label>
            <input value={form.bairro} onChange={e => setForm(prev => ({ ...prev, bairro: e.target.value }))} className={inputStyle} placeholder="Ex: Centro" />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Bio (Pública)</label>
            <textarea value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} className={inputStyle + " h-24 resize-none"} />
          </div>
        </div>

        {msg.texto && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center ${msg.tipo === 'sucesso' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {msg.texto}
          </div>
        )}

        <button disabled={loading || existe || checkLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-[0.98] disabled:opacity-50 transition-all">
          {loading ? 'Salvando...' : existe ? 'WhatsApp Duplicado' : 'Inserir Profissional'}
        </button>
      </form>
    </div>
  )
}
