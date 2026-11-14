// app/painel/perfil/page.tsx

'use client'
import { useState } from 'react'
import {
  MapPin, Briefcase, Loader2, CheckCircle2,
  Save, AlertCircle, Star, ArrowRight, ShieldAlert, MessageCircleWarning,
} from 'lucide-react'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import CardPerfilCliente from '@/components/perfil/CardPerfilCliente'
import ServicoCardCompacto from '@/components/meus-servicos/ServicoCardCompacto'
import { AdCardPainelCliente } from '@/components/painel/AdCardPainelCliente'
import { CardResumoAvaliacoesCliente } from '@/components/painel/CardResumoAvaliacoesCliente'
import { usePerfilCliente } from '@/hooks/usePerfilCliente'
import PainelDoClienteSkeleton from '@/components/skeletons/PainelDoClienteSkeleton'
import { ContextualHelp } from '@/components/help/HelpCenter'
import DangerZone from '@/components/account/DangerZone'
import { DialogoAviso, DialogoConfirmacao } from '@/components/ui/Dialogo'

export default function PerfilDoCliente() {
  const {
    fileInputRef,
    filtroRef,
    irParaAvaliar,
    aba, setAba,
    filtroStatus, setFiltroStatus,
    loading,
    perfilCarregado,
    uploading,
    loadingServicos,
    showSuccess,
    errorModal, setErrorModal,
    confirmLeaveModal, confirmarSaida, cancelarSaida,
    servicos,
    isDirty,
    listaEstados,
    listaCidades,
    perfil,
    aplicarMascara,
    irPara,
    handleChangePerfil,
    handleUploadFoto,
    atualizar,
    getStatusInfo,
    getRota,
    idsComGarantiaAtiva,
    idsComReclamacaoAtiva,
    servicosFiltrados,
    avaliarCount,
    ativosCount,
    garantiaCount,
    reclamacaoCount,
    pendentesCount,
    andamentoCount,
    finalizadosCount,
  } = usePerfilCliente()

  const [temAvaliacoesRecebidas, setTemAvaliacoesRecebidas] = useState(false)

  // `loading` NÃO entra aqui: ele liga ao salvar, e a tela inteira virava esqueleto no meio do salvamento.
  if (!perfilCarregado || loadingServicos) {
    return <PainelDoClienteSkeleton />
  }

  // Quantos cartões de aviso existem de fato (para só dizer "deslize" quando há o que deslizar).
  const quantidadeDeAvisos =
    (avaliarCount > 0 ? 1 : 0) + (garantiaCount > 0 ? 1 : 0) + (reclamacaoCount > 0 ? 1 : 0) + (temAvaliacoesRecebidas ? 1 : 0)

  const inputStyle = `w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none transition-all font-medium text-slate-800 bg-white shadow-sm placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400 text-[14px] md:text-[15px]`

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-12 font-sans antialiased">
      <HeaderCliente nomeCliente={perfil.full_name} />

      <input type="file" ref={fileInputRef} onChange={handleUploadFoto} accept="image/*" className="hidden" />

      <DialogoConfirmacao
        aberto={confirmLeaveModal.show}
        titulo="Sair sem salvar?"
        mensagem="Suas alterações serão perdidas."
        textoCancelar="Continuar editando"
        textoConfirmar="Sair sem salvar"
        perigo
        onCancelar={cancelarSaida}
        onConfirmar={confirmarSaida}
      />

      <DialogoAviso
        aberto={errorModal.show}
        titulo={errorModal.title}
        mensagem={errorModal.message}
        onFechar={() => setErrorModal({ ...errorModal, show: false })}
      />

      {showSuccess && (
        <div role="status" className="fixed top-20 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border border-green-100 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1"><CheckCircle2 className="text-white" size={14} /></div>
            <p className="text-[12px] font-bold text-slate-800">Salvo com sucesso</p>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-24 animate-in fade-in duration-500 sm:px-6 md:pt-26 lg:px-8">
        <header className="mb-6 flex max-w-2xl flex-col gap-2 sm:mb-8">
          <p className="text-xs font-semibold text-blue-700">Área do cliente</p>
          <h1 className="text-balance text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Acompanhe seus trabalhos</h1>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="min-w-0 lg:sticky lg:top-22">
            <div className="flex flex-col gap-4">
              <CardPerfilCliente
                nome={perfil.full_name}
                email={perfil.email}
                avatarUrl={perfil.avatar_url}
                bairro={perfil.bairro}
                cidade={perfil.cidade}
                uf={perfil.uf}
                ativosCount={ativosCount}
                totalCount={servicos.length}
                uploading={uploading}
                onUploadClick={() => !uploading && fileInputRef.current?.click()}
              />
            </div>
          </aside>

          {/*
            AJUSTE: gap-2 → gap-3 para ritmo consistente.
            Removidos -mx-1 e -mt-2 do carrossel — esses negativos
            cancelavam o gap do pai e criavam o espaço irregular entre
            o AdCard e os alertas.
          */}
          <div className="flex min-w-0 flex-col gap-3">
            <AdCardPainelCliente servicos={servicos} loading={loadingServicos} />

            {(avaliarCount > 0 || garantiaCount > 0 || reclamacaoCount > 0 || temAvaliacoesRecebidas) && (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-0 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
                {avaliarCount > 0 && (
                  <button
                    onClick={irParaAvaliar}
                    className="group flex min-h-24 w-[calc(100vw-2.5rem)] shrink-0 snap-start items-center gap-3 rounded-2xl bg-blue-600 p-4 sm:w-full sm:shrink text-left shadow-md shadow-blue-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 animate-in fade-in duration-500 sm:p-5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-11">
                      <Star size={22} className="text-white" fill="white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base leading-tight">
                        {avaliarCount === 1 ? '1 trabalho aguarda sua avaliação' : `${avaliarCount} trabalhos aguardam sua avaliação`}
                      </p>
                      <p className="text-blue-50 text-xs font-medium mt-1">Toque para avaliar e concluir</p>
                    </div>
                    <ArrowRight size={20} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
                  </button>
                )}

                {garantiaCount > 0 && (
                  <button
                    onClick={() => { setAba('servicos'); setFiltroStatus('garantia') }}
                    className="group flex min-h-24 w-[calc(100vw-2.5rem)] shrink-0 snap-start items-center gap-3 rounded-2xl bg-orange-700 p-4 sm:w-full sm:shrink text-left shadow-md shadow-orange-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 animate-in fade-in duration-500 sm:p-5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-11">
                      <ShieldAlert size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base leading-tight">
                        {garantiaCount === 1 ? '1 caso de garantia em aberto' : `${garantiaCount} casos de garantia em aberto`}
                      </p>
                      <p className="text-orange-50 text-xs font-medium mt-1">Toque para acompanhar</p>
                    </div>
                    <ArrowRight size={20} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
                  </button>
                )}

                {reclamacaoCount > 0 && (
                  <button
                    onClick={() => { setAba('servicos'); setFiltroStatus('reclamacao') }}
                    className="group flex min-h-24 w-[calc(100vw-2.5rem)] shrink-0 snap-start items-center gap-3 rounded-2xl bg-orange-700 p-4 sm:w-full sm:shrink text-left shadow-md shadow-orange-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 animate-in fade-in duration-500 sm:p-5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:size-11">
                      <MessageCircleWarning size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-base leading-tight">
                        {reclamacaoCount === 1 ? '1 reclamação em aberto' : `${reclamacaoCount} reclamações em aberto`}
                      </p>
                      <p className="text-orange-50 text-xs font-medium mt-1">Toque para acompanhar</p>
                    </div>
                    <ArrowRight size={20} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
                  </button>
                )}

                <CardResumoAvaliacoesCliente
                  onVisibilidadeChange={setTemAvaliacoesRecebidas}
                  onClick={() => setAba('servicos')}
                />
              </div>
            )}

            {quantidadeDeAvisos >= 2 && (
              <p className="text-center text-xs font-medium text-slate-500 sm:hidden">
                Deslize para ver mais avisos
              </p>
            )}

            <nav
              className="sticky top-16 z-40 flex gap-1 rounded-2xl border border-slate-200 bg-[#F8FAFC]/95 p-1.5 shadow-sm backdrop-blur-md md:top-18"
              aria-label="Seções do painel"
            >
              {[{ id: 'servicos', label: 'Meus trabalhos' }, { id: 'dados', label: 'Minha conta' }].map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAba(a.id)}
                  aria-current={aba === a.id ? 'page' : undefined}
                  className={`min-h-11 flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                    aba === a.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </nav>

            {aba === 'servicos' ? (
              <section className="flex flex-col gap-4 pb-4" aria-label="Seus trabalhos">

                {/* ── Filtros ── */}
                <div
                  ref={filtroRef}
                  className="flex gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {[
                    { id: 'todos',       label: `Todos (${servicos.length})` },
                    { id: 'pendente',    label: `Para aceitar (${pendentesCount})` },
                    { id: 'andamento',   label: `Em andamento (${andamentoCount})` },
                    { id: 'avaliar',     label: `Avaliar (${avaliarCount})` },
                    { id: 'finalizados', label: `Concluídos (${finalizadosCount})` },
                    ...(garantiaCount > 0 ? [{ id: 'garantia', label: `Garantia (${garantiaCount})` }] : []),
                    ...(reclamacaoCount > 0 ? [{ id: 'reclamacao', label: `Reclamação (${reclamacaoCount})` }] : []),
                  ].map(f => {
                    const ehCasoAtivo = f.id === 'garantia' || f.id === 'reclamacao'
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFiltroStatus(f.id)}
                        type="button"
                        aria-pressed={filtroStatus === f.id}
                        className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 ${
                          filtroStatus === f.id
                            ? ehCasoAtivo
                              ? 'border-orange-700 bg-orange-700 text-white shadow-sm focus-visible:ring-orange-100'
                              : 'border-blue-600 bg-blue-600 text-white shadow-sm focus-visible:ring-blue-100'
                            : ehCasoAtivo
                              ? 'border-orange-200 bg-white text-orange-700 hover:border-orange-300 focus-visible:ring-orange-100'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600 focus-visible:ring-blue-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>

                {/* ── Lista ── */}
                {servicosFiltrados.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Briefcase size={24} aria-hidden="true" />
                    </div>
                    <div className="flex max-w-xs flex-col gap-1">
                      <p className="text-sm font-black text-slate-700">Nenhum trabalho nesta categoria</p>
                      <p className="text-sm font-medium leading-relaxed text-slate-500">Quando houver uma atualização, ela aparecerá aqui.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {servicosFiltrados.map(s => (
                      <ServicoCardCompacto
                        key={s.id}
                        servico={s}
                        statusInfo={getStatusInfo(s)}
                        tipoGarantiaAtiva={
                          idsComGarantiaAtiva.has(s.id) ? 'garantia'
                          : idsComReclamacaoAtiva.has(s.id) ? 'reclamacao'
                          : null
                        }
                        onClick={() => {
                          const rota = getRota(s)
                          irPara(rota.startsWith('/meus-servicos') ? `${rota}&origem=perfil` : rota)
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

            ) : (
              <div className="grid gap-4 pb-8 animate-in fade-in duration-300 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                <section className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="account-data-title">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-blue-700">Dados pessoais</p>
                    <h2 id="account-data-title" className="text-xl font-black tracking-tight text-slate-900">Informações da conta</h2>
                  </div>
                  <div>
                    <label htmlFor="perfil-nome" className="block text-xs font-semibold text-slate-600 mb-1.5">Nome completo</label>
                    <input id="perfil-nome" autoComplete="name" value={perfil.full_name} onChange={e => handleChangePerfil('full_name', e.target.value)} className={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="perfil-whatsapp" className="block text-xs font-semibold text-slate-600 mb-1.5">WhatsApp</label>
                    <input id="perfil-whatsapp" type="tel" inputMode="tel" autoComplete="tel" value={perfil.whatsapp} onChange={e => handleChangePerfil('whatsapp', aplicarMascara(e.target.value))} className={inputStyle} placeholder="(00) 00000-0000" />
                  </div>

                  <div className="border-t border-slate-50 pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-700">Endereço</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-[3]">
                        <label htmlFor="perfil-logradouro" className="block text-xs font-semibold text-slate-600 mb-1.5">Logradouro</label>
                        <input id="perfil-logradouro" autoComplete="address-line1" placeholder="Rua / Avenida" value={perfil.logradouro} onChange={e => handleChangePerfil('logradouro', e.target.value)} className={inputStyle} />
                      </div>
                      <div className="w-24 shrink-0">
                        <label htmlFor="perfil-numero" className="block text-xs font-semibold text-slate-600 mb-1.5">Nº</label>
                        <input id="perfil-numero" placeholder="123" value={perfil.numero} onChange={e => handleChangePerfil('numero', e.target.value)} className={inputStyle} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor="perfil-bairro" className="block text-xs font-semibold text-slate-600 mb-1.5">Bairro</label>
                        <input id="perfil-bairro" placeholder="Centro" value={perfil.bairro} onChange={e => handleChangePerfil('bairro', e.target.value)} className={inputStyle} />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="perfil-complemento" className="block text-xs font-semibold text-slate-600 mb-1.5">Complemento</label>
                        <input id="perfil-complemento" autoComplete="address-line2" placeholder="Apto 12" value={perfil.complemento} onChange={e => handleChangePerfil('complemento', e.target.value)} className={inputStyle} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="perfil-uf" className="block text-xs font-semibold text-slate-600 mb-1.5">UF</label>
                        <select id="perfil-uf" value={perfil.uf} onChange={e => handleChangePerfil('uf', e.target.value)} className={inputStyle}>
                          <option value="">UF</option>
                          {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="perfil-cidade" className="block text-xs font-semibold text-slate-600 mb-1.5">Cidade</label>
                        <select id="perfil-cidade" disabled={!perfil.uf} value={perfil.cidade} onChange={e => handleChangePerfil('cidade', e.target.value)} className={inputStyle}>
                          <option value="">Selecione a cidade</option>
                          {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {isDirty && !showSuccess && (
                    <p className="text-xs font-semibold text-amber-700 flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
                      <AlertCircle size={12} /> Alterações não salvas
                    </p>
                  )}
                  <button
                    onClick={atualizar}
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-blue-100 disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar alterações</>}
                  </button>
                </section>

                <DangerZone audience="cliente" />
              </div>
            )}

            <div className="pt-2 sm:pt-4">
              <ContextualHelp context="dashboard-cliente" audience="cliente" title="Precisa de ajuda com seus trabalhos?" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
