'use client'
import {
  MapPin, User, ChevronRight, Briefcase, Loader2, Camera, CheckCircle2,
  Save, Activity, Clock, AlertCircle, Star, ArrowRight, Trash2
} from 'lucide-react'
import HeaderCliente from '@/components/HeaderCliente'
import { usePerfilCliente } from '@/hooks/usePerfilCliente'

export default function PerfilDoCliente() {
  const {
    fileInputRef,
    aba, setAba,
    filtroStatus, setFiltroStatus,
    loading,
    uploading,
    loadingServicos,
    showSuccess,
    errorModal, setErrorModal,
    confirmLeaveModal, confirmarSaida, cancelarSaida,
    deleteModal, setDeleteModal,
    deleteConfirmText, setDeleteConfirmText,
    deleting,
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
    handleDeleteAccount,
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

      {/* Modal de exclusão de conta */}
      {deleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto border border-red-100">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">Excluir conta?</h3>
              <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
                Esta ação é <strong>permanente</strong> e não pode ser desfeita. Seus dados pessoais serão removidos.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Digite <span className="text-red-500">EXCLUIR</span> para confirmar
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="EXCLUIR"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none text-[14px] font-bold text-slate-800 focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all placeholder-slate-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirmText('') }}
                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold uppercase text-[11px] tracking-wide hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'EXCLUIR' || deleting}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-wide hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={14} /> Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal saída sem salvar */}
      {confirmLeaveModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-100"><AlertCircle size={32} /></div>
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

      {/* Modal de erro */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto border border-red-100"><AlertCircle size={32} /></div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">{errorModal.title}</h3>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">{errorModal.message}</p>
            </div>
            <button onClick={() => setErrorModal({ ...errorModal, show: false })} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest italic hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100">Entendido</button>
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

      <div className="max-w-xl mx-auto px-5 pt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── CTA quando há serviços para avaliar ── */}
        {avaliarCount > 0 && (
          <button
            onClick={() => { setAba('servicos'); setFiltroStatus('avaliar') }}
            className="w-full bg-blue-600 rounded-[2rem] p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-xl shadow-blue-200 animate-in fade-in duration-500 text-left"
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

        {/* ── Resumo ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center"><Activity size={14} className="text-blue-600" /></div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Ativos</p>
            </div>
            <span className="text-4xl font-black text-slate-800 leading-none">{ativosCount}</span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">em andamento</p>
          </div>
          <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center"><Clock size={14} className="text-slate-400" /></div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Histórico</p>
            </div>
            <span className="text-4xl font-black text-slate-800 leading-none">{servicos.length}</span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">total de projetos</p>
          </div>
        </div>

        {/* ── Abas ── */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-[2rem] gap-1">
          {[{ id: 'servicos', label: 'Meus Projetos' }, { id: 'dados', label: 'Minha Conta' }].map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex-1 py-3.5 rounded-[1.5rem] text-[12px] font-semibold transition-all duration-200 ${aba === a.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {aba === 'servicos' ? (
          <div className="space-y-4 pb-4">

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar">
              {[
                { id: 'todos',       label: 'Todos' },
                { id: 'pendente',    label: 'Aceitar' },
                { id: 'andamento',   label: 'Em andamento' },
                { id: 'avaliar',     label: avaliarCount > 0 ? `Avaliar (${avaliarCount})` : 'Avaliar' },
                { id: 'finalizados', label: 'Concluídos' }
              ].map(f => (
                <button key={f.id} onClick={() => setFiltroStatus(f.id)}
                  className={`px-4 py-2 rounded-full text-[11px] font-semibold transition-all shrink-0 border whitespace-nowrap ${
                    filtroStatus === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Lista */}
            {loadingServicos ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-[80px] bg-slate-100 rounded-[2rem] animate-pulse" />)}
              </div>
            ) : servicosFiltrados.length === 0 ? (
              <div className="py-20 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-4 text-center px-10">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                  <Briefcase size={24} className="text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-400">Nenhum projeto nesta categoria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servicosFiltrados.map(s => {
                  const info = getStatusInfo(s)
                  const rota = getRotaDestino(s)
                  return (
                    <button key={s.id} onClick={(e) => handleNavigation(e, rota)}
                      className={`w-full bg-white rounded-[2rem] border p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] group ${
                        info.urgente ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      {/* Avatar do prestador com dot de status */}
                      <div className={`relative shrink-0 rounded-2xl p-0.5 ${info.urgente ? 'ring-2 ring-blue-400' : ''}`}>
                        <div className="w-14 h-14 rounded-[14px] overflow-hidden">
                          <img src={s.prestadores?.foto_perfil || '/placeholder-avatar.png'} className="w-full h-full object-cover" alt={s.prestadores?.nome} />
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${info.dot} ${info.urgente ? 'animate-pulse' : ''}`} />
                      </div>

                      {/* Textos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wider ${info.badge}`}>{info.label}</span>
                          {s.prestadores?.categoria?.nome && (
                            <span className="text-[9px] text-slate-400 truncate">{s.prestadores.categoria.nome}</span>
                          )}
                        </div>
                        <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">{s.titulo}</p>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">{s.prestadores?.nome}</p>
                      </div>

                      {/* Seta */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        info.urgente ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                      }`}>
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

        ) : (

          <div className="space-y-4 pb-12 animate-in fade-in duration-300">

            {/* Perfil card com faixa azul */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-blue-600 to-blue-500" />
              <div className="px-8 pb-8 -mt-10 flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-[1.5rem] bg-slate-100 border-4 border-white overflow-hidden shadow-xl flex items-center justify-center">
                    {uploading
                      ? <Loader2 className="animate-spin text-blue-500" size={24} />
                      : perfil.avatar_url
                        ? <img
                            src={perfil.avatar_url}
                            className="w-full h-full object-cover"
                            alt="Avatar"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        : <User size={32} className="text-slate-300" />
                    }
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-[1.2rem] flex items-center justify-center backdrop-blur-sm">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-lg font-black text-slate-800 mt-3 leading-none">{perfil.full_name || 'Sua conta'}</h2>
                <p className="text-[11px] text-slate-400 mt-1">{perfil.email}</p>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-5">
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
              <button onClick={atualizar} disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black italic uppercase text-[11px] tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-blue-100 disabled:opacity-60">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Salvar alterações</>}
              </button>
            </div>

            {/* ── Zona de perigo ── */}
            <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-sm p-6 space-y-4">
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
                <button
                  onClick={() => { setDeleteModal(true); setDeleteConfirmText('') }}
                  className="w-full py-4 border-2 border-red-200 text-red-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Excluir minha conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}