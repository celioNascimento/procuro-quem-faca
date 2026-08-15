//app/painel/perfil/page.tsx

'use client'
import Link from 'next/link'
import {
  MapPin, ChevronRight, Briefcase, Loader2, CheckCircle2,
  Save, AlertCircle, Star, ArrowRight, Trash2
} from 'lucide-react'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import CardPerfilCliente from '@/components/perfil/CardPerfilCliente'
import { AdCardPainelCliente } from '@/components/painel/AdCardPainelCliente'
import { usePerfilCliente } from '@/hooks/usePerfilCliente'

export default function PerfilDoCliente() {
  const {
    fileInputRef,
    filtroRef,
    irParaAvaliar,
    aba, setAba,
    filtroStatus, setFiltroStatus,
    loading,
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
    handleNavigation,
    handleChangePerfil,
    handleUploadFoto,
    atualizar,
    getStatusInfo,
    getRotaDestino,
    servicosFiltrados,
    avaliarCount,
    ativosCount
  } = usePerfilCliente()

  const inputStyle = `w-full px-5 py-4 rounded-2xl border border-slate-100 outline-none transition-all font-medium text-slate-800 bg-white shadow-sm placeholder-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400 text-[14px] md:text-[15px]`

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans antialiased">
      <HeaderCliente nomeCliente={perfil.full_name} />

      <input type="file" ref={fileInputRef} onChange={handleUploadFoto} accept="image/*" className="hidden" />

      {confirmLeaveModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-100">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">Sair sem salvar?</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">Suas alterações serão perdidas.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={cancelarSaida} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase text-[11px] tracking-wide hover:bg-slate-100 transition-all active:scale-95">Cancelar</button>
              <button onClick={confirmarSaida} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-wide hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200">Sair</button>
            </div>
          </div>
        </div>
      )}

      {errorModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">{errorModal.title}</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{errorModal.message}</p>
            </div>
            <button
              onClick={() => setErrorModal({ ...errorModal, show: false })}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest italic hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-20 left-0 right-0 z-[100] flex justify-center px-6 animate-in slide-in-from-top-10 duration-500">
          <div className="bg-white border border-green-100 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1"><CheckCircle2 className="text-white" size={14} /></div>
            <p className="text-[12px] font-bold text-slate-800">Salvo com sucesso</p>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-20 animate-in fade-in duration-500 sm:px-6 sm:pt-24 md:pt-32 lg:px-8">
        <header className="mb-6 flex max-w-2xl flex-col gap-2 sm:mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Área do cliente</p>
          <h1 className="text-balance text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Acompanhe seus projetos</h1>
          <p className="text-pretty text-sm font-medium leading-relaxed text-slate-500">Gerencie serviços contratados, avaliações pendentes e os dados da sua conta.</p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="min-w-0 lg:sticky lg:top-32">
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

          <div className="flex min-w-0 flex-col gap-6">
            {/* Banner B2C: anunciantes complementares à jornada do cliente
                (ex: seguradora, financeira, decoração), segmentados pela
                praça (cidade+categoria) do prestador do serviço mais
                recente. Público distinto do banner na dashboard do
                prestador (AdCardDashboard.tsx). */}
            <AdCardPainelCliente servicos={servicos} loading={loading}/>

            {avaliarCount > 0 && (
              <button
                onClick={irParaAvaliar}
                className="flex w-full items-center gap-4 rounded-[2rem] bg-blue-600 p-5 text-left shadow-lg shadow-blue-100 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 animate-in fade-in duration-500 sm:p-6"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <Star size={22} className="text-white" fill="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-sm uppercase italic tracking-tight leading-none">
                    {avaliarCount === 1 ? '1 serviço aguarda avaliação' : `${avaliarCount} serviços aguardam avaliação`}
                  </p>
                  <p className="text-blue-200 text-[11px] font-medium mt-1">Toque para avaliar e concluir</p>
                </div>
                <ArrowRight size={20} className="text-white/70 shrink-0" />
              </button>
            )}

            <nav className="sticky top-16 z-40 flex gap-1 rounded-2xl border border-slate-200 bg-[#F8FAFC]/95 p-1.5 shadow-sm backdrop-blur-md md:top-28" aria-label="Seções do painel">
              {[{ id: 'servicos', label: 'Meus projetos' }, { id: 'dados', label: 'Minha conta' }].map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAba(a.id)}
                  aria-current={aba === a.id ? 'page' : undefined}
                  className={`min-h-11 flex-1 rounded-xl px-3 py-2.5 text-[11px] font-black uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${aba === a.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-blue-600'
                    }`}
                >
                  {a.label}
                </button>
              ))}
            </nav>

            {aba === 'servicos' ? (
              <section className="flex flex-col gap-4 pb-4" aria-label="Projetos contratados">
                <div ref={filtroRef} className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'pendente', label: 'Aceitar' },
                    { id: 'andamento', label: 'Em andamento' },
                    { id: 'avaliar', label: avaliarCount > 0 ? `Avaliar (${avaliarCount})` : 'Avaliar' },
                    { id: 'finalizados', label: 'Concluídos' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFiltroStatus(f.id)}
                      type="button"
                      aria-pressed={filtroStatus === f.id}
                      className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl border px-4 py-2 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${filtroStatus === f.id
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {loadingServicos ? (
                  <div className="flex flex-col gap-3" role="status" aria-label="Carregando projetos">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-[1.75rem] bg-slate-100" />)}
                  </div>
                ) : servicosFiltrados.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-slate-200 bg-white px-8 py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Briefcase size={24} aria-hidden="true" />
                    </div>
                    <div className="flex max-w-xs flex-col gap-1">
                      <p className="text-sm font-black text-slate-700">Nenhum projeto nesta categoria</p>
                      <p className="text-xs font-medium leading-relaxed text-slate-400">Quando houver uma atualização, ela aparecerá aqui.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {servicosFiltrados.map(s => {
                      const info = getStatusInfo(s)
                      const rota = getRotaDestino(s)
                      return (
                        <button
                          key={s.id}
                          onClick={(e) => handleNavigation(e, rota)}
                          type="button"
                          className={`group flex min-h-[7rem] w-full items-center gap-4 rounded-[1.75rem] border bg-white p-4 text-left overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 ${info.urgente ? 'border-blue-200 shadow-sm shadow-blue-50' : 'border-slate-200 shadow-sm hover:border-blue-200'
                            }`}
                        >
                          <div className={`relative shrink-0 rounded-2xl p-0.5 ${info.urgente ? 'ring-2 ring-blue-400' : ''}`}>
                            <div className="w-14 h-14 rounded-[14px] overflow-hidden">
                              <img
                                src={s.prestadores?.foto_perfil || '/placeholder-avatar.png'}
                                className="w-full h-full object-cover"
                                alt={s.prestadores?.nome}
                              />
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${info.dot} ${info.urgente ? 'animate-pulse' : ''}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wider shrink-0 ${info.badge}`}>
                                {info.label}
                              </span>
                              {s.prestadores?.categoria?.nome && (
                                <span className="text-[9px] text-slate-400 truncate">{s.prestadores.categoria.nome}</span>
                              )}
                            </div>
                            <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">
                              {s.titulo}
                            </p>
                            <p className="text-[12px] text-slate-500 truncate mt-0.5">
                              {s.prestadores?.nome}
                            </p>
                          </div>
                          
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${info.urgente ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                            }`}>
                            <ChevronRight size={16} strokeWidth={2.5} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

            ) : (
              <div className="grid gap-4 pb-12 animate-in fade-in duration-300 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                <section className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="account-data-title">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Dados pessoais</p>
                    <h2 id="account-data-title" className="text-xl font-black tracking-tight text-slate-900">Informações da conta</h2>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nome Completo</label>
                    <input value={perfil.full_name} onChange={e => handleChangePerfil('full_name', e.target.value)} className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">WhatsApp</label>
                    <input value={perfil.whatsapp} onChange={e => handleChangePerfil('whatsapp', aplicarMascara(e.target.value))} className={inputStyle} placeholder="(00) 00000-0000" />
                  </div>

                  <div className="border-t border-slate-50 pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-600" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Endereço</h3>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-[3]">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Logradouro</label>
                        <input placeholder="Rua / Avenida" value={perfil.logradouro} onChange={e => handleChangePerfil('logradouro', e.target.value)} className={inputStyle} />
                      </div>
                      <div className="w-24 shrink-0">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Nº</label>
                        <input placeholder="123" value={perfil.numero} onChange={e => handleChangePerfil('numero', e.target.value)} className={inputStyle} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Bairro</label>
                        <input placeholder="Centro" value={perfil.bairro} onChange={e => handleChangePerfil('bairro', e.target.value)} className={inputStyle} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Complemento</label>
                        <input placeholder="Apto 12" value={perfil.complemento} onChange={e => handleChangePerfil('complemento', e.target.value)} className={inputStyle} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">UF</label>
                        <select value={perfil.uf} onChange={e => handleChangePerfil('uf', e.target.value)} className={inputStyle}>
                          <option value="">--</option>
                          {listaEstados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cidade</label>
                        <select disabled={!perfil.uf} value={perfil.cidade} onChange={e => handleChangePerfil('cidade', e.target.value)} className={inputStyle}>
                          <option value="">Selecione...</option>
                          {listaCidades.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {isDirty && !showSuccess && (
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-in fade-in duration-300">
                      <AlertCircle size={12} /> Alterações não salvas
                    </p>
                  )}
                  <button
                    onClick={atualizar}
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black italic uppercase text-[11px] tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-blue-100 disabled:opacity-60"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar alterações</>}
                  </button>
                </section>

                <section className="flex flex-col gap-4 rounded-[2rem] border border-red-100 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-48">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <Trash2 size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-red-500">Zona de Perigo</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Ações irreversíveis</p>
                    </div>
                  </div>
                  <div className="border-t border-red-50 pt-4">
                    <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
                      Ao excluir sua conta, seus dados pessoais serão removidos permanentemente. O histórico de serviços contratados permanece anonimizado para os prestadores.
                    </p>
                    <Link
                      href="/confirmar-exclusao"
                      className="w-full py-4 border-2 border-red-200 text-red-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Excluir minha conta
                    </Link>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
