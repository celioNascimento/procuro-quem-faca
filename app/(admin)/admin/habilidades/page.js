'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GestaoHabilidades() {
  const [habilidades, setHabilidades] = useState([])
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Manutenção')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

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
      // O log continua sendo gravado no banco, mas não polui esta tela
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

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10 bg-slate-50 min-h-screen text-slate-900">
      <header>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Habilidades</h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Catálogo de Serviços Oficiais</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Cadastro (1 Coluna) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest">Adicionar Nova</h2>
          <form onSubmit={adicionarHabilidade} className="space-y-3">
            <input 
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Nome da profissão" 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select 
              value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none"
            >
              <option value="Manutenção">Manutenção</option>
              <option value="Construção">Construção</option>
              <option value="Beleza">Beleza</option>
              <option value="Tecnologia">Tecnologia</option>
            </select>
            <button className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all">
              Salvar Habilidade
            </button>
          </form>
        </div>

        {/* Visualização da Lista (2 Colunas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Habilidades Ativas</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {habilidades.map(h => (
              <div key={h.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors group">
                <span className="text-[8px] font-black text-blue-500 uppercase mb-1 opacity-50">{h.categoria}</span>
                <span className="text-[11px] font-black text-slate-700 uppercase">{h.nome}</span>
              </div>
            ))}
          </div>

          {habilidades.length === 0 && (
            <p className="text-center text-slate-400 font-bold py-10 uppercase text-xs">Nenhuma habilidade cadastrada.</p>
          )}
        </div>

      </div>
    </div>
  )
}