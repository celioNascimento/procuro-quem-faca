'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Cadastro() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [tocados, setTocados] = useState({})
  const [formData, setFormData] = useState({ nome: '', categoria: '', bio: '', whatsapp: '' })

  const marcarComoTocado = (campo) => setTocados({ ...tocados, [campo]: true })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.nome || !formData.categoria || !formData.bio || !formData.whatsapp) {
      setMensagem('Erro: Preencha todos os campos.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('prestadores').insert([formData])

    if (error) {
      setMensagem('Erro ao cadastrar: ' + error.message)
      setLoading(false)
    } else {
      setMensagem('✅ Cadastro realizado! Redirecionando...')
      setTimeout(() => router.push('/'), 3000)
    }
  }

  const inputStyle = (campo) => `
    w-full p-4 rounded-2xl border-2 shadow-sm outline-none transition-all text-slate-900 bg-white
    ${tocados[campo] && !formData[campo] ? 'border-red-500 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-blue-500'}
  `

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md mb-8">
        <Link href="/" className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
          ← Voltar para Busca
        </Link>
      </div>

      <div className="w-full max-w-md bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-xl">
        <h1 className="text-2xl font-black text-slate-800 mb-2 italic uppercase">Anuncie seu serviço</h1>
        <p className="text-slate-500 text-sm mb-8">Junte-se aos melhores profissionais.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1">Nome Completo</label>
            <input className={inputStyle('nome')} placeholder="Ex: João da Silva" value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})} onBlur={() => marcarComoTocado('nome')} />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1">Categoria</label>
            <select className={inputStyle('categoria')} value={formData.categoria}
              onChange={(e) => setFormData({...formData, categoria: e.target.value})} onBlur={() => marcarComoTocado('categoria')}>
              <option value="">Selecione uma opção...</option>
              {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1">Descrição</label>
            <textarea className={`${inputStyle('bio')} h-32 resize-none`} placeholder="Conte o que você faz..."
              value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} onBlur={() => marcarComoTocado('bio')} />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase ml-2 mb-1">WhatsApp</label>
            <input className={inputStyle('whatsapp')} placeholder="Ex: 11999999999" value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} onBlur={() => marcarComoTocado('whatsapp')} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg mt-4 disabled:bg-slate-300">
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </button>

          {mensagem && (
            <div className={`p-4 rounded-xl text-center font-bold text-sm ${mensagem.includes('Erro') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600 animate-bounce'}`}>
              {mensagem}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}