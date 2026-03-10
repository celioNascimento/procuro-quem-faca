'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PovoarApp() {
  const [cidades, setCidades] = useState([])
  const [grupos, setGrupos] = useState([])
  const [categorias, setCategorias] = useState([]) 
  const [regioes, setRegioes] = useState([])
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [existe, setExiste] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })

  const initialFormState = {
    nome: '',
    categoria_id: '', 
    grupo_id: '',     
    cidade_id: '',
    regiao_id: '',    
    estado_sigla: 'PR', 
    bairro: '',
    whatsapp: '',
    bio: 'Profissional qualificado disponível para atendimentos na região.',
    cidades_atendidas: [] // Garantindo inicialização da array
  }

  const [form, setForm] = useState(initialFormState)

  useEffect(() => {
    async function carregarDadosIniciais() {
      const [resCidades, resGrupos, resRegioes] = await Promise.all([
        supabase.from('cidades').select('*').order('nome'),
        supabase.from('categorias_grupos').select('*').order('nome'),
        supabase.from('regioes').select('*').order('nome')
      ])
      setCidades(resCidades.data || [])
      setGrupos(resGrupos.data || [])
      setRegioes(resRegioes.data || [])
    }
    carregarDadosIniciais()
  }, [])

  useEffect(() => {
    async function carregarCategorias() {
      if (!form.grupo_id) {
        setCategorias([])
        return
      }
      const { data } = await supabase
        .from('categorias')
        .select('*')
        .eq('grupo_id', form.grupo_id)
        .order('nome')
      setCategorias(data || [])
    }
    carregarCategorias()
  }, [form.grupo_id])

  useEffect(() => {
    const cidadeSel = cidades.find(c => String(c.id) === String(form.cidade_id))
    if (cidadeSel) {
      setForm(prev => ({
        ...prev,
        regiao_id: cidadeSel.regiao_id || prev.regiao_id,
        estado_sigla: cidadeSel.estado_sigla || prev.estado_sigla
      }))
    }
  }, [form.cidade_id, cidades])

  const aplicarMascaraFone = (valor) => {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)
  }

  const handleFoneChange = (e) => {
    setForm({ ...form, whatsapp: aplicarMascaraFone(e.target.value) })
  }

  useEffect(() => {
    const validarDuplicado = async () => {
      const foneLimpo = form.whatsapp.replace(/\D/g, '')
      if (foneLimpo.length < 10) { setExiste(false); return }
      setCheckLoading(true)
      const { data } = await supabase.from('prestadores').select('id, nome').eq('whatsapp', foneLimpo).maybeSingle()
      if (data) {
        setExiste(true)
        setMsg({ tipo: 'erro', texto: `⚠️ Conflito: ${data.nome} já cadastrado.` })
      } else {
        setExiste(false)
        if (msg.tipo === 'erro') setMsg({ tipo: '', texto: '' })
      }
      setCheckLoading(false)
    }
    const timer = setTimeout(validarDuplicado, 600)
    return () => clearTimeout(timer)
  }, [form.whatsapp])

  // --- ALTERAÇÃO CIRÚRGICA: handleSubmit Normalizado ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existe || loading) return;
    setLoading(true);

    const foneLimpo = form.whatsapp.replace(/\D/g, '');
    const nomeCategoria = categorias.find(c => c.id === form.categoria_id)?.nome || '';
    
    // --- NORMALIZAÇÃO DE CIDADES ---
    // Identifica o nome da cidade sede selecionada
    const cidadeSedeNome = cidades.find(c => String(c.id) === String(form.cidade_id))?.nome;
    
    // Filtra para que a sede não entre na lista de extras e remove duplicatas/vazios
    const cidadesAtendidasLimpo = [...new Set(form.cidades_atendidas || [])]
      .filter(nome => nome !== cidadeSedeNome && nome !== "");
    // -------------------------------

    const slugBase = form.nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      .concat(`-${Math.floor(Math.random() * 1000)}`);

    try {
      const { error } = await supabase.from('prestadores').insert([{
        ...form,
        cidades_atendidas: cidadesAtendidasLimpo, // Enviando dado padronizado
        categoria: nomeCategoria,
        whatsapp: foneLimpo,
        slug: slugBase,
        status: 'ativo',
        origem_tipo: 'curadoria_publica',
        verificado: false,
        aprovado_em: new Date().toISOString(),
        foto_perfil: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nome)}&background=random&color=fff&size=200`
      }]);
      
      if (error) throw error;
      
      setMsg({ tipo: 'sucesso', texto: '✅ Profissional inserido com sucesso!' })
      setForm(initialFormState)
      setExiste(false)
      setTimeout(() => setMsg({ tipo: '', texto: '' }), 4000)
    } catch (err) {
      setMsg({ tipo: 'erro', texto: '❌ Erro: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = "w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm text-slate-800 placeholder:text-slate-300";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-3 mb-1 block italic";

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
            <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inputStyle} placeholder="Ex: João da Pintura" />
          </div>

          <div>
            <label className={labelClass}>1. Grupo de Atuação</label>
            <select required value={form.grupo_id} onChange={e => setForm({...form, grupo_id: e.target.value, categoria_id: ''})} className={`${inputStyle} border-indigo-100 bg-indigo-50/20`}>
              <option value="">Selecione o Grupo...</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>2. Profissão / Categoria</label>
            <select required disabled={!form.grupo_id} value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})} className={inputStyle}>
              <option value="">{form.grupo_id ? "Selecione a Profissão..." : "Escolha um grupo primeiro"}</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Cidade Sede</label>
            <select required value={form.cidade_id} onChange={e => setForm({...form, cidade_id: e.target.value})} className={inputStyle}>
              <option value="">Selecione...</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Região (Opcional)</label>
            <select value={form.regiao_id} onChange={e => setForm({...form, regiao_id: e.target.value})} className={inputStyle}>
              <option value="">Automático via Cidade</option>
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className={labelClass}>WhatsApp</label>
            <input required value={form.whatsapp} onChange={handleFoneChange} className={`${inputStyle} ${existe ? 'border-red-200 bg-red-50 text-red-600' : ''}`} placeholder="(00) 00000-0000" />
            {checkLoading && <div className="absolute right-4 bottom-4 w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          <div>
            <label className={labelClass}>Bairro (Opcional)</label>
            <input value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} className={inputStyle} placeholder="Ex: Centro" />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Bio (Pública)</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className={inputStyle + " h-24 resize-none"} />
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
