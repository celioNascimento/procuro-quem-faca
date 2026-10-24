// components/admin/ativacao/CardPrestadorAtivacao.tsx
//
// Card expansível de um prestador na campanha de ativação. Componente puro de
// apresentação: não acessa Supabase — toda mudança de estado sobe para quem
// o usa (app/(admin)/admin/ativacao/page.tsx) via as props onStatus/onCopiar/
// onAbrir/onObs.

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, MessageCircle, Copy, ExternalLink, ChevronDown, Phone } from 'lucide-react'
import { STATUS, PROXIMOS } from '@/lib/config/ativacao'
import type { PrestadorAtivacao } from '@/lib/services/adminAtivacao.service'

interface CardPrestadorAtivacaoProps {
  p: PrestadorAtivacao
  expandido: boolean
  salvando: boolean
  copiado: boolean
  onExpand: () => void
  onStatus: (novoStatus: string) => void
  onCopiar: () => void
  onAbrir: () => void
  onObs: (obs: string) => void
}

export function CardPrestadorAtivacao({
  p,
  expandido,
  salvando,
  copiado,
  onExpand,
  onStatus,
  onCopiar,
  onAbrir,
  onObs,
}: CardPrestadorAtivacaoProps) {
  const st = STATUS[p.ativacao_status]
  const proximo = PROXIMOS[p.ativacao_status]
  const [obs, setObs] = useState(p.ativacao_obs || '')
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
                  disabled={salvando}
                  onClick={() => onStatus(proximo)}
                  className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-[11px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {salvando ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    `Marcar como ${STATUS[proximo].label}`
                  )}
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
                    onChange={(e) => setObs(e.target.value)}
                    rows={2}
                    placeholder="Observação..."
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl resize-none focus:outline-none focus:border-zinc-400 text-zinc-700"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onObs(obs)
                        setEditObs(false)
                      }}
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
