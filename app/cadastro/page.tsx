//app/cadastro/page.tsx

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import CadastroCard from '@/components/auth/CadastroCard'
import ModalConfirmacao from '@/components/ui/ModalConfirmacao'
import { ErrorModal } from '@/components/ui/ErrorModal'

import { SecaoAcessoCadastro } from '@/components/auth/SecaoAcessoCadastro'
import { SecaoAcessoLogado } from '@/components/auth/SecaoAcessoLogado'
import { FotoUpload } from '@/components/perfil/FotoUpload'
import { SecaoOQueVoceFaz } from '@/components/perfil/SecaoOQueVoceFaz'
import { SecaoDadosPessoais } from '@/components/perfil/SecaoDadosPessoais'
import { SecaoLocalizacao } from '@/components/perfil/SecaoLocalizacao'
import { SecaoTermos } from '@/components/perfil/SecaoTermos'
import { SecaoGarantia } from '@/components/perfil/SecaoGarantia'

import { useCadastroPrestador } from '@/hooks/useCadastroPrestador'
import { useAuth } from '@/hooks/useAuth'

const inputStyleBase = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-[14px] text-slate-800 bg-white shadow-sm placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400`

function CadastroSkeleton() {
  const bloco = 'bg-white rounded-[2rem] border border-slate-100 shadow-sm'

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased overflow-x-hidden animate-pulse">
      {/* Header fixo idêntico ao real */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 md:h-20 flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="w-9 h-9 rounded-full bg-slate-100" />
          <div className="h-10 md:h-12 w-32 bg-slate-100 rounded-lg" />
          <div className="w-10" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
          <div className="h-full bg-blue-100" style={{ width: '35%' }} />
        </div>
      </nav>

      <div className="w-full px-4 pt-32 md:pt-40 max-w-5xl mx-auto">
        {/* Título + progresso, igual ao header do CadastroCard */}
        <div className="mb-10 pl-2 flex justify-between items-end">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-slate-200 rounded-lg" />
            <div className="h-3 w-24 bg-blue-100 rounded" />
          </div>
        </div>

        {/* Blocos empilhados, na mesma ordem do form real */}
        <div className="flex flex-col gap-6">
          {/* Foto */}
          <div className={`${bloco} p-6 flex items-center gap-4`}>
            <div className="w-20 h-20 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Acesso (email/senha) */}
          <div className={`${bloco} p-6 space-y-3`}>
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
          </div>

          {/* O que você faz */}
          <div className={`${bloco} p-6 space-y-3`}>
            <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="h-8 w-20 bg-slate-50 rounded-full" />
              <div className="h-8 w-24 bg-slate-50 rounded-full" />
              <div className="h-8 w-16 bg-slate-50 rounded-full" />
            </div>
          </div>

          {/* Dados pessoais */}
          <div className={`${bloco} p-6 space-y-3`}>
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-24 bg-slate-50 rounded-2xl" />
          </div>

          {/* Localização */}
          <div className={`${bloco} p-6 space-y-3`}>
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
            <div className="h-12 bg-slate-50 rounded-2xl" />
          </div>

          {/* Termos */}
          <div className={`${bloco} p-6 space-y-2`}>
            <div className="h-4 w-full max-w-md bg-slate-50 rounded" />
            <div className="h-4 w-full max-w-sm bg-slate-50 rounded" />
          </div>

          {/* Botão submit */}
          <div className="w-full h-16 bg-slate-100 rounded-[2rem]" />
        </div>
      </div>
    </main>
  )
}

function FormularioCadastro() {
  const searchParams = useSearchParams()
  const reivindicarId = searchParams.get('reivindicar')

  const { prestadorStatus } = useAuth()

  const {
    form, categorias, loc, slugCheck,
    mounted, loading, enviando, uploading, isRedirecting, isModalOpen, setIsModalOpen,
    status, tentouEnviar, modoEdicao,
    userLogado, email, setEmail, senha, setSenha, confirmarSenha, setConfirmarSenha,
    aceitouTermos, setAceitouTermos, aceitouPrivacidade, setAceitouPrivacidade,
    errorModal, setErrorModal,
    handleUploadFotoProcess, handleExcluirPerfil, calcularProgresso, handleSubmit, handleLogout,
  } = useCadastroPrestador(reivindicarId)

  // Skeleton reflete apenas o carregamento inicial da página.
  // O envio do formulário (enviando) NÃO deve reativar o skeleton — ver handleSubmit no hook.
  if (!mounted || loading || isRedirecting) return <CadastroSkeleton />

  // Garante que mesmo logado, se o cadastro for pendente, tratamos como novo para forçar Termos
  const isPendente = prestadorStatus === 'pendente' || !modoEdicao

  // Validação estrita para habilitar o botão
  const faltamTermos = isPendente && (!aceitouTermos || !aceitouPrivacidade)
  const progressoTotal = calcularProgresso() === 100
  const podeEnviar = progressoTotal && slugCheck.disponivel && !uploading && !enviando && !faltamTermos

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased overflow-x-hidden">

      <ErrorModal
        show={errorModal.show}
        title={errorModal.title}
        message={errorModal.message}
        actionText={errorModal.actionText}
        actionUrl={errorModal.actionUrl}
        onClose={() => setErrorModal({ ...errorModal, show: false })}
      />

      <Header href="/" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 md:h-20 flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <BackButton href="/" />
          <Link href="/"><img src="/logo.png" alt="Logo" className="h-10 md:h-12 w-auto" /></Link>
          <div className="w-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${calcularProgresso()}%` }} />
        </div>
      </nav>

      <div className="w-full px-4 pt-32 md:pt-40 max-w-5xl mx-auto">
        <CadastroCard
          title={reivindicarId ? 'Assumir Perfil' : (modoEdicao && !isPendente) ? 'Meu Perfil' : 'Finalizar Cadastro'}
          progresso={calcularProgresso()}
          isReivindicando={!!reivindicarId || (modoEdicao && !isPendente)}
          onExcluir={() => setIsModalOpen(true)}
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">

            <div className="col-span-12 md:col-span-4 space-y-6">
              <FotoUpload
                fotoUrl={form.formData.foto_perfil}
                uploading={uploading}
                tentouEnviar={tentouEnviar}
                onChange={handleUploadFotoProcess}
                variant="cadastro"
              />
            </div>

            <div className="col-span-12 md:col-span-8 space-y-6">

              {!userLogado ? (
                <SecaoAcessoCadastro
                  email={email}
                  senha={senha}
                  confirmarSenha={confirmarSenha}
                  tentouEnviar={tentouEnviar}
                  onEmailChange={setEmail}
                  onSenhaChange={setSenha}
                  onConfirmarSenhaChange={setConfirmarSenha}
                />
              ) : (
                <SecaoAcessoLogado
                  user={userLogado}
                  senha={senha}
                  confirmarSenha={confirmarSenha}
                  tentouEnviar={tentouEnviar}
                  inputStyle={inputStyleBase}
                  onSenhaChange={setSenha}
                  onConfirmarSenhaChange={setConfirmarSenha}
                  onLogout={handleLogout}
                />
              )}

              <SecaoOQueVoceFaz
                grupoId={form.formData.grupo_id}
                categoriaId={form.formData.categoria_id}
                habilidades={form.formData.habilidades}
                listaGrupos={categorias.listaGrupos}
                listaCategorias={categorias.listaCategorias}
                inputStyle={inputStyleBase}
                onGrupoChange={(id) => { form.handleGrupoChange(id); categorias.carregarCategorias(id) }}
                onCategoriaChange={(id) => form.set({ categoria_id: id, habilidades: [] })}
                onToggleHabilidade={(h) => form.toggleItem(h, 'habilidades')}
              />

              <SecaoDadosPessoais
                nome={form.formData.nome}
                slug={form.formData.slug}
                whatsapp={form.formData.whatsapp}
                bio={form.formData.bio}
                slugDisponivel={slugCheck.disponivel}
                checandoSlug={slugCheck.checando}
                inputStyle={inputStyleBase}
                onNomeChange={form.handleNomeChange}
                onSlugChange={form.handleSlugChange}
                onWhatsappChange={form.handleWhatsappChange}
                onBioChange={(v) => form.set({ bio: v })}
              />

              <SecaoGarantia
                garantiaDias={form.formData.garantia_dias}
                onChange={(dias) => form.set({ garantia_dias: dias })}
              />

              <SecaoLocalizacao
                estadoSigla={form.formData.estado_sigla}
                regiaoId={form.formData.regiao_id}
                cidadeId={form.formData.cidade_id}
                bairro={form.formData.bairro || ''}
                cidadesAtendidas={form.formData.cidades_atendidas || []}
                listaEstados={loc.listaEstados}
                listaRegioes={loc.listaRegioes}
                listaCidades={loc.listaCidades}
                cidadesRegiao={loc.cidadesRegiao}
                inputStyle={inputStyleBase}
                onEstadoChange={(sigla) => { form.handleEstadoChange(sigla); loc.carregarRegioes(sigla); loc.carregarCidades(null, sigla) }}
                onRegiaoChange={(id) => { form.handleRegiaoChange(id); loc.carregarCidades(id, form.formData.estado_sigla) }}
                onCidadeChange={(id) => form.set({ cidade_id: id })}
                onBairroChange={(v) => form.set({ bairro: v })}
                onToggleCidade={(nome) => form.toggleItem(nome, 'cidades_atendidas')}
              />

              {/* Exibe os Termos obrigatoriamente se o perfil for novo ou estiver pendente */}
              {isPendente && (
                <SecaoTermos
                  aceitouTermos={aceitouTermos}
                  aceitouPrivacidade={aceitouPrivacidade}
                  onTermosChange={setAceitouTermos}
                  onPrivacidadeChange={setAceitouPrivacidade}
                />
              )}

              <div className="flex flex-col items-center">
                {status && (
                  <div className={`w-full mb-4 p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-wider animate-in fade-in ${status.startsWith('❌') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-600'
                    }`}>
                    {status}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando || uploading || !podeEnviar}
                  className={`w-full py-6 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest transition-all shadow-xl ${podeEnviar
                    ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {enviando || uploading ? 'Sincronizando...' : (modoEdicao && !isPendente ? 'Salvar Alterações' : (reivindicarId ? 'Assumir Perfil' : 'Finalizar Cadastro'))}
                </button>
              </div>

            </div>
          </form>
        </CadastroCard>
      </div>

      <ModalConfirmacao isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleExcluirPerfil} title="Excluir Perfil?" message="Esta ação apagará seus dados permanentemente." />
    </main>
  )
}

export default function CadastroPage() {
  return <Suspense fallback={<CadastroSkeleton />}><FormularioCadastro /></Suspense>
}
