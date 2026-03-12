'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MessageCircle, Copy, ExternalLink, ChevronDown, Search, Phone } from 'lucide-react'

// ─── Constantes ────────────────────────────────────────────────────────────────

const STATUS = {
  nao_enviado:        { label: 'Não enviado',    dot: '#94a3b8', badge: 'bg-slate-100 text-slate-500',      ordem: 0 },
  enviado:            { label: 'Enviado',         dot: '#3b82f6', badge: 'bg-blue-50 text-blue-600',         ordem: 1 },
  respondeu_positivo: { label: 'Respondeu',       dot: '#10b981', badge: 'bg-emerald-50 text-emerald-700',   ordem: 2 },
  respondeu_negativo: { label: 'Recusou',         dot: '#ef4444', badge: 'bg-red-50 text-red-500',           ordem: 3 },
  sem_whatsapp:       { label: 'Sem WhatsApp',    dot: '#f97316', badge: 'bg-orange-50 text-orange-600',     ordem: 4 },
  perfil_completo:    { label: 'Perfil completo', dot: '#f59e0b', badge: 'bg-amber-50 text-amber-700',       ordem: 5 },
  avaliacao_recebida: { label: 'Avaliado',        dot: '#8b5cf6', badge: 'bg-violet-50 text-violet-700',     ordem: 6 },
}

const PROXIMOS = {
  nao_enviado:        'enviado',
  enviado:            'respondeu_positivo',
  respondeu_positivo: 'perfil_completo',
  perfil_completo:    'avaliacao_recebida',
}

const FILTROS = ['todos', 'nao_enviado', 'enviado', 'respondeu_positivo', 'respondeu_negativo', 'sem_whatsapp', 'perfil_completo', 'avaliacao_recebida']

