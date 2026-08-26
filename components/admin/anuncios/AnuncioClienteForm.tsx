// components/admin/anuncios/AnuncioClienteForm.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Link as LinkIcon, X, ImageOff, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Segmentacao, AnuncioLojistaFormValues } from '@/types/ads'

const ASPECT_W = 1200
const ASPECT_H = 514

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100'

const labelClass = 'text-[10px] font-medium text-zinc-400 uppercase tracking-widest'

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
      <span className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${checked ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
        {checked ? '●' : '○'}
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

type Props = {
  initial: any | null
  onSave: (data: AnuncioLojistaFormValues) => void
  onCancel: () => void
  enviando: boolean
}

export function AnuncioClienteForm({ initial, onSave, onCancel, enviando }: Props) {
  const isEdicao = !!initial

  const [email, setEmail] = useState(initial?.anunciantes?.email ?? '')
  const [razaoSocial, setRazaoSocial] = useState(initial?.anunciantes?.razao_social ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.anunciantes?.whatsapp ?? '')
  const [titulo, setTitulo] = useState(initial?.titulo ?? '')
  const [linkDestino, setLinkDestino] = useState(initial?.link_destino ?? '')
  const [dataInicio, setDataInicio] = useState(initial?.data_inicio ? new Date(initial.data_inicio).toISOString().slice(0, 16) : '')
  const [dataExpiracao, setDataExpiracao] = useState(initial?.data_expiracao ? new Date(initial.data_expiracao).toISOString().slice(0, 16) : '')
  const [cidadeId, setCidadeId] = useState(initial?.anuncios_segmentacoes?.[0]?.cidade_id ?? '')
  
  // Dados de suporte para contornar exigências do banco
  const [cidades, setCidades] = useState<any[]>([])
  const [categoriaCuringa, setCategoriaCuringa] = useState<{ id: string; grupo_id: string } | null>(null)

  const [imagemUrl, setImagemUrl] = useState(initial?.imagem_url ?? '')
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [modoImagem, setModoImagem] = useState<'upload' | 'url'>('upload')
  const [ativo, setAtivo] = useState(initial?.status ?? false)
  const [erro, setErro] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function carregarDadosBase() {
      // 1. Carrega as cidades
      const { data: cid } = await supabase.from('cidades').select('id, nome, regiao_id, estado_sigla').eq('ativa', true).order('nome')
      if (cid) setCidades(cid)

      // 2. Busca apenas uma categoria qualquer do banco.
      // Isso é necessário apenas para satisfazer a chave estrangeira (NOT NULL) 
      // da tabela 'anuncios_segmentacoes' sem exigir preenchimento manual na tela.
      const { data: cat } = await supabase.from('categorias').select('id, grupo_id').limit(1).single()
      if (cat) setCategoriaCuringa(cat)
    }
    carregarDadosBase()
  }, [])

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

  async function handleSubmit() {
    if (!isEdicao && !email.trim()) return setErro('Informe o e-mail do parceiro/lojista.')
    if (!razaoSocial.trim()) return setErro('Informe o nome/razão social.')
    if (!titulo.trim()) return setErro('Informe um título interno.')
    if (!cidadeId) return setErro('Selecione a cidade onde o anúncio deve aparecer.')
    if (!imagemUrl) return setErro('Adicione uma imagem — por upload ou URL.')
    if (!categoriaCuringa) return setErro('Aguarde o carregamento do sistema...')

    setErro('')

    const cidadeObj = cidades.find((c) => String(c.id) === String(cidadeId))
    
    // Segmentação invisível e íntegra (usando IDs reais em vez de strings vazias)
    const segmentoUnico: Segmentacao = {
      id: initial?.anuncios_segmentacoes?.[0]?.id,
      estadoSigla: cidadeObj?.estado_sigla ?? 'PR',
      regiaoId: cidadeObj?.regiao_id ?? '',
      cidadeId: String(cidadeId),
      grupoId: categoriaCuringa.grupo_id,
      categoriaId: categoriaCuringa.id,
      valorCobrado: 0,
    }

    onSave({
      lojista: { email, razaoSocial, whatsapp },
      anuncio: {
        titulo,
        linkDestino,
        imagemUrl: modoImagem === 'url' ? imagemUrl : initial?.imagem_url ?? '',
        posicao: 'dashboard_cliente',
        ativo,
        dataInicio: dataInicio ? new Date(dataInicio).toISOString() : null,
        dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : null,
        valorTotal: 0,
        segmentacoes: [segmentoUnico],
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
        <h2 className="text-base font-bold tracking-tight text-zinc-900">{isEdicao ? 'Editar anúncio do painel do cliente' : 'Novo anúncio para o painel do cliente'}</h2>
        <button onClick={onCancel} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          {!isEdicao && (
            <Field label="E-mail do parceiro" hint="Cria uma conta de acesso mínima automaticamente">
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parceiro@empresa.com.br" />
            </Field>
          )}

          <Field label="Nome / Razão social">
            <input className={inputClass} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Ex: Loja de Acabamentos" />
          </Field>

          <Field label="WhatsApp de contato">
            <input className={inputClass} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(43) 99999-0000" />
          </Field>

          <Field label="Título interno" hint="Identificação rápida na listagem">
            <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Banner principal painel cliente" />
          </Field>

          <Field label="Link de destino">
            <input className={inputClass} value={linkDestino} onChange={(e) => setLinkDestino(e.target.value)} placeholder="https://..." />
          </Field>

          <Field label="Cidade de exibição" hint="O banner aparecerá na área do cliente desta cidade">
            <select className={inputClass} value={cidadeId} onChange={(e) => setCidadeId(e.target.value)}>
              <option value="">Selecione a cidade...</option>
              {cidades.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} ({c.estado_sigla})</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início da vigência" hint="Vazio = começa agora">
              <input className={inputClass} type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </Field>

            <Field label="Data de validade" hint="Vazio = não expira">
              <input className={inputClass} type="datetime-local" value={dataExpiracao} onChange={(e) => setDataExpiracao(e.target.value)} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold text-zinc-700">Visibilidade</p>
              <p className="text-[10px] text-zinc-400">Rascunho fica oculto</p>
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
            <p className="mt-1.5 text-[10px] text-zinc-300">1200×514px (21:9) · até 500KB</p>
          </div>

          <div>
            <span className={`mb-1.5 block ${labelClass}`}>Pré-visualização</span>
            <AdPreview imagemUrl={imagemUrl} titulo={titulo} />
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
        <button onClick={handleSubmit} disabled={enviando || !categoriaCuringa} className="rounded-xl bg-zinc-900 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
          {enviando ? 'Salvando...' : isEdicao ? 'Salvar alterações' : 'Cadastrar anúncio'}
        </button>
      </div>
    </motion.div>
  )
}
