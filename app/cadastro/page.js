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
  
  // Estados de Aceite
  const [aceitouTermos, setAceitouTermos] = useState(false)
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false)
  
  // Monitoramento de validação
  const [touched, setTouched] = useState({})

  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    categoria: '',
    cidade: '',
    bio: '',
    foto_url: ''
  })

  useEffect(() => {
    verificarUsuarioEPrefil()
  }, [])

async function verificarUsuarioEPrefil() {
  // Pega a sessão atual de forma imediata
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    // Se não houver sessão, redireciona
    router.push('/login')
    return
  }

  const user = session.user

  // Busca o perfil do prestador
  const { data: perfil } = await supabase
    .from('prestadores')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (perfil) {
    setFormData(perfil)
    setModoEdicao(true)
    setAceitouTermos(true)
    setAceitouPrivacidade(true)
  }
  setLoading(false)
}

  // Máscara Reativa de WhatsApp: (00) 00000-0000
  const aplicarMascaraWhatsapp = (valor) => {
    const d = valor.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  const handleBlur = (field) => setTouched(prev => ({ ...prev, [field]: true }))
  
  const isInvalid = (field) => touched[field] && !formData[field]?.trim()

  const inputClass = (field) => `
    w-full p-4 rounded-2xl border transition-all outline-none focus:ring-2 focus:ring-blue-500 text-slate-800
    ${isInvalid(field) ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50'}
  `

  async function fazerUploadFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return

    // Restrição de 1MB
    if (arquivo.size > 1024 * 1024) {
      alert("A imagem é muito grande! Máximo 1MB.");
      e.target.value = "";
      return
    }

    setStatus('Enviando foto...')
    const fileExt = arquivo.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('fotos-perfil')
      .upload(fileName, arquivo)

    if (uploadError) {
      setStatus('Erro no upload.')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('fotos-perfil')
      .getPublicUrl(fileName)

    setFormData({ ...formData, foto_url: publicUrl })
    setStatus('Foto enviada!')
    setTimeout(() => setStatus(''), 2000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!aceitouTermos || !aceitouPrivacidade) return alert("Aceite os termos para continuar.")
    
    setStatus('Salvando...')
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = modoEdicao 
      ? await supabase.from('prestadores').update({ ...formData, user_id: user.id }).eq('user_id', user.id)
      : await supabase.from('prestadores').insert([{ ...formData, user_id: user.id }])

    if (error) {
      setStatus('Erro ao salvar.')
    } else {
      setStatus('Perfil salvo com sucesso!')
      setModoEdicao(true)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  async function excluirPerfil() {
    if (!window.confirm("Tem certeza? Seu anúncio e foto serão apagados permanentemente.")) return
    
    setStatus('Excluindo...')
    
    // Deleta a foto física no Storage se ela existir
    if (formData.foto_url) {
      const nomeArquivo = formData.foto_url.split('/').pop()
      await supabase.storage.from('fotos-perfil').remove([nomeArquivo])
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('prestadores').delete().eq('user_id', user.id)

    if (error) {
      setStatus('Erro ao excluir.')
    } else {
      alert('Anúncio removido.')
      router.push('/')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 uppercase tracking-widest text-xs">Carregando...</div>

  return (
    <main className="min-h-screen bg-white p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        
        {/* LOGO AMPLIADA */}
        <div className="flex justify-center mb-10 transition-all">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-16 md:h-20 w-auto object-contain" // h-16 no mobile e h-20 no desktop
            />
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8 text-[15px] font-black uppercase tracking-widest">
          <Link href="/" className="text-blue-600">← Voltar</Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-slate-500 hover:text-red-500 transition-colors">Sair</button>
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 mb-2">{modoEdicao ? 'Meu Perfil' : 'Anunciar Serviço'}</h1>
        <p className="text-slate-500 mb-8 text-sm font-medium">Preencha seus dados profissionais abaixo.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4">Nome Completo</label>
            <input 
              value={formData.nome} 
              onBlur={() => handleBlur('nome')}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className={inputClass('nome')} required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-bold text-[9px] uppercase ml-4">Categoria</label>
              <select 
                value={formData.categoria} 
                onBlur={() => handleBlur('categoria')}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className={inputClass('categoria')} required
              >
                <option value="">Escolha...</option>
                {CATEGORIAS_OFICIAIS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-400 font-bold text-[9px] uppercase ml-4">Cidade</label>
              <input 
                value={formData.cidade} 
                onBlur={() => handleBlur('cidade')}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                className={inputClass('cidade')} required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4">WhatsApp (com DDD)</label>
            <input 
              value={formData.whatsapp} 
              onBlur={() => handleBlur('whatsapp')}
              onChange={(e) => setFormData({...formData, whatsapp: aplicarMascaraWhatsapp(e.target.value)})} 
              placeholder="(00) 00000-0000"
              className={inputClass('whatsapp')} required 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4">Foto de Perfil (Máx 1MB)</label>
            <div className={`flex items-center gap-4 p-2 rounded-2xl border ${formData.foto_url ? 'border-green-100 bg-green-50/30' : 'border-slate-100 bg-slate-50'}`}>
              {formData.foto_url && (
                <img src={formData.foto_url} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" alt="Preview" />
              )}
              <input 
                type="file" accept="image/*" onChange={fazerUploadFoto} 
                className="text-[10px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white cursor-pointer w-full" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-slate-400 font-bold text-[9px] uppercase ml-4">Sua Bio (O que você faz?)</label>
            <textarea 
              value={formData.bio} 
              onBlur={() => handleBlur('bio')}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className={`${inputClass('bio')} h-32 resize-none`} required 
            />
          </div>

          <div className="flex flex-col gap-3 px-2 py-2">
            <div className="flex items-start gap-3">
              <input type="checkbox" id="termos" checked={aceitouTermos} onChange={(e) => setAceitouTermos(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600" />
              <label htmlFor="termos" className="text-[11px] text-slate-500 leading-tight">Li e concordo com os <Link href="/termos" className="text-blue-600 underline font-bold">Termos</Link>.</label>
            </div>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="privacidade" checked={aceitouPrivacidade} onChange={(e) => setAceitouPrivacidade(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600" />
              <label htmlFor="privacidade" className="text-[11px] text-slate-500 leading-tight">Aceito a <Link href="/privacidade" className="text-blue-600 underline font-bold">Privacidade</Link>.</label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!aceitouTermos || !aceitouPrivacidade} 
            className={`w-full py-4 rounded-2xl font-black transition-all mt-2 ${(aceitouTermos && aceitouPrivacidade) ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
          >
            {status || (modoEdicao ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR ANÚNCIO')}
          </button>

          {modoEdicao && (
            <button type="button" onClick={excluirPerfil} className="mt-6 text-red-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors">
              Excluir anúncio permanentemente
            </button>
          )}
        </form>
      </div>
    </main>
  )
}