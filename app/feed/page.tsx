'use client'
// app/feed/page.tsx — feed de trabalhos concluídos (orquestração: liga o hook ao componente).
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { FeedCard } from '@/components/feed/FeedCard'
import { useFeed } from '@/hooks/useFeed'
import { useSession } from '@/hooks/useSession'
import { fetchCategoriasDoFiltro, type CategoriaDoFiltro } from '@/lib/services/feed.service'

export default function FeedPage() {
  const session = useSession()
  const logado = !!session
  const f = useFeed(logado)
  const [categorias, setCategorias] = useState<CategoriaDoFiltro[]>([])

  useEffect(() => { fetchCategoriasDoFiltro().then(setCategorias).catch(() => setCategorias([])) }, [])

  return (
    <>
      <Header href="/" larga />
      <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-24 md:pt-28">
        <h1 className="text-2xl font-black text-slate-900">Trabalhos concluídos</h1>
        <p className="mt-1 text-sm text-slate-600">Veja serviços reais, gostou? Abra o perfil de quem fez.</p>

        <div role="tablist" aria-label="Quais trabalhos mostrar" className="mt-4 flex w-fit gap-1 rounded-2xl bg-slate-100 p-1">
          {([['todos', 'Todos'], ['seguindo', 'Quem eu sigo']] as const).map(([id, rotulo]) => (
            <button key={id} role="tab" aria-selected={f.aba === id} onClick={() => f.setAba(id)} data-testid={`feed-aba-${id}`}
              className={`min-h-11 rounded-xl px-4 text-sm font-black ${f.aba === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>
              {rotulo}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-bold text-slate-700">
          Tipo de serviço
          <select value={f.categoriaId ?? ''} onChange={e => f.setCategoriaId(e.target.value || null)} data-testid="feed-categoria"
            className="mt-1 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="">Todos os serviços</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>

        {f.aviso && (
          <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900" data-testid="feed-aviso">
            {f.aviso} {!logado && <Link href="/login" className="font-black underline">Entrar</Link>}
          </p>
        )}
        {f.erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{f.erro}</p>}

        <div className="mt-6 space-y-5">
          {f.itens.map(item => <FeedCard key={item.projetoId} item={item} onCurtir={f.curtir} onSeguir={f.alternarSeguir} />)}
        </div>

        {f.carregando && <div className="mt-6 h-48 animate-pulse rounded-3xl bg-slate-100" aria-label="Carregando" />}

        {!f.carregando && !f.erro && f.itens.length === 0 && (
          <div className="mt-10 rounded-3xl bg-slate-50 p-6 text-center" data-testid="feed-vazio">
            {f.aba === 'seguindo' ? (
              logado
                ? <p className="text-sm font-semibold text-slate-600">Você ainda não segue ninguém, ou quem você segue não tem trabalhos aqui. Volte para “Todos” e toque em Seguir.</p>
                : <p className="text-sm font-semibold text-slate-600">Entre na sua conta para ver os trabalhos de quem você segue. <Link href="/login" className="font-black text-blue-700 underline">Entrar</Link></p>
            ) : (
              <p className="text-sm font-semibold text-slate-600">Ainda não há trabalhos aqui. Eles aparecem quando o cliente aceita e o trabalho é concluído.</p>
            )}
          </div>
        )}

        {!f.carregando && f.temMais && (
          <button type="button" onClick={f.carregarMais} data-testid="feed-mais"
            className="mt-6 min-h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700">
            Ver mais trabalhos
          </button>
        )}
      </main>
    </>
  )
}
