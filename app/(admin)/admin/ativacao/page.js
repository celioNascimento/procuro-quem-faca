'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Send, MessageCircle, XCircle, Star, Clock, Copy, ExternalLink, ChevronDown, Search, Filter } from 'lucide-react'

// ─── Tipos e constantes ────────────────────────────────────────────────────────

const STATUS = {
  nao_enviado:        { label: 'Não enviado',   emoji: '○',  cor: 'bg-zinc-100 text-zinc-500',         corBarra: 'bg-zinc-300',        ordem: 0 },
  enviado:            { label: 'Enviado',        emoji: '📤', cor: 'bg-blue-50 text-blue-600',           corBarra: 'bg-blue-400',        ordem: 1 },
  respondeu_positivo: { label: 'Respondeu ✓',   emoji: '💬', cor: 'bg-emerald-50 text-emerald-700',     corBarra: 'bg-emerald-400',     ordem: 2 },
  respondeu_negativo: { label: 'Recusou',        emoji: '✗',  cor: 'bg-red-50 text-red-500',             corBarra: 'bg-red-400',         ordem: 3 },
  perfil_completo:    { label: 'Perfil completo',emoji: '⭐', cor: 'bg-amber-50 text-amber-700',         corBarra: 'bg-amber-400',       ordem: 4 },
  avaliacao_recebida: { label: 'Avaliado',       emoji: '🏆', cor: 'bg-violet-50 text-violet-700',       corBarra: 'bg-violet-500',      ordem: 5 },
}

const PROXIMOS_STATUS = {
  nao_enviado:        'enviado',
  enviado:            'respondeu_positivo',
  respondeu_positivo: 'perfil_completo',
  perfil_completo:    'avaliacao_recebida',
}

const FILTROS = ['todos', 'nao_enviado', 'enviado', 'respondeu_positivo', 'respondeu_negativo', 'perfil_completo', 'avaliacao_recebida']

// ─── Componente principal ──────────────────────────────────────────────────────

