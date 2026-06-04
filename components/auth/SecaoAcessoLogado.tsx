'use client'

import type { User } from '@supabase/supabase-js'
import { SenhaInput } from './SenhaInput'

interface SecaoAcessoLogadoProps {
  user: User
  senha: string
  confirmarSenha: string
  tentouEnviar: boolean
  onSenhaChange: (v: string) => void
  onConfirmarSenhaChange: (v: string) => void
  onLogout: () => void
  inputStyle: string
}

export function SecaoAcessoLogado({
  user,
  senha,
  confirmarSenha,
  tentouEnviar,
  onSenhaChange,
  onConfirmarSenhaChange,
  onLogout,
  inputStyle,
}: SecaoAcessoLogadoProps) {
  return (
    <section className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-100 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Você está logado como:</p>
          <p className="font-bold text-blue-900 text-sm">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="px-6 py-3 bg-white text-blue-600 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all border border-blue-100"
        >
          Sair / Trocar Conta
        </button>
      </div>

      <div className="pt-5 border-t border-blue-100/60">
        <label className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-3 block">
          Definir Nova Senha (Opcional)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SenhaInput
            value={senha}
            onChange={e => onSenhaChange(e.target.value)}
            placeholder="Nova senha (mín. 6)"
            className={inputStyle}
          />
          <SenhaInput
            value={confirmarSenha}
            onChange={e => onConfirmarSenhaChange(e.target.value)}
            placeholder="Confirme a senha"
            className={`${inputStyle} ${tentouEnviar && confirmarSenha.length > 0 && senha !== confirmarSenha ? 'border-red-300 ring-4 ring-red-50' : ''}`}
          />
        </div>
        {tentouEnviar && confirmarSenha.length > 0 && senha !== confirmarSenha && (
          <p className="text-red-400 text-[11px] font-bold mt-2 ml-2">⚠ As senhas não coincidem</p>
        )}
        <p className="text-[10px] text-slate-400 font-medium mt-3 ml-2">
          Deixe em branco para manter a senha atual.
        </p>
      </div>
    </section>
  )
}