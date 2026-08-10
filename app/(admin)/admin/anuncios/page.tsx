// app/(admin)/admin/anuncios/page.tsx
'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Upload, Link as LinkIcon, Trash2, Pencil, Eye, EyeOff, X,
  ImageOff, AlertCircle, Copy, Check, ArrowUpRight, Megaphone,
} from 'lucide-react'
import { useAdminAnuncios } from '@/hooks/useAdminAnuncios'

// Trocar pelas chamadas reais quando plugar (useCategorias / useLocalizacao)
const CATEGORIAS = [
  { id: 'cat-eletrica', nome: 'Elétrica' },
  { id: 'cat-hidraulica', nome: 'Hidráulica' },
  { id: 'cat-pintura', nome: 'Pintura' },
  { id: 'cat-reformas', nome: 'Reformas' },
]
const CIDADES = [
  { id: 'cid-londrina', nome: 'Londrina' },
  { id: 'cid-cambe', nome: 'Cambé' },
  { id: 'cid-ibipora', nome: 'Ibiporã' },
]
const POSICOES = [
  { value: 'topo_busca', label: 'Topo do resultado da busca' },
  { value: 'entre_cards', label: 'Entre os cards de prestadores' },
  { value: 'topo_perfil', label: 'Topo do perfil público do prestador' },
]

const ASPECT_W = 1200
const ASPECT_H = 514

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100'

const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest'

// ---------------------------------------------------------------------------

function AdPreview({ imagemUrl, titulo }: { imagemUrl: string; titulo: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-zinc-100"
      style={{ aspectRatio: `${ASPECT_W}/${ASPECT_H}` }}
    >
      {imagemUrl ? (
        <img src={imagemUrl} alt={titulo || 'Anúncio'} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-50 text-zinc-300">
          <ImageOff size={24} strokeWidth={1.5} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Sem imagem</span>
        </div>
      )}
      <div className="pointer-events-none absolute right-3 top-3">
        <span className="rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          Publicidade
        </span>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-1 py-1 transition-all hover:border-zinc-300"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          checked ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'
        }`}
      >
        {checked ? <Eye size={12} /> : <EyeOff size={12} />}
      </span>
      <span className={`pr-2 text-[10px] font-semibold uppercase tracking-widest ${checked ? 'text-emerald-600' : 'text-zinc-400'}`}>
        {checked ? 'Ativo' : 'Rascunho'}
      </span>
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block ${labelClass}`}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-zinc-300">{hint}</span>}
    </label>
  )
}

