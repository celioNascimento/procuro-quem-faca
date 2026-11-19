'use client'
// app/feed/page.tsx — feed de trabalhos (orquestração: liga o hook ao componente).
// Tipo de serviço, estado e cidade ficam no endereço (/feed?categoria=…&estado=…&cidade=…): dá para compartilhar, voltar e recarregar.
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import { FeedCard } from '@/components/feed/FeedCard'
import { FiltrosDoFeed } from '@/components/feed/FiltrosDoFeed'
import { useFeed } from '@/hooks/useFeed'
import { useCompartilharTrabalho } from '@/hooks/useCompartilharTrabalho'
import { useSession } from '@/hooks/useSession'
import { fetchCategoriasDoFiltro, fetchCidadesDoFeed, type CategoriaDoFiltro } from '@/lib/services/feed.service'
import {
  cidadesDoEstado, estadosDoFeed, filtrosAoTrocarEstado, lerFiltrosDaUrl, montarEnderecoDoFeed, temFiltroAtivo,
  type CidadeDoFeed, type FiltrosFeed,
} from '@/lib/feed/filtros'

function FeedConteudo() {
  const session = useSession()
  const logado = !!session
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filtros = lerFiltrosDaUrl(searchParams)
  const f = useFeed(logado, filtros)
  const c = useCompartilharTrabalho()
  const [categorias, setCategorias] = useState<CategoriaDoFiltro[]>([])
  const [cidades, setCidades] = useState<CidadeDoFeed[]>([])

  useEffect(() => { fetchCategoriasDoFiltro().then(setCategorias).catch(() => setCategorias([])) }, [])
  useEffect(() => { fetchCidadesDoFeed().then(setCidades).catch(() => setCidades([])) }, [])

  // replace (e não push): trocar de filtro não deve encher o "voltar" do celular.
  function mudarFiltros(novos: Partial<FiltrosFeed>) {
    router.replace(montarEnderecoDoFeed(pathname, { ...filtros, ...novos }), { scroll: false })
  }

  const estados = estadosDoFeed(cidades)
  const cidadesVisiveis = cidadesDoEstado(cidades, filtros.estado)
  // Ao trocar o estado, a cidade escolhida só fica se for daquele estado.
  function mudarEstado(estado: string | null) {
    router.replace(montarEnderecoDoFeed(pathname, filtrosAoTrocarEstado(filtros, estado, cidades)), { scroll: false })
  }

  const filtrando = temFiltroAtivo(filtros)

  return (
    <>
      <Header href="/" larga feedAtivo />
      <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-24 md:pt-28">
        <h1 className="text-2xl font-black text-slate-900">Feed de trabalhos</h1>
        <p className="mt-1 text-sm text-slate-600">Veja serviços reais, gostou? Abra o perfil de quem fez.</p>

        <div role="tablist" aria-label="Quais trabalhos mostrar" className="mt-4 flex w-fit gap-1 rounded-2xl bg-slate-100 p-1">
          {([['todos', 'Todos'], ['seguindo', 'Quem eu sigo'], ['salvos', 'Salvos']] as const).map(([id, rotulo]) => (
            <button key={id} role="tab" aria-selected={f.aba === id} onClick={() => f.setAba(id)} data-testid={`feed-aba-${id}`}
              className={`min-h-11 rounded-xl px-4 text-sm font-black ${f.aba === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>
              {rotulo}
            </button>
          ))}
        </div>

        <FiltrosDoFeed
          filtros={filtros} categorias={categorias} estados={estados} cidades={cidadesVisiveis}
          onMudar={mudarFiltros} onMudarEstado={mudarEstado}
          onLimpar={() => mudarFiltros({ categoriaId: null, cidadeId: null, estado: null })}
        />

        {f.aviso && (
          <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900" data-testid="feed-aviso">
            {f.aviso} {!logado && <Link href="/login" className="font-black underline">Entrar</Link>}
          </p>
        )}
        {c.confirmacao && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800" data-testid="feed-link-copiado">{c.confirmacao}</p>}
        {c.erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{c.erro}</p>}
        {f.erro && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{f.erro}</p>}

        <div className="mt-6 space-y-5">
          {f.itens.map(item => <FeedCard key={item.projetoId} item={item} onCurtir={f.curtir} onSeguir={f.alternarSeguir} onSalvar={f.salvar} onCompartilhar={c.compartilhar} onCopiarLink={c.copiarLink} />)}
        </div>

        {f.carregando && <div className="mt-6 h-48 animate-pulse rounded-3xl bg-slate-100" aria-label="Carregando" />}

        {!f.carregando && !f.erro && f.itens.length === 0 && (
          <div className="mt-10 rounded-3xl bg-slate-50 p-6 text-center" data-testid="feed-vazio">
            {f.aba === 'salvos' ? (
              logado
                ? <p className="text-sm font-semibold text-slate-600" data-testid="feed-salvos-vazio">Você ainda não salvou nenhum trabalho. Toque no marcador de um trabalho para guardá-lo aqui. Só você vê o que salvou.</p>
                : <p className="text-sm font-semibold text-slate-600">Entre na sua conta para ver os trabalhos que você salvou. <Link href="/login" className="font-black text-blue-700 underline">Entrar</Link></p>
            ) : f.aba === 'seguindo' ? (
              logado
                ? <p className="text-sm font-semibold text-slate-600">Você ainda não segue ninguém, ou quem você segue não tem trabalhos aqui. Volte para “Todos” e toque em Seguir.</p>
                : <p className="text-sm font-semibold text-slate-600">Entre na sua conta para ver os trabalhos de quem você segue. <Link href="/login" className="font-black text-blue-700 underline">Entrar</Link></p>
            ) : filtrando ? (
              <>
                <p className="text-sm font-semibold text-slate-600">Nenhum trabalho com esses filtros.</p>
                <button type="button" onClick={() => mudarFiltros({ categoriaId: null, cidadeId: null, estado: null })} data-testid="feed-limpar-filtros"
                  className="mt-3 min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-blue-700">
                  Ver todos os trabalhos
                </button>
              </>
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

// useSearchParams exige Suspense para a página poder ser gerada no build.
export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedConteudo />
    </Suspense>
  )
}
