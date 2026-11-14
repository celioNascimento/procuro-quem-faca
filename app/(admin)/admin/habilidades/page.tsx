'use client'

import { useState, type FormEvent } from 'react'
import { Layers3, Plus, RefreshCw, Sparkles, Star, Wrench, Home, Hammer, BriefcaseBusiness, Heart, Car } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useHabilidades } from '@/hooks/useHabilidades'
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Textarea } from '@/components/admin/ui'
import { categoriasSemExemplo, MAX_EXEMPLO } from '@/lib/catalogo/exemploCategoria'

const iconMap: Record<string, LucideIcon> = { sparkles: Sparkles, home: Home, hammer: Hammer, wrench: Wrench, briefcase: BriefcaseBusiness, heart: Heart, car: Car }

function GroupIcon({ name, className = '' }: { name?: string | null; className?: string }) {
  const Icon = iconMap[(name ?? '').trim().toLowerCase()] ?? Layers3
  return <Icon aria-hidden="true" className={className} />
}

export default function GestaoHabilidades() {
  const { grupos, categorias, loading, saving, error, adicionarGrupo, adicionarCategoria, salvarExemplo, recarregar } = useHabilidades()
  const [grupoNome, setGrupoNome] = useState('')
  const [grupoIcone, setGrupoIcone] = useState('')
  const [grupoOrdem, setGrupoOrdem] = useState('0')
  const [categoriaNome, setCategoriaNome] = useState('')
  const [categoriaGrupo, setCategoriaGrupo] = useState('')
  const [destaque, setDestaque] = useState(false)
  const [categoriaExemplo, setCategoriaExemplo] = useState('')
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const semExemplo = categoriasSemExemplo(categorias)

  async function submitGrupo(event: FormEvent) {
    event.preventDefault(); setFeedback(null)
    const result = await adicionarGrupo(grupoNome, grupoIcone, Number(grupoOrdem) || 0)
    if (result.ok) { setGrupoNome(''); setGrupoIcone(''); setGrupoOrdem('0'); setFeedback('Grupo cadastrado com sucesso.') } else setFeedback(result.error)
  }

  async function submitCategoria(event: FormEvent) {
    event.preventDefault(); setFeedback(null)
    const result = await adicionarCategoria(categoriaNome, categoriaGrupo, destaque, categoriaExemplo)
    if (result.ok) { setCategoriaNome(''); setCategoriaGrupo(''); setDestaque(false); setCategoriaExemplo(''); setFeedback('Categoria cadastrada com sucesso.') } else setFeedback(result.error)
  }

  async function submitExemplo(event: FormEvent) {
    event.preventDefault(); setFeedback(null)
    if (!editando) return
    const result = await salvarExemplo(editando.id, editando.texto)
    if (result.ok) { setEditando(null); setFeedback('Exemplo salvo.') } else setFeedback(result.error)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader
        titulo="Habilidades"
        descricao="Organize serviços em grupos e categorias para manter a busca simples e consistente."
        acoes={
          <Button variante="secundario" onClick={recarregar} icone={<RefreshCw size={16} aria-hidden="true" />}>
            Atualizar
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card titulo="Novo grupo" descricao="Ex.: Manutenção, Beleza">
            <form onSubmit={submitGrupo} className="flex flex-col gap-4">
              <Field label="Nome do grupo">
                <Input required value={grupoNome} onChange={e => setGrupoNome(e.target.value)} placeholder="Nome do grupo" />
              </Field>
              <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3">
                <Field label="Ícone">
                  <Input value={grupoIcone} onChange={e => setGrupoIcone(e.target.value)} placeholder="home" />
                  <span className="text-xs text-pqf-muted">home, hammer, wrench</span>
                </Field>
                <Field label="Ordem">
                  <Input type="number" value={grupoOrdem} onChange={e => setGrupoOrdem(e.target.value)} />
                </Field>
              </div>
              <Button type="submit" variante="primario" disabled={saving} icone={<Plus size={16} aria-hidden="true" />} className="justify-center">
                Cadastrar grupo
              </Button>
            </form>
          </Card>

          <Card titulo="Nova categoria" descricao="Vincule ao grupo certo">
            <form onSubmit={submitCategoria} className="flex flex-col gap-4">
              <Field label="Nome da categoria">
                <Input required value={categoriaNome} onChange={e => setCategoriaNome(e.target.value)} placeholder="Ex.: Instalação elétrica" />
              </Field>
              <Field label="Grupo">
                <Select required value={categoriaGrupo} onChange={e => setCategoriaGrupo(e.target.value)}>
                  <option value="">Selecione um grupo</option>
                  {grupos.map(grupo => <option key={grupo.id} value={String(grupo.id)}>{grupo.nome}</option>)}
                </Select>
              </Field>
              <Field label="Exemplo de descrição do trabalho">
                <Textarea
                  required
                  rows={3}
                  maxLength={MAX_EXEMPLO}
                  value={categoriaExemplo}
                  onChange={e => setCategoriaExemplo(e.target.value)}
                  placeholder="Uma frase do que foi feito, no tom do ofício"
                />
                <span className="text-xs text-pqf-muted">
                  Obrigatório em toda categoria nova. Aparece como sugestão no campo &quot;Depois&quot; do trabalho do prestador. Escreva como alguém dessa área escreveria, por exemplo: &quot;Troca da fiação do quadro e instalação de disjuntor novo.&quot; para eletricista.
                </span>
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-pqf-ink">
                <input type="checkbox" checked={destaque} onChange={e => setDestaque(e.target.checked)} className="size-4 accent-pqf-blue" />
                <Star size={16} aria-hidden="true" className="text-pqf-yellow" /> Marcar como destaque
              </label>
              <Button type="submit" variante="primario" disabled={saving || grupos.length === 0} icone={<Plus size={16} aria-hidden="true" />} className="justify-center">
                Cadastrar categoria
              </Button>
            </form>
          </Card>

          {feedback && <p role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-pqf-ink">{feedback}</p>}
        </div>

        <Card
          titulo="Grupos e categorias"
          descricao="Estrutura atual do catálogo"
          acoes={
            <div className="flex flex-wrap items-center gap-2">
              {semExemplo.length > 0 && <Badge tom="alerta">{semExemplo.length} sem exemplo</Badge>}
              <Badge tom="marca">{categorias.length} categorias</Badge>
            </div>
          }
          className="min-w-0"
        >
          {loading ? (
            <p className="flex min-h-80 items-center justify-center text-sm text-pqf-muted" role="status">Carregando catálogo...</p>
          ) : error ? (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : grupos.length === 0 ? (
            <EmptyState titulo="Nenhum grupo cadastrado" descricao="Comece criando o primeiro grupo ao lado." />
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              {grupos.map(grupo => {
                const items = categorias.filter(categoria => String(categoria.grupo_id) === String(grupo.id))
                return (
                  <article key={grupo.id} className="min-w-0 rounded-xl border border-slate-200 p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pqf-blue-soft text-pqf-blue">
                          <GroupIcon name={grupo.icone} className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-pqf-ink">{grupo.nome}</h3>
                          <p className="text-xs text-pqf-muted">{items.length} {items.length === 1 ? 'categoria' : 'categorias'}</p>
                        </div>
                      </div>
                      <Badge tom="neutro">Ordem {grupo.ordem ?? 0}</Badge>
                    </div>
                    {items.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                        {items.map(item => {
                          const emEdicao = editando?.id === String(item.id)
                          const temExemplo = !!(item.exemplo_descricao ?? '').trim()
                          return (
                            <div key={item.id} className={`min-w-0 rounded-lg bg-slate-50 px-3 py-2 text-sm text-pqf-ink ${emEdicao ? 'sm:col-span-2' : ''}`}>
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="size-1.5 shrink-0 rounded-full bg-pqf-blue" aria-hidden="true" />
                                <span className="truncate">{item.nome}</span>
                                {item.destaque && <Star aria-label="Categoria em destaque" className="ml-auto size-4 shrink-0 text-pqf-yellow" />}
                              </div>
                              {emEdicao ? (
                                <form onSubmit={submitExemplo} className="mt-2 flex flex-col gap-2">
                                  <Textarea
                                    required
                                    rows={3}
                                    maxLength={MAX_EXEMPLO}
                                    aria-label={`Exemplo de descrição de ${item.nome}`}
                                    value={editando.texto}
                                    onChange={e => setEditando({ id: editando.id, texto: e.target.value })}
                                  />
                                  <div className="flex gap-2">
                                    <Button type="submit" variante="primario" disabled={saving}>Salvar exemplo</Button>
                                    <Button type="button" variante="secundario" onClick={() => setEditando(null)}>Cancelar</Button>
                                  </div>
                                </form>
                              ) : (
                                <div className="mt-1 flex items-start justify-between gap-2">
                                  {temExemplo
                                    ? <p className="text-xs text-pqf-muted">{item.exemplo_descricao}</p>
                                    : <Badge tom="alerta">Sem exemplo</Badge>}
                                  <button
                                    type="button"
                                    onClick={() => setEditando({ id: String(item.id), texto: item.exemplo_descricao ?? '' })}
                                    className="shrink-0 text-xs font-semibold text-pqf-blue hover:underline"
                                  >
                                    {temExemplo ? 'Editar exemplo' : 'Escrever exemplo'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