export default function PaginaAtivacao() {
  const [prestadores, setPrestadores]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [filtro, setFiltro]             = useState('todos')
  const [busca, setBusca]               = useState('')
  const [expandido, setExpandido]       = useState(null)
  const [salvando, setSalvando]         = useState(null)
  const [copiado, setCopiado]           = useState(null)
  const [stats, setStats]               = useState({})

  // ── Carregar prestadores ───────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('prestadores')
      .select('id, nome, whatsapp, slug, ativacao_status, ativacao_enviado_em, ativacao_respondeu_em, ativacao_obs')
      .order('nome')
    setPrestadores(data || [])

    // Calcular stats
    const contagem = {}
    ;(data || []).forEach(p => {
      contagem[p.ativacao_status] = (contagem[p.ativacao_status] || 0) + 1
    })
    setStats(contagem)
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  // ── Atualizar status ───────────────────────────────────────────────────────
  const atualizarStatus = async (id, novoStatus, obs = null) => {
    setSalvando(id)
    const update = { ativacao_status: novoStatus }
    if (novoStatus === 'enviado')            update.ativacao_enviado_em   = new Date().toISOString()
    if (novoStatus === 'respondeu_positivo') update.ativacao_respondeu_em = new Date().toISOString()
    if (obs !== null)                        update.ativacao_obs           = obs

    await supabase.from('prestadores').update(update).eq('id', id)
    await carregar()
    setSalvando(null)
  }

  const salvarObs = async (id, obs) => {
    await supabase.from('prestadores').update({ ativacao_obs: obs }).eq('id', id)
    await carregar()
  }

  // ── Copiar link WhatsApp ───────────────────────────────────────────────────
  const copiarLink = async (p) => {
    const nome  = p.nome
    const slug  = p.slug
    const wpp   = p.whatsapp?.replace(/\D/g, '')
    const msg   =
      `Oi ${nome}, tudo bem? 👋\n\n` +
      `Sou o Célio, criador do *Procuro Quem Faça* — uma plataforma aqui de Londrina onde moradores buscam profissionais para serviços.\n\n` +
      `Montei um perfil pra vocês lá. Aqui está:\n` +
      `👉 procuroquemfaca.com.br/${slug}\n\n` +
      `Quer ver como fica quando está completo, com fotos dos serviços?\n` +
      `👉 procuroquemfaca.com.br/carlos-mendes-pedreiro\n\n` +
      `A diferença tá nas fotos — antes, durante e depois de cada serviço. É como uma indicação permanente: o cliente vê o trabalho, já chega sabendo o que esperar.\n\n` +
      `É gratuito. Posso ajudar a completar se quiser. 🙂`
    const link  = `https://wa.me/55${wpp}?text=${encodeURIComponent(msg)}`

    await navigator.clipboard.writeText(link)
    setCopiado(p.id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const abrirWhatsApp = (p) => {
    const nome  = p.nome
    const slug  = p.slug
    const wpp   = p.whatsapp?.replace(/\D/g, '')
    const msg   =
      `Oi ${nome}, tudo bem? 👋\n\n` +
      `Sou o Célio, criador do *Procuro Quem Faça* — uma plataforma aqui de Londrina onde moradores buscam profissionais para serviços.\n\n` +
      `Montei um perfil pra vocês lá. Aqui está:\n` +
      `👉 procuroquemfaca.com.br/${slug}\n\n` +
      `Quer ver como fica quando está completo, com fotos dos serviços?\n` +
      `👉 procuroquemfaca.com.br/carlos-mendes-pedreiro\n\n` +
      `A diferença tá nas fotos — antes, durante e depois de cada serviço. É como uma indicação permanente: o cliente vê o trabalho, já chega sabendo o que esperar.\n\n` +
      `É gratuito. Posso ajudar a completar se quiser. 🙂`
    window.open(`https://wa.me/55${wpp}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ── Filtrar e buscar ───────────────────────────────────────────────────────
  const lista = prestadores.filter(p => {
    const passaBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       p.slug?.toLowerCase().includes(busca.toLowerCase())
    const passaFiltro = filtro === 'todos' || p.ativacao_status === filtro
    return passaBusca && passaFiltro
  })

  const total     = prestadores.length
  const completos = (stats.perfil_completo || 0) + (stats.avaliacao_recebida || 0)
  const enviados  = Object.entries(stats)
    .filter(([k]) => k !== 'nao_enviado')
    .reduce((a, [, v]) => a + v, 0)
  const pct = total ? Math.round((completos / total) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 font-sans">

      {/* ── Cabeçalho ── */}
      <div className="pt-2 pb-4">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Campanha</p>
        <h1 className="text-2xl font-black tracking-tighter text-zinc-900">
          Ativação de Prestadores
        </h1>
        <p className="text-xs text-zinc-400 mt-1">{total} prestadores · atualiza ao vivo</p>
      </div>

      {/* ── Barra de progresso geral ── */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Progresso geral</span>
          <span className="text-lg font-black text-zinc-900">{pct}%</span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Total"    valor={total}     cor="text-zinc-900" />
          <MiniStat label="Enviados" valor={enviados}   cor="text-blue-600" />
          <MiniStat label="Ativos"   valor={completos}  cor="text-emerald-600" />
        </div>
      </div>

      {/* ── Pills de status ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {FILTROS.map(f => {
          const s       = STATUS[f]
          const qtd     = f === 'todos' ? total : (stats[f] || 0)
          const ativo   = filtro === f
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                ativo
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {f === 'todos' ? `Todos · ${qtd}` : `${s.label} · ${qtd}`}
            </button>
          )
        })}
      </div>

      {/* ── Busca ── */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar prestador..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      {/* ── Lista ── */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
          {lista.length} prestador{lista.length !== 1 ? 'es' : ''}
        </p>
        <AnimatePresence>
          {lista.map((p) => (
            <CardPrestador
              key={p.id}
              p={p}
              expandido={expandido === p.id}
              salvando={salvando === p.id}
              copiado={copiado === p.id}
              onExpand={() => setExpandido(expandido === p.id ? null : p.id)}
              onStatus={(novoStatus) => atualizarStatus(p.id, novoStatus)}
              onNegativo={() => atualizarStatus(p.id, 'respondeu_negativo')}
              onCopiar={() => copiarLink(p)}
              onAbrir={() => abrirWhatsApp(p)}
              onObs={(obs) => salvarObs(p.id, obs)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Card individual ───────────────────────────────────────────────────────────

function CardPrestador({ p, expandido, salvando, copiado, onExpand, onStatus, onNegativo, onCopiar, onAbrir, onObs }) {
  const st          = STATUS[p.ativacao_status]
  const proximo     = PROXIMOS_STATUS[p.ativacao_status]
  const [obs, setObs] = useState(p.ativacao_obs || '')
  const [editObs, setEditObs] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden"
    >
      {/* Linha superior — sempre visível */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer active:bg-zinc-50 transition-colors"
        onClick={onExpand}
      >
        {/* Indicador de status */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${st.corBarra}`} />

        {/* Nome e status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 truncate leading-tight">{p.nome}</p>
          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${st.cor}`}>
            {st.label}
          </span>
        </div>

        {/* Seta */}
        <ChevronDown
          size={16}
          className={`text-zinc-300 transition-transform shrink-0 ${expandido ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Painel expandido */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-50 pt-3">

              {/* Info */}
              <div className="flex gap-3 text-[10px] text-zinc-400 font-medium">
                <span>/{p.slug}</span>
                {p.ativacao_enviado_em && (
                  <span>Enviado {new Date(p.ativacao_enviado_em).toLocaleDateString('pt-BR')}</span>
                )}
              </div>

              {/* Ações principais */}
              <div className="flex gap-2">
                {/* Abrir WhatsApp */}
                <button
                  onClick={onAbrir}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-[11px] font-black uppercase tracking-wider active:opacity-80 transition-opacity"
                >
                  <MessageCircle size={14} />
                  Abrir WA
                </button>

                {/* Copiar link */}
                <button
                  onClick={onCopiar}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                    copiado
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {copiado ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>

                {/* Ver perfil */}
                <a
                  href={`https://procuroquemfaca.com.br/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl"
                >
                  <ExternalLink size={14} className="text-zinc-500" />
                </a>
              </div>

              {/* Avançar status */}
              {proximo && (
                <button
                  disabled={salvando}
                  onClick={() => onStatus(proximo)}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[11px] font-black uppercase tracking-wider disabled:opacity-50 active:opacity-80 transition-opacity flex items-center justify-center gap-2"
                >
                  {salvando
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <>
                        <span>{STATUS[proximo].emoji}</span>
                        Marcar como {STATUS[proximo].label}
                      </>
                  }
                </button>
              )}

              {/* Botão negativo (só se enviado ou respondeu_positivo) */}
              {(p.ativacao_status === 'enviado' || p.ativacao_status === 'respondeu_positivo') && (
                <button
                  onClick={onNegativo}
                  className="w-full py-2.5 border border-red-100 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider active:bg-red-50 transition-colors"
                >
                  ✗ Marcar como Recusou
                </button>
              )}

              {/* Observação */}
              <div>
                {editObs ? (
                  <div className="space-y-2">
                    <textarea
                      value={obs}
                      onChange={e => setObs(e.target.value)}
                      rows={2}
                      placeholder="Observação sobre esse prestador..."
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:border-blue-300 text-zinc-700"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onObs(obs); setEditObs(false) }}
                        className="flex-1 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditObs(false)}
                        className="px-4 py-2 border border-zinc-200 text-zinc-500 rounded-xl text-[10px] font-black uppercase"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditObs(true)}
                    className="w-full text-left px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] text-zinc-400 hover:border-zinc-300 transition-colors"
                  >
                    {p.ativacao_obs ? `💬 ${p.ativacao_obs}` : '+ Adicionar observação'}
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Mini stat ─────────────────────────────────────────────────────────────────

function MiniStat({ label, valor, cor }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-black ${cor}`}>{valor}</p>
      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
    </div>
  )
}