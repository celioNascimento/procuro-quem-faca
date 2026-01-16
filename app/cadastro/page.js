'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Cadastro() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)

  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    categoria: '',
    cidade: '',
    bio: '',
    foto_perfil: ''
  })

  useEffect(() => {
    verificarUsuarioEPrefil()
  }, [])

  async function verificarUsuarioEPrefil() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: perfil } = await supabase
      .from('prestadores')
      .select('nome, whatsapp, categoria, cidade, bio, foto_perfil')
      .eq('user_id', session.user.id)
      .single()

    if (perfil) {
      setFormData({
        nome: perfil.nome || '',
        whatsapp: perfil.whatsapp || '',
        categoria: perfil.categoria || '',
        cidade: perfil.cidade || '',
        bio: perfil.bio || '',
        foto_perfil: perfil.foto_perfil || ''
      })
      setModoEdicao(true)
      setAceitouTermos(true)
      setAceitouPrivacidade(true)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const formularioValido = 
    formData.nome.trim() !== '' && 
    formData.whatsapp.trim().length >= 10 && 
    formData.categoria !== '' && 
    formData.cidade.trim() !== '' &&
    aceitouTermos && 
    aceitouPrivacidade;

  const aplicarMascaraWhatsapp = (valor) => {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  async function fazerUploadFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return
    if (arquivo.size > 1024 * 1024) {
      alert("A imagem deve ter no máximo 1MB.");
      return
    }

    setStatus('Subindo foto...')
    const fileName = `${Date.now()}.${arquivo.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('fotos-perfil').upload(fileName, arquivo)

    if (uploadError) {
      setStatus('Erro no upload.')
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('fotos-perfil').getPublicUrl(fileName)
    setFormData({ ...formData, foto_perfil: publicUrl })
    setStatus('Foto pronta!')
    setTimeout(() => setStatus(''), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formularioValido) return
    
    setStatus('Salvando...')
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setStatus('Erro de autenticação')
      return
    }

    const dadosParaSalvar = {
      nome: formData.nome,
      whatsapp: formData.whatsapp,
      categoria: formData.categoria,
      cidade: formData.cidade,
      bio: formData.bio,
      foto_perfil: formData.foto_perfil, 
      user_id: user.id
    }

    const { error } = modoEdicao 
      ? await supabase.from('prestadores').update(dadosParaSalvar).eq('user_id', user.id)
      : await supabase.from('prestadores').insert([dadosParaSalvar])

    if (error) {
      setStatus(`Erro: ${error.message}`)
    } else {
      setStatus('Salvo com sucesso!')
      setModoEdicao(true)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  async function excluirPerfilCompleto() {
    const confirmacao = confirm("ATENÇÃO: Isso excluirá seu anúncio e sua foto permanentemente. Deseja continuar?")
    if (!confirmacao) return

    setStatus('Excluindo...')
    const { data: { user } } = await supabase.auth.getUser()

    if (formData.foto_perfil) {
      try {
        const urlParts = formData.foto_perfil.split('/')
        const nomeArquivo = urlParts[urlParts.length - 1]
        await supabase.storage.from('fotos-perfil').remove([nomeArquivo])
      } catch (err) {
        console.error("Erro ao remover foto do storage:", err)
      }
    }

    const { error: dbError } = await supabase
      .from('prestadores')
      .delete()
      .eq('user_id', user.id)

    if (dbError) {
      setStatus('Erro ao excluir dados.')
    } else {
      alert("Perfil excluído com sucesso.")
      handleLogout()
    }
  }

  const inputStyle = "w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 transition-all"

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 uppercase text-xs tracking-widest">Carregando...</div>

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* Header de Navegação */}
        <div className="flex justify-between items-center mb-8 w-full">
          <Link href="/" className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">
            ← Início
          </Link>
          <button onClick={handleLogout} className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-red-500 transition-colors">
            Sair
          </button>
        </div>

        <div className="flex justify-center mb-10">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-6">{modoEdicao ? 'Meu Perfil' : 'Criar Anúncio'}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-slate-500 font-bold text-[10px] uppercase ml-4 tracking-wider">Foto Profissional</label>
            <div className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${formData.foto_perfil ? 'border-green-100 bg-green-50/30' : 'border-slate-100 bg-slate-50'}`}>
              {formData.foto_perfil && <img src={formData.foto_perfil} className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm" alt="Preview" />}
              <input type="file" accept="image/*" onChange={fazerUploadFoto} className="text-[10px] w-full text-slate-600 cursor-pointer" />
            </div>
          </div>

          <input value={formData.nome} placeholder="Nome Completo" onChange={(e) => setFormData({...formData, nome: e.target.value})} className={inputStyle} />
          
          <div className="grid grid-cols-2 gap-4">
            <select value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className={inputStyle}>
              <option value="">Categoria...</option>
              {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input value={formData.cidade} placeholder="Cidade" onChange={(e) => setFormData({...formData, cidade: e.target.value})} className={inputStyle} />
          </div>

          <input value={formData.whatsapp} placeholder="WhatsApp com DDD" onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} className={inputStyle} />

          <textarea value={formData.bio} placeholder="Conte o que você faz..." onChange={(e) => setFormData({...formData, bio: e.target.value})} className={`${inputStyle} h-28 resize-none`} />

          <div className="flex flex-col gap-3 py-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 transition-all" />
              <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-slate-700">Aceito os Termos de Uso</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={aceitouPrivacidade} onChange={(e) => setAceitouPrivacidade(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 transition-all" />
              <span className="text-xs font-bold text-slate-500 uppercase group-hover:text-slate-700">Aceito a Política de Privacidade</span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={!formularioValido || (status === 'Subindo foto...' || status === 'Salvando...')} 
            className={`w-full py-4 rounded-2xl font-black transition-all ${formularioValido ? 'bg-blue-600 text-white shadow-lg active:scale-95 hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {status || (modoEdicao ? 'ATUALIZAR MEU ANÚNCIO' : 'PUBLICAR AGORA')}
          </button>

          {modoEdicao && (
            <button 
              type="button" 
              onClick={excluirPerfilCompleto}
              className="mt-6 text-red-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors text-center"
            >
              Excluir anúncio e foto permanentemente
            </button>
          )}
        </form>
      </div>
    </main>
  )
}