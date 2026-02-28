'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NovaSenha() {
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [linkValido, setLinkValido] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()
  const fluxoProcessado = useRef(false);

  const senhasPreenchidas = senha.length > 0 && confirmarSenha.length > 0;
  const senhasIguais = senhasPreenchidas && senha === confirmarSenha;
  const senhaCurta = senha.length > 0 && senha.length < 6;

  useEffect(() => {
    setMounted(true);
    let isSubscribed = true;

    const inicializarValidacao = async () => {
      const hash = window.location.hash;
      const url = window.location.href;
      const temToken = hash.includes('access_token') || hash.includes('type=recovery');

      if (url.includes('error=access_denied')) {
        setLinkValido(false);
        setStatus('❌ Link expirado ou negado.');
        setIsReady(true);
        return;
      }

      if (temToken) { setIsReady(true); }

      const { data: { session } } = await supabase.auth.getSession();
      if (session && isSubscribed) {
        setIsReady(true);
        if (!fluxoProcessado.current) {
          registrarLogSeguranca('ACESSO_PAGINA_NOVA_SENHA', { email: session.user.email });
          fluxoProcessado.current = true;
        }
      }

      setTimeout(() => {
        if (isSubscribed && !fluxoProcessado.current && !temToken && !session) {
          setLinkValido(false);
          setStatus('❌ Link expirado ou inválido.');
        }
        setIsReady(true);
      }, 2000);
    };

    inicializarValidacao();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && isSubscribed) {
        setIsReady(true);
        fluxoProcessado.current = true;
      }
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  const registrarLogSeguranca = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert([{
        acao, detalhes, entidade_tipo: 'recuperacao_senha'
      }])
    } catch (err) { }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (senha.length < 6) { setStatus('⚠️ A senha deve ter 6 ou mais caracteres'); return; }
    if (senha !== confirmarSenha) { setStatus('⚠️ As senhas precisam ser idênticas'); return; }

    setLoading(true);
    setStatus('Sincronizando...');

    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) {
        setStatus(`❌ Erro: ${error.message}`);
        setLoading(false);
      } else {
        setStatus('✅ SENHA ATUALIZADA!');
        window.sessionStorage.removeItem('recuperacao_em_curso');
        window.sessionStorage.removeItem('bloquearRedirecionamento');
        window.history.replaceState({}, document.title, window.location.pathname);
        await supabase.auth.signOut();
        setTimeout(() => router.push('/login?msg=senha_alterada'), 1500);
      }
    } catch (err) { 
      setStatus('❌ Erro de conexão.');
      setLoading(false); 
    }
  }

  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center animate-pulse">
         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
         <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Autenticando Protocolo...</p>
      </div>
    );
  }

  const inputStyle = (error) => `w-full p-5 pr-14 rounded-[1.5rem] border transition-all duration-300 outline-none font-bold text-sm text-slate-900 placeholder-slate-400 shadow-sm ${error ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500'}`;

  const EyeIcon = ({ show, toggle }) => (
    <button type="button" onClick={toggle} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors p-1">
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      )}
    </button>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans antialiased">
      <div className="relative z-20 -mb-24 md:-mb-32">
        <Link href="/"><img src="/logo.png" alt="Logo" className="h-64 md:h-80 w-auto mx-auto object-contain drop-shadow-2xl" /></Link>
      </div>

      <div className="w-full max-w-[420px] bg-white p-10 md:p-14 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-50 via-blue-500/10 to-blue-50" />
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{linkValido ? "Segurança" : "Protocolo"}</h2>
        <p className="text-slate-400 mb-10 text-[11px] font-bold uppercase tracking-[0.2em]">{linkValido ? "Crie sua nova senha de acesso" : "Link Inválido"}</p>

        {linkValido ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-5 mr-2">
                  <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Nova Senha</label>
                  {senhaCurta && <span className="text-[9px] font-black text-amber-500 uppercase">Muito curta</span>}
                </div>
                <div className="relative">
                  <input type={showSenha ? "text" : "password"} placeholder="Mínimo 6 caracteres" required value={senha} onChange={(e) => setSenha(e.target.value)} className={inputStyle(senhaCurta)} />
                  <EyeIcon show={showSenha} toggle={() => setShowSenha(!showSenha)} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-5 mr-2">
                  <label className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Confirmar Senha</label>
                  {senhasPreenchidas && (
                    <span className={`text-[9px] font-black uppercase ${senhasIguais ? 'text-blue-500' : 'text-amber-500'}`}>
                      {senhasIguais ? '✓ Combinam' : '✕ Diferentes'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input type={showConfirmar ? "text" : "password"} placeholder="Repita a senha" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className={inputStyle(senhasPreenchidas && !senhasIguais)} />
                  <EyeIcon show={showConfirmar} toggle={() => setShowConfirmar(!showConfirmar)} />
                </div>
              </div>
            </div>

            {status && <div className="p-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-wider bg-blue-50 text-blue-600 italic animate-pulse">{status}</div>}

            <button type="submit" disabled={loading || (senhasPreenchidas && !senhasIguais) || senhaCurta} className={`w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl ${loading || (senhasPreenchidas && !senhasIguais) || senhaCurta ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'}`}>
              {loading ? 'Sincronizando...' : 'Confirmar Nova Senha'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-8 rounded-[2.5rem] bg-red-50 border border-red-100">
              <p className="text-[11px] font-black text-red-500 uppercase tracking-widest leading-relaxed">{status}</p>
            </div>
            {/* CORRIGIDO: Botão agora azul oficial para identidade visual consistente */}
            <Link href="/login" className="block w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all text-center">Tentar Novamente</Link>
          </div>
        )}
      </div>
    </main>
  );
}