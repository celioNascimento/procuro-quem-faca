'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PainelAnunciantePage() {
  const [campanhas, setCampanhas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoCriacao, setModoCriacao] = useState(false)
  const [progressoUpload, setProgressoUpload] = useState(0)

  // Estados do form
  const [form, setForm] = useState({
    titulo: '',
    link_destino: '',
    imagem_url: '',
    estado_sigla: '',
    cidade_id: '',
    categoria_id: '',
    lance_maximo_cpc: '',
    orcamento_diario: ''
  })

  async function fetchMinhasCampanhas() {
    setLoading(true)
    // O filtro aqui será pelo anunciante logado (anunciante_id)
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false })
    if (data) setCampanhas(data)
    setLoading(false)
  }

  useEffect(() => { fetchMinhasCampanhas() }, [])

  async function criarCampanha(e) {
    e.preventDefault()
    if (!form.imagem_url) return alert('Por favor, envie a arte do anúncio.')
    
    // Inserção focada no modelo de leilão
    const { error } = await supabase.from('anuncios').insert([{
      titulo: form.titulo,
      tipo: 'proprio',
      imagem_url: form.imagem_url,
      link_destino: form.link_destino,
      estado_sigla: form.estado_sigla || null,
      cidade_id: form.cidade_id || null,
      categoria_id: form.categoria_id || null,
      lance_maximo_cpc: Number(form.lance_maximo_cpc),
      orcamento_diario: Number(form.orcamento_diario),
      status_aprovacao: 'pendente' // Toda campanha nova entra em moderação
    }])

    if (error) return alert('Erro ao criar: ' + error.message)
    alert('Campanha enviada para análise!')
    setModoCriacao(false)
    fetchMinhasCampanhas()
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Saldo e CTA */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black uppercase tracking-tighter">Área do Anunciante</h1>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-4">
          <span>SALDO: R$ 0,00</span>
          <button className="bg-blue-600 px-3 py-1 text-[10px] rounded-lg uppercase">Recarregar</button>
        </div>
      </div>

      {!modoCriacao ? (
        <>
          <button onClick={() => setModoCriacao(true)} className="w-full py-8 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-500 font-black hover:border-blue-500 hover:text-blue-600 transition-all uppercase tracking-widest text-[11px]">
            + Nova Campanha
          </button>
          
          <div className="mt-10 space-y-4">
            {campanhas.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-black uppercase">{c.titulo}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{c.status_aprovacao} • {c.impressoes} impressões</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm block">R$ {Number(c.orcamento_gasto || 0).toFixed(2)} gasto</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <form onSubmit={criarCampanha} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
          <h2 className="text-xl font-black uppercase">Passo 1: Identidade</h2>
          <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nome da campanha" onChange={e => setForm({...form, titulo: e.target.value})} />
          <input className="w-full p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Link de destino" onChange={e => setForm({...form, link_destino: e.target.value})} />
          
          <h2 className="text-xl font-black uppercase">Passo 2: Lance (Leilão)</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Lance máx por clique (R$)" onChange={e => setForm({...form, lance_maximo_cpc: e.target.value})} />
            <input type="number" className="p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Orçamento diário (R$)" onChange={e => setForm({...form, orcamento_diario: e.target.value})} />
          </div>

          <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px]">
            Finalizar e Enviar para análise
          </button>
        </form>
      )}
    </div>
  )
}
