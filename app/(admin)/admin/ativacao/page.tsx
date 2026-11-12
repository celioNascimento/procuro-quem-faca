// app/(admin)/admin/ativacao/page.tsx
//
// Funil de ativação dos perfis criados pela curadoria. Cada linha abre um painel com as ações:
// enviar a mensagem pelo WhatsApp (com o link pessoal do perfil), copiar o link, avançar o status
// e anotar uma observação.

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Copy, ExternalLink, MessageCircle, Phone, RefreshCw } from 'lucide-react'
import { gerarTokenReivindicacao } from '@/lib/services/ativacao.service'
import { listarPerfisParaAtivacao, salvarObsAtivacao, salvarStatusAtivacao } from '@/lib/services/ativacaoAdmin.service'
import { montarMensagemAtivacao, rotuloAcaoAtivacao, tipoMensagemAtivacao } from '@/lib/ativacao/mensagem'
import { buildLinkWhatsapp } from '@/lib/utils/whatsapp'
import { correspondeABusca, nomeDoPerfil } from '@/lib/ativacao/lista'
import { SITE_URL } from '@/lib/divulgacao/links'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Segmented, StatCard, Textarea, cn } from '@/components/admin/ui'

// ─── Constantes ────────────────────────────────────────────────────────────────

type Perfil = Awaited<ReturnType<typeof listarPerfisParaAtivacao>>[number]
type TomBadge = 'neutro' | 'marca' | 'sucesso' | 'alerta' | 'perigo'

const STATUS = {
  nao_enviado:        { label: 'Não enviado',     tom: 'neutro' },
  enviado:            { label: 'Enviado',          tom: 'marca' },
  respondeu_positivo: { label: 'Respondeu',        tom: 'sucesso' },
  respondeu_negativo: { label: 'Recusou',          tom: 'perigo' },
  sem_whatsapp:       { label: 'Sem WhatsApp',     tom: 'alerta' },
  perfil_completo:    { label: 'Perfil completo',  tom: 'sucesso' },
  avaliacao_recebida: { label: 'Avaliado',         tom: 'marca' },
} satisfies Record<string, { label: string; tom: TomBadge }>

type StatusChave = keyof typeof STATUS
type Filtro = 'todos' | StatusChave

const CHAVES = Object.keys(STATUS) as StatusChave[]

const PROXIMOS: Partial<Record<StatusChave, StatusChave>> = {
  nao_enviado:        'enviado',
  enviado:            'respondeu_positivo',
  respondeu_positivo: 'perfil_completo',
  perfil_completo:    'avaliacao_recebida',
}

// Um status desconhecido vindo do banco não pode derrubar a tela
function infoDoStatus(status: string) {
  return STATUS[status as StatusChave] ?? STATUS.nao_enviado
}

