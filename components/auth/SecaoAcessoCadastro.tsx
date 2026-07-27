//components/auth/SecaoAcessoCadastro.tsx

'use client'

import { SenhaInput } from './SenhaInput'

interface SecaoAcessoCadastroProps {
  email: string
  senha: string
  confirmarSenha: string
  tentouEnviar: boolean
  onEmailChange: (v: string) => void
  onSenhaChange: (v: string) => void
  onConfirmarSenhaChange: (v: string) => void
}

const inputAzulClass = `w-full p-4 rounded-2xl border-none outline-none font-medium text-[14px] text-slate-800 bg-white shadow-inner`

export function SecaoAcessoCadastro({
  email,
  senha,
  confirmarSenha,
  tentouEnviar,
  onEmailChange,
  onSenhaChange,
  onConfirmarSenhaChange,
}: SecaoAcessoCadastroProps) {
  return (
    <section className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 space-y-4">
      <h2 className="font-bold uppercase text-[11px] tracking-widest text-blue-100">Crie seu Acesso</h2>

      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
        className={inputAzulClass}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SenhaInput
          value={senha}
          onChange={e => onSenhaChange(e.target.value)}
          placeholder="Senha (mín. 6 caracteres)"
          className={`${inputAzulClass} ${tentouEnviar && senha.length < 6 ? 'ring-2 ring-red-400' : ''}`}
          required
        />
        <SenhaInput
          value={confirmarSenha}
          onChange={e => onConfirmarSenhaChange(e.target.value)}
          placeholder="Confirme a senha"
          className={`${inputAzulClass} ${tentouEnviar && senha !== confirmarSenha ? 'ring-2 ring-red-400' : ''}`}
          required
        />
      </div>

      {tentouEnviar && confirmarSenha.length > 0 && senha !== confirmarSenha && (
        <p className="text-blue-100 text-[11px] font-bold">⚠ As senhas não coincidem</p>
      )}
    </section>
  )
}