function SenhaTemporariaModal({ senha, email, onClose }: { senha: string; email: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(senha)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Conta criada para o lojista</p>
        <p className="mt-2 text-sm text-zinc-600">
          Essa senha só aparece uma vez. Copie e envie por WhatsApp para <strong className="text-zinc-900">{email}</strong>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
          <code className="flex-1 text-sm font-mono text-zinc-800">{senha}</code>
          <button onClick={copiar} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700">
            {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
          Entendi, já copiei
        </button>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function AnuncioForm({ initial, onSave, onCancel, enviando }: { initial: any | null; onSave: (d: any) => void; onCancel: () => void; enviando: boolean }) {
  const isEdicao = !!initial

  const [email, setEmail] = useState(initial?.anunciantes?.email ?? '')
  const [razaoSocial, setRazaoSocial] = useState(initial?.anunciantes?.razao_social ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.anunciantes?.whatsapp ?? '')
  const [titulo, setTitulo] = useState(initial?.titulo ?? '')
  const [linkDestino, setLinkDestino] = useState(initial?.link_destino ?? '')
  const [categoriaId, setCategoriaId] = useState(initial?.categoria_id ?? CATEGORIAS[0].id)
  const [cidadeId, setCidadeId] = useState(initial?.cidade_id ?? CIDADES[0].id)
  const [posicao, setPosicao] = useState(initial?.posicao ?? 'entre_cards')
  const [imagemUrl, setImagemUrl] = useState(initial?.imagem_url ?? '')
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [modoImagem, setModoImagem] = useState<'upload' | 'url'>('upload')
  const [ativo, setAtivo] = useState(initial?.status ?? false)
  const [erro, setErro] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      setErro('Essa imagem passa de 500KB. Escolha um arquivo mais leve.')
      return
    }
    setErro('')
    setImagemFile(file)
    setImagemUrl(URL.createObjectURL(file))
  }

  function handleSubmit() {
    if (!isEdicao && !email.trim()) return setErro('Informe o e-mail do lojista.')
    if (!razaoSocial.trim()) return setErro('Informe o nome/razão social.')
    if (!titulo.trim()) return setErro('Informe um título interno.')
    if (!imagemUrl) return setErro('Adicione uma imagem — por upload ou URL.')
    setErro('')

    onSave({
      lojista: { email, razaoSocial, whatsapp },
      anuncio: {
        titulo,
        linkDestino,
        imagemUrl: modoImagem === 'url' ? imagemUrl : initial?.imagem_url ?? '',
        posicao,
        categoriaId,
        cidadeId,
        ativo,
      },
      imagemFile: modoImagem === 'upload' ? imagemFile : null,
      idExistente: initial?.id ?? null,
      anuncianteIdExistente: initial?.anunciante_id ?? null,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-100 bg-white p-5 md:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-zinc-900">{isEdicao ? 'Editar anúncio' : 'Novo anúncio'}</h2>
        <button onClick={onCancel} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          {!isEdicao && (
            <Field label="E-mail do lojista" hint="Cria uma conta de acesso mínima automaticamente">
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@lojista.com.br" />
            </Field>
          )}

          <Field label="Nome / Razão social">
            <input className={inputClass} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Ex: Casa & Construção Materiais" />
          </Field>

          <Field label="WhatsApp de contato">
            <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(43) 99999-0000" />
          </Field>

          <Field label="Título interno" hint="Só pra identificar na lista — não aparece pro visitante">
            <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Banner promoção agosto" />
          </Field>

          <Field label="Link de destino">
            <input className={inputClass} value={linkDestino} onChange={(e) => setLinkDestino(e.target.value)} placeholder="https://wa.me/55..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select className={inputClass} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <Field label="Cidade">
              <select className={inputClass} value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
                {CIDADES.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Onde aparece" hint="Uma posição por anúncio — duplique o cadastro para outro local">
            <select className={inputClass} value={posicao} onChange={(e) => setPosicao(e.target.value)}>
              {POSICOES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold text-zinc-700">Visibilidade</p>
              <p className="text-[10px] text-zinc-400">Rascunho fica oculto da busca e do perfil</p>
            </div>
            <Toggle checked={ativo} onChange={setAtivo} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className={`mb-1.5 block ${labelClass}`}>Imagem do anúncio</span>
            <div className="mb-3 flex gap-2 rounded-xl bg-zinc-100 p-1 text-[11px] font-semibold">
              <button onClick={() => setModoImagem('upload')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${modoImagem === 'upload' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>
                <Upload size={13} /> Upload
              </button>
              <button onClick={() => setModoImagem('url')} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${modoImagem === 'url' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}>
                <LinkIcon size={13} /> URL
              </button>
            </div>

            {modoImagem === 'upload' ? (
              <button onClick={() => fileInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-[11px] font-semibold text-zinc-400 hover:border-zinc-300 hover:bg-zinc-100">
                <Upload size={15} /> Escolher arquivo
              </button>
            ) : (
              <input className={inputClass} placeholder="https://..." value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} />
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <p className="mt-1.5 text-[10px] text-zinc-300">1200×514px (21:9) · até 500KB · JPG, WebP ou PNG</p>
          </div>

          <div>
            <span className={`mb-1.5 block ${labelClass}`}>Pré-visualização</span>
            <AdPreview imagemUrl={imagemUrl} titulo={titulo} />
            <p className="mt-1.5 text-[10px] text-zinc-300">Deixe os cantos livres — o selo "Publicidade" é fixo do sistema</p>
          </div>
        </div>
      </div>

      {erro && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-600">
          <AlertCircle size={14} /> {erro}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-zinc-400 hover:bg-zinc-100">Cancelar</button>
        <button onClick={handleSubmit} disabled={enviando} className="rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
          {enviando ? 'Salvando...' : isEdicao ? 'Salvar alterações' : 'Cadastrar anúncio'}
        </button>
      </div>
    </motion.div>
  )
}

function AnuncioRow({ anuncio, onEdit, onDelete, onToggleAtivo }: any) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-3 hover:border-zinc-200 transition-colors">
      <div className="h-14 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-50">
        {anuncio.imagem_url && <img src={anuncio.imagem_url} alt={anuncio.titulo} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-zinc-800">{anuncio.anunciantes?.razao_social ?? anuncio.titulo}</p>
        <p className="truncate text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5">
          {anuncio.posicao} · {anuncio.cliques ?? 0} cliques · {anuncio.impressoes ?? 0} impressões
        </p>
      </div>
      <Toggle checked={anuncio.status} onChange={(v: boolean) => onToggleAtivo(anuncio.id, v)} />
      <button onClick={() => onEdit(anuncio)} className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-700">
        <Pencil size={15} />
      </button>
      <button onClick={() => onDelete(anuncio.id)} className="rounded-lg p-2 text-zinc-300 hover:bg-red-50 hover:text-red-500">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------

export default function PainelAnuncios() {
  const { anuncios, loading, enviando, erro, cadastrarNovoAnuncio, editarAnuncio, toggleAtivo, remover } = useAdminAnuncios()
  const [editando, setEditando] = useState<any>(null)
  const [confirmarExclusao, setConfirmarExclusao] = useState<string | null>(null)
  const [senhaModal, setSenhaModal] = useState<{ senha: string; email: string } | null>(null)

  async function handleSave(data: any) {
    try {
      if (data.idExistente) {
        await editarAnuncio(data.idExistente, data.anuncio, data.imagemFile, data.anuncianteIdExistente)
      } else {
        const resultado = await cadastrarNovoAnuncio({ lojista: data.lojista, anuncio: data.anuncio, imagemFile: data.imagemFile })
        if (resultado.senhaTemporaria) setSenhaModal({ senha: resultado.senhaTemporaria, email: data.lojista.email })
      }
      setEditando(null)
    } catch {
      // erro já exposto via hook — form permanece aberto pra corrigir
    }
  }

  const ativos = anuncios.filter((a) => a.status).length

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-6">
      <header className="flex items-center justify-between pt-6 md:pt-10 pb-6 md:pb-8 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Megaphone size={12} className="text-zinc-400" />
            <p className={labelClass}>Lojistas & fornecedores</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 leading-none">Anúncios</h1>
        </div>
        {!editando && (
          <button
            onClick={() => setEditando('new')}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-zinc-800 transition-colors"
          >
            <Plus size={15} /> Novo anúncio
          </button>
        )}
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pt-6">
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Cadastrados</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">{anuncios.length}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-emerald-500 bg-emerald-600 shadow-sm shadow-emerald-100">
          <p className="text-[9px] font-medium uppercase tracking-widest mb-2 text-emerald-100">Ativos</p>
          <span className="text-2xl md:text-3xl font-bold text-white leading-none">{ativos}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Rascunho</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">{anuncios.length - ativos}</span>
        </div>
        <div className="p-4 md:p-5 rounded-2xl border border-zinc-100 bg-white">
          <p className={`${labelClass} mb-2`}>Cliques totais</p>
          <span className="text-2xl md:text-3xl font-bold text-zinc-900 leading-none">
            {anuncios.reduce((sum, a: any) => sum + (a.cliques ?? 0), 0)}
          </span>
        </div>
      </section>

      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[12px] font-medium text-red-600"
          >
            <AlertCircle size={14} /> {erro}
          </motion.div>
        )}
      </AnimatePresence>

      {editando && (
        <div className="mt-6">
          <AnuncioForm initial={editando === 'new' ? null : editando} onSave={handleSave} onCancel={() => setEditando(null)} enviando={enviando} />
        </div>
      )}

      {loading && <p className="mt-6 text-[11px] text-zinc-300 uppercase tracking-widest">Carregando...</p>}

      {!loading && anuncios.length === 0 && !editando && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <p className="text-[13px] font-semibold text-zinc-500">Nenhum anúncio cadastrado ainda</p>
          <p className="mt-1 text-[11px] text-zinc-300">Cadastre o primeiro lojista pra testar como o banner aparece no site</p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {anuncios.map((a) => (
          <AnuncioRow key={a.id} anuncio={a} onEdit={setEditando} onDelete={(id: string) => setConfirmarExclusao(id)} onToggleAtivo={toggleAtivo} />
        ))}
      </div>

      <AnimatePresence>
        {confirmarExclusao && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <p className="text-[13px] font-semibold text-zinc-800">Excluir este anúncio?</p>
              <p className="mt-1 text-[11px] text-zinc-400">Essa ação não pode ser desfeita. Se quiser só pausar, use o botão de visibilidade em vez de excluir.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setConfirmarExclusao(null)} className="rounded-xl px-3.5 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-zinc-100">Cancelar</button>
                <button
                  onClick={async () => { await remover(confirmarExclusao); setConfirmarExclusao(null) }}
                  className="rounded-xl bg-red-500 px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {senhaModal && <SenhaTemporariaModal senha={senhaModal.senha} email={senhaModal.email} onClose={() => setSenhaModal(null)} />}
    </div>
  )
}