const CLASSES_LINK =
  'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-pqf-ink ' +
  'transition-colors hover:border-pqf-blue hover:text-pqf-blue ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue focus-visible:ring-offset-2'

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function PaginaAtivacao() {
  const [prestadores, setPrestadores] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [copiado, setCopiado] = useState<number | null>(null)
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async (inicial = false) => {
    if (inicial) setLoading(true)
    else setAtualizando(true)
    try {
      setPrestadores(await listarPerfisParaAtivacao())
    } catch (e) {
      console.error('[ativacao] erro ao carregar a lista', e)
      setAviso('Não foi possível carregar a lista de perfis. Atualize a página.')
    }
    if (inicial) setLoading(false)
    else setAtualizando(false)
  }, [])

  useEffect(() => { queueMicrotask(() => carregar(true)) }, [carregar])

  // Contagem por status, sempre calculada a partir da lista
  const stats = useMemo(() => {
    const c: Record<string, number> = {}
    prestadores.forEach((p) => { c[p.ativacao_status] = (c[p.ativacao_status] || 0) + 1 })
    return c
  }, [prestadores])

  const atualizarStatus = async (id: number, novoStatus: StatusChave) => {
    setAviso('')
    setSalvando(id)
    try {
      const alterados = await salvarStatusAtivacao(Number(id), novoStatus)
      setPrestadores((prev) => prev.map((p) => (p.id === id ? ({ ...p, ...alterados } as Perfil) : p)))
    } catch (e) {
      console.error('[ativacao] erro ao salvar', e)
      setAviso('Não foi possível salvar o status. Tente novamente.')
    }
    setSalvando(null)
  }

  const salvarObs = async (id: number, obs: string) => {
    setAviso('')
    try {
      await salvarObsAtivacao(Number(id), obs)
      setPrestadores((prev) => prev.map((p) => (p.id === id ? { ...p, ativacao_obs: obs } : p)))
    } catch (e) {
      console.error('[ativacao] erro ao salvar a observação', e)
      setAviso('Não foi possível salvar a observação. Tente novamente.')
    }
  }

  // Monta o link do WhatsApp com a mensagem certa e o link pessoal do prestador.
  // O token é gerado no banco na hora do envio; perfis que já têm conta não recebem mensagem.
  const prepararEnvio = async (p: Perfil) => {
    if (p.user_id) throw new Error('PERFIL_JA_TEM_CONTA')
    if (!p.slug) throw new Error('SEM_ENDERECO')
    const token = await gerarTokenReivindicacao(Number(p.id))
    const mensagem = montarMensagemAtivacao({
      tipo: tipoMensagemAtivacao(p),
      nome: nomeDoPerfil(p),
      slug: p.slug,
      token,
    })
    const link = buildLinkWhatsapp(p.whatsapp, mensagem)
    if (!link) throw new Error('SEM_WHATSAPP')
    return link
  }

  const mensagemDeErro = (e: unknown) => {
    const codigo = e instanceof Error ? e.message : ''
    if (codigo === 'PERFIL_JA_TEM_CONTA') return 'Este perfil já tem conta: não precisa de mensagem de ativação.'
    if (codigo === 'SEM_WHATSAPP') return 'Este perfil não tem um WhatsApp válido.'
    if (codigo === 'SEM_ENDERECO') return 'Este perfil não tem endereço (slug) definido.'
    if (codigo === 'SEM_PERMISSAO') return 'Sem permissão de administrador para gerar o link.'
    return 'Não foi possível gerar o link agora. Tente novamente.'
  }

  // Devolve true quando a mensagem foi aberta, para só marcar "enviado" nesse caso
  const abrirWA = async (p: Perfil) => {
    setAviso('')
    // Abre a aba antes do await para o navegador não bloquear o pop-up
    const aba = window.open('', '_blank')
    try {
      const link = await prepararEnvio(p)
      if (aba) aba.location.href = link
      else window.location.assign(link)
      return true
    } catch (e) {
      if (aba) aba.close()
      console.error('[ativacao] erro ao preparar envio', e)
      setAviso(mensagemDeErro(e))
      return false
    }
  }

  const copiarLink = async (p: Perfil) => {
    setAviso('')
    try {
      const link = await prepararEnvio(p)
      await navigator.clipboard.writeText(link)
      setCopiado(p.id)
      setTimeout(() => setCopiado(null), 2000)
      return true
    } catch (e) {
      console.error('[ativacao] erro ao copiar link', e)
      setAviso(mensagemDeErro(e))
      return false
    }
  }

  const lista = prestadores.filter((p) => {
    const passaBusca = correspondeABusca(p, busca)
    const passaFiltro = filtro === 'todos' || p.ativacao_status === filtro
    return passaBusca && passaFiltro
  })

  const total = prestadores.length
  const contatados = total - (stats.nao_enviado || 0)
  const ativos = (stats.perfil_completo || 0) + (stats.avaliacao_recebida || 0)
  const pct = total ? Math.round((contatados / total) * 100) : 0

  const opcoesFiltro: { valor: Filtro; rotulo: string; contagem: number }[] = [
    { valor: 'todos', rotulo: 'Todos', contagem: total },
    ...CHAVES.map((k) => ({ valor: k as Filtro, rotulo: STATUS[k].label, contagem: stats[k] || 0 })),
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Ativação"
        descricao="Contato com os profissionais que ganharam perfil a partir de informações públicas."
        acoes={
          <Button
            variante="secundario"
            onClick={() => carregar(false)}
            disabled={loading || atualizando}
            icone={<RefreshCw size={16} className={atualizando ? 'animate-spin' : ''} aria-hidden="true" />}
          >
            Atualizar
          </Button>
        }
      />

      {aviso && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {aviso}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-16 text-center text-sm text-pqf-muted">Carregando perfis...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Perfis na campanha" valor={total} />
            <StatCard label="Contatados" valor={contatados} hint={`${pct}% do total`} tom="marca" />
            <StatCard label="Com perfil completo" valor={ativos} hint="Completaram ou já foram avaliados" />
          </div>

          <Card>
            <div className="space-y-4">
              <Field label="Buscar por nome ou endereço do perfil">
                <Input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite parte do nome"
                />
              </Field>
              <Segmented<Filtro> label="Filtrar por status" valor={filtro} onChange={setFiltro} opcoes={opcoesFiltro} />
            </div>
          </Card>

          <Card titulo={`Perfis (${lista.length})`}>
            {lista.length === 0 ? (
              <EmptyState
                titulo="Nenhum perfil encontrado"
                descricao={busca || filtro !== 'todos' ? 'Nenhum perfil corresponde à busca ou ao filtro.' : 'Ainda não há perfis na campanha.'}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {lista.map((p) => (
                  <LinhaPerfil
                    key={p.id}
                    p={p}
                    expandido={expandido === p.id}
                    salvando={salvando === p.id}
                    copiado={copiado === p.id}
                    onExpand={() => setExpandido(expandido === p.id ? null : p.id)}
                    onStatus={(s) => atualizarStatus(p.id, s)}
                    onCopiar={() => copiarLink(p)}
                    onAbrir={() => abrirWA(p)}
                    onObs={(obs) => salvarObs(p.id, obs)}
                  />
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Linha de um perfil ────────────────────────────────────────────────────────

interface LinhaPerfilProps {
  p: Perfil
  expandido: boolean
  salvando: boolean
  copiado: boolean
  onExpand: () => void
  onStatus: (status: StatusChave) => Promise<void>
  onCopiar: () => Promise<boolean>
  onAbrir: () => Promise<boolean>
  onObs: (obs: string) => void
}

function LinhaPerfil({ p, expandido, salvando, copiado, onExpand, onStatus, onCopiar, onAbrir, onObs }: LinhaPerfilProps) {
  const st = infoDoStatus(p.ativacao_status)
  const proximo = PROXIMOS[p.ativacao_status as StatusChave]
  const temConta = Boolean(p.user_id)
  const tipoMsg = tipoMensagemAtivacao(p)
  const [obs, setObs] = useState(p.ativacao_obs || '')
  const [editandoObs, setEditandoObs] = useState(false)

  return (
    <li>
      <button
        type="button"
        aria-expanded={expandido}
        onClick={onExpand}
        className="flex w-full items-center gap-3 rounded-lg py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-pqf-ink">{nomeDoPerfil(p)}</p>
          {p.slug && <p className="truncate text-xs text-pqf-muted">/{p.slug}</p>}
        </div>
        <Badge tom={st.tom}>{st.label}</Badge>
        {p.ativacao_enviado_em && (
          <span className="hidden shrink-0 text-xs tabular-nums text-pqf-muted sm:inline" title="Data do envio">
            {formatarData(p.ativacao_enviado_em)}
          </span>
        )}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn('shrink-0 text-slate-400 transition-transform duration-200', expandido && 'rotate-180')}
        />
      </button>

      {expandido && (
        <div className="space-y-4 pb-4 pt-1">
          {/* Ações do WhatsApp */}
          <div className="flex flex-wrap gap-2">
            <Button
              variante="primario"
              disabled={temConta}
              icone={<MessageCircle size={16} aria-hidden="true" />}
              onClick={async () => {
                const ok = await onAbrir()
                if (ok && p.ativacao_status === 'nao_enviado') await onStatus('enviado')
              }}
            >
              {rotuloAcaoAtivacao(tipoMsg, p.ativacao_status)}
            </Button>

            <Button
              variante="secundario"
              disabled={temConta}
              icone={copiado ? <CheckCircle2 size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              onClick={async () => {
                const ok = await onCopiar()
                if (ok && p.ativacao_status === 'nao_enviado') await onStatus('enviado')
              }}
            >
              {copiado ? 'Link copiado' : 'Copiar link'}
            </Button>

            {p.slug && (
              <a href={`${SITE_URL}/${p.slug}`} target="_blank" rel="noreferrer" className={CLASSES_LINK}>
                <ExternalLink size={16} aria-hidden="true" />
                Ver perfil
              </a>
            )}
          </div>

          {temConta && (
            <p className="text-xs text-pqf-muted">Este perfil já tem conta. Não precisa de mensagem de ativação.</p>
          )}

          {/* Mudar o status */}
          <div className="flex flex-wrap gap-2">
            {proximo && p.ativacao_status !== 'nao_enviado' && (
              <Button variante="secundario" disabled={salvando} onClick={() => onStatus(proximo)}>
                {salvando ? 'Salvando...' : `Marcar como ${STATUS[proximo].label}`}
              </Button>
            )}
            {(p.ativacao_status === 'enviado' || p.ativacao_status === 'respondeu_positivo') && (
              <Button variante="fantasma" disabled={salvando} onClick={() => onStatus('respondeu_negativo')}>
                Marcar como Recusou
              </Button>
            )}
            {(p.ativacao_status === 'nao_enviado' || p.ativacao_status === 'enviado') && (
              <Button
                variante="fantasma"
                disabled={salvando}
                icone={<Phone size={16} aria-hidden="true" />}
                onClick={() => onStatus('sem_whatsapp')}
              >
                Número sem WhatsApp
              </Button>
            )}
          </div>

          {/* Observação */}
          {editandoObs ? (
            <div className="space-y-2">
              <Textarea
                aria-label="Observação sobre o perfil"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={3}
                placeholder="Escreva uma observação"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variante="primario" onClick={() => { onObs(obs); setEditandoObs(false) }}>
                  Salvar observação
                </Button>
                <Button variante="secundario" onClick={() => { setObs(p.ativacao_obs || ''); setEditandoObs(false) }}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditandoObs(true)}
              className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-pqf-muted transition-colors hover:border-pqf-blue hover:text-pqf-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
            >
              {p.ativacao_obs ? p.ativacao_obs : 'Adicionar observação'}
            </button>
          )}
        </div>
      )}
    </li>
  )
}
