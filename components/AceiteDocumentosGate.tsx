// components/AceiteDocumentosGate.tsx
//
// Tela de aceite exibida depois do login quando o usuário ainda não aceitou a versão atual
// dos Termos de Uso e da Política de Privacidade. Cobre clientes, prestadores e login com Google.

'use client'

import { useAceiteDocumentos } from '@/hooks/useAceiteDocumentos'
import { SecaoTermos } from '@/components/perfil/SecaoTermos'

export default function AceiteDocumentosGate() {
  const {
    precisaAceitar,
    aceitouTermos, setAceitouTermos,
    aceitouPrivacidade, setAceitouPrivacidade,
    enviando, erro,
    aceitar, sair,
  } = useAceiteDocumentos()

  if (!precisaAceitar) return null

  const podeAceitar = aceitouTermos && aceitouPrivacidade && !enviando

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aceite-documentos-titulo"
    >
      <div className="my-auto w-full max-w-lg space-y-6 rounded-[2.5rem] bg-white p-6 shadow-2xl md:p-8">
        <div className="space-y-2 text-center">
          <h2 id="aceite-documentos-titulo" className="text-xl font-black text-slate-900">
            Antes de continuar
          </h2>
          <p className="text-[13px] leading-relaxed text-slate-500">
            Atualizamos nossos documentos. Para usar o PQF, leia e aceite os Termos de Uso e confirme a leitura da Política de Privacidade.
          </p>
        </div>

        <SecaoTermos
          aceitouTermos={aceitouTermos}
          aceitouPrivacidade={aceitouPrivacidade}
          onTermosChange={setAceitouTermos}
          onPrivacidadeChange={setAceitouPrivacidade}
        />

        {erro && (
          <p role="alert" className="text-center text-[12px] font-bold text-red-600">
            {erro}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={aceitar}
            disabled={!podeAceitar}
            className={`w-full rounded-[2rem] py-5 text-[12px] font-bold uppercase tracking-widest transition-all ${
              podeAceitar
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            }`}
          >
            {enviando ? 'Registrando...' : 'Aceitar e continuar'}
          </button>
          <button
            type="button"
            onClick={sair}
            disabled={enviando}
            className="w-full py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
          >
            Prefiro sair
          </button>
        </div>
      </div>
    </div>
  )
}
