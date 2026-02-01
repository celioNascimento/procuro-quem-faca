'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'

export default function PovoarApp() {
  const [cidades, setCidades] = useState([])
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [existe, setExiste] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  // Valor inicial para facilitar o reset
  const initialFormState = {
    nome: '',
    categoria: '',
    cidade_id: '',
    bairro: '',
    whatsapp: '',
    bio: 'Profissional qualificado disponível para atendimentos na região.'
  }

  const [form, setForm] = useState(initialFormState)

  useEffect(() => {
    async function carregarCidades() {
      const { data } = await supabase.from('cidades').select('*').order('nome')
      setCidades(data || [])
    }
    carregarCidades()
  }, [])

  const aplicarMascaraFone = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const handleFoneChange = (e) => {
    const valorComMascara = aplicarMascaraFone(e.target.value)
    setForm({ ...form, whatsapp: valorComMascara })
  }

  useEffect(() => {
    const validarDuplicado = async () => {
      const foneLimpo = form.whatsapp.replace(/\D/g, '')
      if (foneLimpo.length < 10) {
        setExiste(false)
        return
      }

      setCheckLoading(true)
      const { data } = await supabase
        .from('prestadores')
        .select('id, nome')
        .eq('whatsapp', foneLimpo)
        .maybeSingle()

      if (data) {
        setExiste(true)
        setMsg({ tipo: 'erro', texto: `⚠️ Conflito: ${data.nome} já usa este número.` })
      } else {
        setExiste(false)
        if (msg.tipo === 'erro' && msg.texto.includes('Conflito')) setMsg({ tipo: '', texto: '' })
      }
      setCheckLoading(false)
    }

    const timer = setTimeout(validarDuplicado, 600)
    return () => clearTimeout(timer)
  }, [form.whatsapp])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (existe) return
    
    setLoading(true)
    const foneLimpo = form.whatsapp.replace(/\D/g, '')

    const cidadeNome = cidades.find(c => String(c.id) === String(form.cidade_id))?.nome || ''
    const slugBase = `${form.nome} ${cidadeNome}`.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')

    try {
      const { error } = await supabase.from('prestadores').insert([{
        ...form,
        whatsapp: foneLimpo,
        slug: slugBase,
        status: 'ativo',
        origem_tipo: 'curadoria_publica',
        verificado: false,
        aprovado_em: new Date().toISOString(),
        foto_perfil: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nome)}&background=random&size=200`
      }])

      if (error) throw error

      setMsg({ tipo: 'sucesso', texto: '✅ Profissional mapeado com sucesso!' })
      
      // RESET COMPLETO DOS CAMPOS
      setForm(initialFormState)
      setExiste(false)

      if (navigator.vibrate) navigator.vibrate(50)
      
      // Limpa a mensagem de sucesso após 4 segundos para o próximo cadastro
      setTimeout(() => setMsg({ tipo: '', texto: '' }), 4000)

    } catch (err) {
      setMsg({ tipo: 'erro', texto: '❌ Erro: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-sm text-slate-800 placeholder:text-slate-300";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3 mb-1 block italic";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0 pb-20">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
              <span className="text-white font-black text-xs">P</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Povoar<span className="text-indigo-600 not-italic">.DB</span></h1>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Curadoria e Expansão de Base</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="md:col-span-2">
            <label className={labelClass}>Nome do Profissional ou Empresa</label>
            <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputClass} placeholder="Ex: Marmoraria Real" />
          </div>

          <div>
            <label className={labelClass}>Categoria Core</label>
            <select required value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className={inputClass}>
              <option value="">Selecione...</option>
              {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Cidade de Operação</label>
            <select required value={form.cidade_id} onChange={e => setForm({...form, cidade_id: e.target.value})} className={inputClass}>
              <option value="">Selecione...</option>
              {cidades.map(c => <option key={c.id} value={c.id}>{c.nome} - {c.estado_sigla}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Bairro / Região</label>
            <input value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} className={inputClass} placeholder="Ex: Higienópolis" />
          </div>

          <div className="relative">
            <label className={labelClass}>WhatsApp Comercial</label>
            <input required value={form.whatsapp} onChange={handleFoneChange} className={`${inputClass} ${existe ? 'border-red-300 ring-red-50 bg-red-50 text-red-600' : ''}`} placeholder="(00) 00000-0000" />
            {checkLoading && <div className="absolute right-4 bottom-4 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Bio de Curadoria (Pública)</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className={inputClass + " h-24 resize-none"} />
          </div>
        </div>

        {msg.texto && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center animate-in zoom-in-95 ${msg.tipo === 'sucesso' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {msg.texto}
          </div>
        )}

        <button 
          disabled={loading || existe || checkLoading}
          className={`w-full py-5 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 ${existe ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
        >
          {loading ? 'Processando...' : existe ? 'Bloqueado: Duplicado' : 'Inserir Profissional'}
        </button>
      </form>

      <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-center gap-6">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0">🤝</div>
        <div>
          <h4 className="text-indigo-900 font-black uppercase text-[11px] italic mb-1">Estratégia de Aquisição</h4>
          <p className="text-indigo-700/70 text-[10px] font-bold leading-relaxed uppercase">
            Estes perfis alimentam a busca imediata. O selo <span className="underline">Info Pública</span> protege a plataforma e convida o dono real a assumir a gestão da conta.
          </p>
        </div>
      </div>
    </div>
  )
}