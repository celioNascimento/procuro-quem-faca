'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    categoria: '',
    bio: '',
    foto_url: '' // Novo campo
  })
  const [status, setStatus] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('Salvando...')

    const { error } = await supabase.from('prestadores').insert([formData])

    if (error) {
      setStatus('Erro ao cadastrar. Tente novamente.')
    } else {
      setStatus('Cadastro realizado com sucesso!')
      setFormData({ nome: '', whatsapp: '', categoria: '', bio: '', foto_url: '' })
    }
  }

  return (
  <main className="min-h-screen bg-white p-4 md:p-6 flex flex-col items-center">
    <div className="w-full max-w-md">
      <Link href="/" className="text-blue-600 font-bold text-xs mb-8 inline-block hover:underline">
        ← Voltar para Busca
      </Link>
      
      <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">Anuncie seu serviço</h1>
      <p className="text-slate-500 mb-8 font-medium text-sm">Preencha os dados para aparecer na busca.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* INPUTS COM TEXTO ESCURO */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold text-[10px] uppercase ml-4">Nome Completo</label>
          <input 
            placeholder="Ex: João da Silva"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold text-[10px] uppercase ml-4">Categoria</label>
          <select 
            value={formData.categoria}
            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            required
          >
            <option value="">Selecione...</option>
            {CATEGORIAS_OFICIAIS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold text-[10px] uppercase ml-4">WhatsApp</label>
          <input 
            placeholder="Somente números"
            value={formData.whatsapp}
            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
            className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold text-[10px] uppercase ml-4">Link da Foto (URL)</label>
          <input 
            type="url"
            placeholder="https://..."
            value={formData.foto_url}
            onChange={(e) => setFormData({...formData, foto_url: e.target.value})}
            className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-slate-500 font-bold text-[10px] uppercase ml-4">Sua Bio</label>
          <textarea 
            placeholder="Fale brevemente sobre sua experiência..."
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            className="w-full p-3.5 h-28 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400 resize-none"
            required
          />
        </div>

        {/* BOTÃO MAIS PROPORCIONAL */}
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base shadow-md hover:bg-blue-700 active:scale-95 transition-all mt-2"
        >
          {status || 'Cadastrar Agora'}
        </button>

        {status && (
          <p className="text-center text-blue-600 font-bold text-sm mt-2 animate-pulse">
            {status}
          </p>
        )}
      </form>
    </div>
  </main>
)

}