function montarMsg(p) {
  return (
    `Oi ${p.nome}, tudo bem? 👋\n\n` +
    `Sou o Célio, criador do *Procuro Quem Faça* — uma plataforma aqui de Londrina onde moradores buscam profissionais para serviços.\n\n` +
    `Montei um perfil pra vocês lá. Aqui está:\n` +
    `👉 procuroquemfaca.com.br/${p.slug}\n\n` +
    `Quer ver como fica quando está completo, com fotos dos serviços?\n` +
    `👉 procuroquemfaca.com.br/carlos-mendes-pedreiro\n\n` +
    `A diferença tá nas fotos — antes, durante e depois de cada serviço. É como uma indicação permanente: o cliente vê o trabalho, já chega sabendo o que esperar.\n\n` +
    `É gratuito. Posso ajudar a completar se quiser. 🙂`
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function PaginaAtivacao() {
  const [prestadores, setPrestadores] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filtro, setFiltro]           = useState('todos')
  const [busca, setBusca]             = useState('')
  const [expandido, setExpandido]     = useState(null)
  const [salvando, setSalvando]       = useState(null)
  const [copiado, setCopiado]         = useState(null)
  const [stats, setStats]             = useState({})

  const carregar = useCallback(async (inicial = false) => {
    if (inicial) setLoading(true)
    const { data } = await supabase
      .from('prestadores')
      .select('id, nome, whatsapp, slug, ativacao_status, ativacao_enviado_em, ativacao_obs')
      .order('nome')
    setPrestadores(data || [])
    const c = {}
    ;(data || []).forEach(p => { c[p.ativacao_status] = (c[p.ativacao_status] || 0) + 1 })
    setStats(c)
    if (inicial) setLoading(false)
  }, [])

  useEffect(() => { carregar(true) }, [carregar])

  const atualizarStatus = async (id, novoStatus) => {
    setSalvando(id)
    const update = { ativacao_status: novoStatus }
    if (novoStatus === 'enviado')            update.ativacao_enviado_em   = new Date().toISOString()
    if (novoStatus === 'respondeu_positivo') update.ativacao_respondeu_em = new Date().toISOString()
    const { error } = await supabase.from('prestadores').update(update).eq('id', Number(id))
    if (error) console.error('[ativacao] erro ao salvar', error)
    else {
      console.log('[ativacao] salvo ok')
      setPrestadores(prev => prev.map(p =>
        p.id === id ? { ...p, ativacao_status: novoStatus, ...update } : p
      ))
      setStats(prev => {
        const antigo = prestadores.find(p => p.id === id)?.ativacao_status
        const novo = { ...prev }
        if (antigo) novo[antigo] = Math.max(0, (novo[antigo] || 1) - 1)
        novo[novoStatus] = (novo[novoStatus] || 0) + 1
        return novo
      })
    }
    setSalvando(null)
  }

  const salvarObs = async (id, obs) => {
    await supabase.from('prestadores').update({ ativacao_obs: obs }).eq('id', Number(id))
    setPrestadores(prev => prev.map(p => p.id === id ? { ...p, ativacao_obs: obs } : p))
  }

  const abrirWA = (p) => {
    const wpp = p.whatsapp?.replace(/\D/g, '')
    window.open(`https://wa.me/55${wpp}?text=${encodeURIComponent(montarMsg(p))}`, '_blank')
  }

  const copiarLink = async (p) => {
    const wpp = p.whatsapp?.replace(/\D/g, '')
    const link = `https://wa.me/55${wpp}?text=${encodeURIComponent(montarMsg(p))}`
    await navigator.clipboard.writeText(link)
    setCopiado(p.id)
    setTimeout(() => setCopiado(null), 2000)
  }

  const lista = prestadores.filter(p => {
    const passaBusca  = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.slug?.toLowerCase().includes(busca.toLowerCase())
    const passaFiltro = filtro === 'todos' || p.ativacao_status === filtro
    return passaBusca && passaFiltro
  })

  const total    = prestadores.length
  const enviados = Object.entries(stats).filter(([k]) => k !== 'nao_enviado').reduce((a, [, v]) => a + v, 0)
  const completos = (stats.perfil_completo || 0) + (stats.avaliacao_recebida || 0)
  const pct      = total ? Math.round((enviados / total) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl mx-auto pb-24">

      {/* ── Cabeçalho ── */}
      <div className="pt-4 pb-6">
        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.2em] mb-1">Campanha · {total} prestadores</p>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-zinc-900 leading-none">Ativação</h1>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total',      val: total,     color: 'text-zinc-900' },
          { label: 'Contatados', val: enviados,   color: 'text-blue-600' },
          { label: 'Ativos',     val: completos,  color: 'text-emerald-600' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-zinc-100">
            <p className={`text-2xl font-bold ${color} leading-none mb-1`}>{val}</p>
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Progresso + legenda ── */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-100 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-zinc-400">Enviados</span>
          <span className="text-[11px] font-semibold text-zinc-700">{pct}%</span>
        </div>
        <div className="h-1 bg-zinc-100 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-zinc-900 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {Object.entries(STATUS).map(([key, s]) => {
            const qtd = stats[key] || 0
            if (!qtd) return null
            return (
              <button
                key={key}
                onClick={() => setFiltro(filtro === key ? 'todos' : key)}
                className={`flex items-center gap-1.5 transition-opacity ${filtro !== 'todos' && filtro !== key ? 'opacity-25' : ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                <span className="text-[10px] text-zinc-500">{s.label}</span>
                <span className="text-[10px] font-semibold text-zinc-800">{qtd}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Busca ── */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar prestador..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
        />
      </div>

      {/* ── Pills de filtro ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide -mx-4 px-4">
        {FILTROS.map(f => {
          const s  = STATUS[f]
          const qtd = f === 'todos' ? total : (stats[f] || 0)
          const on = filtro === f
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border ${
                on ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200'
              }`}
            >
              {f !== 'todos' && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: on ? 'rgba(255,255,255,0.6)' : s.dot }}
                />
              )}
              {f === 'todos' ? 'Todos' : s.label} · {qtd}
            </button>
          )
        })}
      </div>

      {/* ── Contagem ── */}
      <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mb-2 px-0.5">
        {lista.length} resultado{lista.length !== 1 ? 's' : ''}
      </p>

      {/* ── Lista ── */}
      <div className="space-y-1.5">
        <AnimatePresence>
          {lista.map(p => (
            <CardPrestador
              key={p.id}
              p={p}
              expandido={expandido === p.id}
              salvando={salvando === p.id}
              copiado={copiado === p.id}
              onExpand={() => setExpandido(expandido === p.id ? null : p.id)}
              onStatus={async (s) => { await atualizarStatus(p.id, s) }}
              onCopiar={() => copiarLink(p)}
              onAbrir={() => abrirWA(p)}
              onObs={(obs) => salvarObs(p.id, obs)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Card individual ───────────────────────────────────────────────────────────

function CardPrestador({ p, expandido, salvando, copiado, onExpand, onStatus, onCopiar, onAbrir, onObs }) {
  const st      = STATUS[p.ativacao_status]
  const proximo = PROXIMOS[p.ativacao_status]
  const [obs, setObs]         = useState(p.ativacao_obs || '')
  const [editObs, setEditObs] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-2xl border border-zinc-100 overflow-hidden"
    >
      {/* Linha principal */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none active:bg-zinc-50 transition-colors"
        onClick={onExpand}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-zinc-900 truncate leading-tight">{p.nome}</p>
          <span className={`inline-block mt-0.5 px-1.5 py-px rounded text-[9px] font-semibold uppercase tracking-wide ${st.badge}`}>
            {st.label}
          </span>
        </div>

        {p.ativacao_enviado_em && (
          <span className="text-[10px] text-zinc-300 shrink-0 tabular-nums">
            {new Date(p.ativacao_enviado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}

        <ChevronDown
          size={14}
          className={`text-zinc-300 shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Painel expandido */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-zinc-50 pt-3">

              <p className="text-[10px] text-zinc-400 font-mono">/{p.slug}</p>

              {/* Ações WhatsApp */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onAbrir()
                    if (p.ativacao_status === 'nao_enviado') onStatus('enviado')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white rounded-xl text-[11px] font-semibold"
                >
                  <MessageCircle size={13} />
                  {p.ativacao_status === 'nao_enviado' ? 'Enviar WA' : 'Abrir WA'}
                </button>

                <button
                  onClick={() => {
                    onCopiar()
                    if (p.ativacao_status === 'nao_enviado') onStatus('enviado')
                  }}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-semibold border transition-all ${
                    copiado ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  }`}
                >
                  {copiado ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>

                <a
                  href={`https://procuroquemfaca.com.br/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                >
                  <ExternalLink size={13} className="text-zinc-400" />
                </a>
              </div>

              {/* Avançar status */}
              {proximo && p.ativacao_status !== 'nao_enviado' && (
                <button
                  disabled={!!salvando}
                  onClick={() => onStatus(proximo)}
                  className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-[11px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {salvando
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : `Marcar como ${STATUS[proximo].label}`
                  }
                </button>
              )}

              {/* Recusou */}
              {(p.ativacao_status === 'enviado' || p.ativacao_status === 'respondeu_positivo') && (
                <button
                  onClick={() => onStatus('respondeu_negativo')}
                  className="w-full py-2 text-zinc-400 rounded-xl text-[10px] font-semibold border border-zinc-100 hover:border-red-100 hover:text-red-400 transition-colors"
                >
                  Marcar como Recusou
                </button>
              )}

              {/* Sem WhatsApp */}
              {(p.ativacao_status === 'nao_enviado' || p.ativacao_status === 'enviado') && (
                <button
                  onClick={() => onStatus('sem_whatsapp')}
                  className="w-full py-2 text-zinc-400 rounded-xl text-[10px] font-semibold border border-zinc-100 hover:border-orange-100 hover:text-orange-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Phone size={11} />
                  Número sem WhatsApp
                </button>
              )}

              {/* Observação */}
              {editObs ? (
                <div className="space-y-2">
                  <textarea
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    rows={2}
                    placeholder="Observação..."
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:border-zinc-400 text-zinc-700"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onObs(obs); setEditObs(false) }}
                      className="flex-1 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-semibold"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditObs(false)}
                      className="px-4 py-2 border border-zinc-200 text-zinc-400 rounded-xl text-[10px] font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditObs(true)}
                  className="w-full text-left px-3 py-2 rounded-xl text-[10px] text-zinc-400 border border-dashed border-zinc-200 hover:border-zinc-300 transition-colors"
                >
                  {p.ativacao_obs ? `💬 ${p.ativacao_obs}` : '+ Observação'}
                </button>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}