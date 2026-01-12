'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'

export default function Cadastro() {
  const router = useRouter()
  const [autenticando, setAutenticando] = useState(true)
  const [status, setStatus] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [aceitouTermos, setAceitouTermos] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    categoria: '',
    cidade: '',
    bio: '',
    foto_url: ''
  })

  // VERIFICAÇÃO DE ACESSO E CARREGAMENTO DE DADOS
  useEffect(() => {
    async function verificarAcesso() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
      } else {
        const { data: perfil } = await supabase
          .from('prestadores')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (perfil) {
          setFormData(perfil)
          setModoEdicao(true)
          setAceitouTermos(true) 
        }
        setAutenticando(false)
      }
    }
    verificarAcesso()
  }, [router])

  // FUNÇÃO PARA SALVAR/ATUALIZAR
  async function handleSubmit(e) {
    e.preventDefault()
    if (!aceitouTermos) return
    
    setStatus('Salvando...')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const dadosParaEnviar = {
        nome: formData.nome,
        whatsapp: formData.whatsapp,
        categoria: formData.categoria,
        cidade: formData.cidade,
        bio: formData.bio,
        foto_url: formData.foto_url,
        user_id: user.id
      }

      let erro;
      if (modoEdicao) {
        const { error } = await supabase
          .from('prestadores')
          .update(dadosParaEnviar)
          .eq('user_id', user.id)
        erro = error
      } else {
        const { error } = await supabase
          .from('prestadores')
          .insert([dadosParaEnviar])
        erro = error
      }

      if (erro) throw erro

      setStatus('Perfil salvo! Redirecionando...')
      
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error) {
      console.error("Erro:", error)
      setStatus('Erro ao salvar. Tente novamente.')
    }
  }

  if (autenticando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-blue-600 font-bold uppercase tracking-widest text-xs animate-pulse">
        Verificando Acesso...
      </div>
    )
  }

  return (
    // Adicionei pb-32 para dar um espaço enorme no fim da página antes do Footer
    <main className="min-h-screen bg-white p-4 md:p-6 pb-32 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">
            ← Voltar
          </Link>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-red-500 font-bold text-xs hover:underline"
          >
            Sair da Conta
          </button>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 leading-tight">
          {modoEdicao ? 'Editar meu Perfil' : 'Anuncie seu serviço'}
        </h1>
        <p className="text-slate-500 mb-8 font-medium text-sm">
          {modoEdicao ? 'Atualize as informações do seu anúncio.' : 'Preencha os dados para aparecer na busca.'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">Nome Completo</label>
            <input 
              placeholder="Ex: João da Silva"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all shadow-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">Categoria</label>
              <select 
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all shadow-sm"
                required
              >
                <option value="">Selecione...</option>
                {CATEGORIAS_OFICIAIS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">Cidade</label>
              <input 
                placeholder="Ex: Porto Alegre"
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">WhatsApp (DDD + Número)</label>
            <input 
              placeholder="Ex: 51999999999"
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all shadow-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">Link da Foto (URL)</label>
            <input 
              type="url"
              placeholder="https://suafoto.com/imagem.jpg"
              value={formData.foto_url}
              onChange={(e) => setFormData({...formData, foto_url: e.target.value})}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-xs transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">Descrição do Serviço</label>
            <textarea 
              placeholder="Conte detalhes sobre seu trabalho..."
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full p-4 h-32 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none transition-all shadow-sm"
              required
            />
          </div>

          {/* CHECKBOX */}
          <div className="flex items-start gap-3 px-4 mt-2">
            <input 
              type="checkbox" 
              id="termos"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-1 h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="termos" className="text-[11px] text-slate-500 leading-tight cursor-pointer select-none">
              Li e concordo com os <Link href="/termos" className="text-blue-600 font-bold underline">Termos de Uso</Link> e a <Link href="/privacidade" className="text-blue-600 font-bold underline">Política de Privacidade</Link>.
            </label>
          </div>

          {/* BOTÃO - Agora com margem bottom extra */}
          <div className="pt-4 pb-10">
            <button 
              type="submit"
              disabled={!aceitouTermos || (status !== '' && !status.includes('sucesso'))}
              className={`w-full py-5 rounded-2xl font-bold text-base shadow-lg transition-all
                ${aceitouTermos 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-100' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {status || (modoEdicao ? 'Salvar Alterações' : 'Criar meu Anúncio')}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}