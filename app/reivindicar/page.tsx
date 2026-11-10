//app/reivindicar/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import Header from '@/components/Header'
import { useReivindicarPorToken } from '@/hooks/useReivindicarPorToken'

const EMAIL_CONTATO = 'procuroquemfaca@gmail.com'

function Moldura({ icone, titulo, children }: { icone: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner border border-blue-100/50">
        {icone}
      </div>
      <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-6">
        {titulo}<span className="text-blue-600">.</span>
      </h1>
      {children}
    </div>
  )
}

function SemLink({ nome, id }: { nome: string | null; id: string | null }) {
  const assunto = encodeURIComponent(`Perfil no Procuro Quem Faça${id ? ` (nº ${id})` : ''}`)
  const corpo = encodeURIComponent(
    `Olá! Sou o titular do perfil${nome ? ` "${nome}"` : ''} e quero assumir, corrigir ou remover meus dados.`
  )
  return (
    <Moldura icone="🔒" titulo="Este perfil é seu?">
      {nome && (
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6 leading-relaxed">
          Perfil: <span className="text-blue-600 text-sm">{nome}</span>
        </p>
      )}
      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm mb-8 text-left space-y-4">
        <p className="text-[11px] font-black text-slate-600 uppercase italic leading-relaxed">
          Para proteger você, só o titular consegue assumir ou excluir um perfil, usando um link pessoal.
        </p>
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
          Fale com a gente informando o nome do perfil e o WhatsApp cadastrado nele. Confirmamos que é você e enviamos o link para assumir ou excluir.
        </p>
      </div>
      <a
        href={`mailto:${EMAIL_CONTATO}?subject=${assunto}&body=${corpo}`}
        className="block w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 italic"
      >
        Pedir meu link por e-mail
      </a>
      <p className="mt-6 text-[9px] font-black text-slate-400 uppercase italic tracking-widest">
        {EMAIL_CONTATO}
      </p>
      <p className="mt-6 text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-relaxed">
        Saiba como tratamos seus dados na{' '}
        <Link href="/privacidade" className="text-blue-600 underline">Política de Privacidade</Link>
      </p>
    </Moldura>
  )
}

function ReivindicarConteudo() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const idParam = searchParams.get('id')
  const nomeParam = searchParams.get('nome')

  const {
    estado, perfil, processando, erro,
    assumirPerfil, pedirConfirmacaoExclusao, cancelarExclusao, confirmarExclusao,
  } = useReivindicarPorToken(token)

  if (estado === 'carregando') {
    return (
      <div className="text-center p-20 font-black text-slate-300 animate-pulse uppercase tracking-widest italic text-[10px]">
        Verificando seu link...
      </div>
    )
  }

  if (estado === 'sem_link') return <SemLink nome={nomeParam} id={idParam} />

  if (estado === 'link_invalido') {
    return (
      <Moldura icone="⚠️" titulo="Link inválido">
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-8">
          Este link não vale mais: já foi usado ou o perfil já foi assumido ou excluído. Se precisar, peça um novo link.
        </p>
        <a
          href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent('Preciso de um novo link de perfil')}`}
          className="block w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] italic"
        >
          Falar com a gente
        </a>
      </Moldura>
    )
  }

  if (estado === 'excluido') {
    return (
      <Moldura icone="✅" titulo="Perfil excluído">
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-8">
          Seus dados foram apagados do Procuro Quem Faça. Se mudar de ideia, você pode se cadastrar de novo quando quiser.
        </p>
        <Link
          href="/"
          className="block w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] italic"
        >
          Voltar ao início
        </Link>
      </Moldura>
    )
  }

  if (estado === 'confirmando_exclusao') {
    return (
      <Moldura icone="🗑️" titulo="Excluir perfil">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6 leading-relaxed">
          Perfil: <span className="text-blue-600 text-sm">{perfil?.nome}</span>
        </p>
        <div className="bg-white border border-red-100 p-8 rounded-[2.5rem] shadow-sm mb-8 text-left space-y-3">
          <p className="text-[11px] font-black text-red-600 uppercase italic">Esta ação é definitiva</p>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            O perfil e todos os dados dele serão apagados e não poderão ser recuperados.
          </p>
        </div>
        {erro && <p role="alert" className="mb-4 text-[11px] font-bold text-red-600">{erro}</p>}
        <button
          onClick={confirmarExclusao}
          disabled={processando}
          className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 italic mb-4"
        >
          {processando ? 'Excluindo...' : 'Sim, excluir meu perfil'}
        </button>
        <button
          onClick={cancelarExclusao}
          disabled={processando}
          className="w-full py-4 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] italic"
        >
          Voltar
        </button>
      </Moldura>
    )
  }

  return (
    <Moldura icone="🤝" titulo="Seu perfil">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 leading-relaxed">
        Perfil encontrado: <br />
        <span className="text-blue-600 text-sm">{perfil?.nome}</span>
      </p>

      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm mb-8 text-left space-y-5">
        <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest italic border-b border-slate-50 pb-2">
          Se você assumir
        </h4>
        <ul className="space-y-4">
          <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase italic">
            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 font-black">✓</div>
            Edição total de fotos e biografia
          </li>
          <li className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase italic">
            <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 font-black">✓</div>
            Você decide o que fica visível
          </li>
        </ul>
      </div>

      <button
        onClick={assumirPerfil}
        disabled={processando}
        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 italic mb-4"
      >
        {processando ? 'Preparando...' : 'Assumir este perfil'}
      </button>

      <button
        onClick={pedirConfirmacaoExclusao}
        disabled={processando}
        className="w-full py-5 bg-white border border-red-100 text-red-600 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-50 transition-all active:scale-95 italic"
      >
        Prefiro excluir meu perfil
      </button>

      <p className="mt-8 text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-relaxed">
        Este perfil foi montado a partir de informações públicas de contato profissional. <br />
        Você tem o direito de assumir, corrigir ou excluir. Veja a{' '}
        <Link href="/privacidade" className="text-blue-600 underline">Política de Privacidade</Link>.
      </p>
    </Moldura>
  )
}

export default function PaginaReivindicar() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans pt-32">
      <Header href="/" />
      <Suspense fallback={
        <div className="text-center p-20 font-black text-slate-300 animate-pulse uppercase tracking-widest italic text-[10px]">
          Sincronizando dados...
        </div>
      }>
        <ReivindicarConteudo />
      </Suspense>
    </main>
  )
}
