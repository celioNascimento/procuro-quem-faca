'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GestaoHabilidades() {
  const [habilidades, setHabilidades] = useState([])
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Manutenção')
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    setLoading(true)
    const { data } = await supabase.from('habilidades').select('*').order('nome')
    setHabilidades(data || [])
    setLoading(false)
  }

  async function adicionarHabilidade(e) {
    e.preventDefault()
    if (!nome) return

    const { error: habError } = await supabase
      .from('habilidades')
      .insert([{ nome, categoria }])

    if (!habError) {
      await supabase.from('logs_atividades').insert([{
        usuario_email: 'admin@teste.com',
        acao: 'CRIAR_HABILIDADE',
        detalhes: { nome, categoria }
      }])
      setNome('')
      carregarDados()
    } else {
      alert("Habilidade já cadastrada.")
    }
  }

  // Estilos reutilizáveis para manter o código limpo
  const inputStyle = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-sm";

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-slate-900 font-sans antialiased pb-20">
      
      {/* HEADER MINIMALISTA */}
      <header className="max-w-6xl mx-auto px-8 pt-12 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 italic">
            Skills<span className="text-indigo-600 not-italic">.Hub</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-1 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-indigo-600"></span> Catálogo de Serviços Oficiais
          </p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativos: {habilidades.length}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO ESQUERDO: FORMULÁRIO (4 Colunas) */}
        <div className="lg:col-span-4 sticky top-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Novo Registro
            </h2>
            
            <form onSubmit={adicionarHabilidade} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão / Skill</label>
                <input 
                  value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Eletricista" 
                  className={inputStyle}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Grupo</label>
                <select 
                  value={categoria} onChange={e => setCategoria(e.target.value)}
                  className={inputStyle}
                >
                  <option value="Manutenção">🔧 Manutenção</option>
                  <option value="Construção">🏗️ Construção</option>
                  <option value="Beleza">✨ Beleza</option>
                  <option value="Tecnologia">💻 Tecnologia</option>
                </select>
              </div>

              <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 group">
                Salvar Habilidade
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </form>
          </div>
        </div>

        {/* LADO DIREITO: GRID DE CARDS (8 Colunas) */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Habilidades no Ar</h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-full mb-4"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizando Cloud...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {habilidades.map(h => (
                  <div 
                    key={h.id} 
                    className="relative overflow-hidden p-5 bg-white border border-slate-100 rounded-2xl flex flex-col items-start transition-all hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 group"
                  >
                    {/* Badge de Categoria */}
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                      <span className="text-[18px]">
                        {h.categoria === 'Tecnologia' && '💻'}
                        {h.categoria === 'Manutenção' && '🔧'}
                        {h.categoria === 'Construção' && '🏗️'}
                        {h.categoria === 'Beleza' && '✨'}
                      </span>
                    </div>

                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 mb-2 bg-indigo-50 px-2 py-0.5 rounded">
                      {h.categoria}
                    </span>
                    <span className="text-[13px] font-black text-slate-800 uppercase tracking-tight italic">
                      {h.nome}
                    </span>
                    
                    {/* Linha decorativa de progresso fake (estética SaaS) */}
                    <div className="w-full h-1 bg-slate-50 mt-4 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-indigo-100 group-hover:bg-indigo-400 transition-all"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && habilidades.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">
                <p className="font-black uppercase text-[10px] tracking-widest">O catálogo está vazio</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}