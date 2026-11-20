// app/(admin)/admin/login/page.tsx
//
// Login do painel administrativo. Mesmo visual do restante do admin (kit components/admin/ui),
// logo oficial e textos simples. Estado e ações ficam em useAdminLogin.

'use client'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import Logo from '@/components/Logo'
import { Button, Card, Field, Input } from '@/components/admin/ui'
import { useAdminLogin } from '@/hooks/useAdminLogin'

export default function LoginPage() {
  const { email, setEmail, senha, setSenha, mostrarSenha, alternarSenha, carregando, erro, aviso, entrar, esqueciMinhaSenha } = useAdminLogin()

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-pqf-surface p-4 text-pqf-ink antialiased md:p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <Logo variant="auth" priority />

        <Card className="w-full">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-pqf-ink">Painel administrativo</h1>
            <p className="mt-1 text-sm text-pqf-muted">Entre com o e-mail e a senha da sua conta de administrador.</p>
          </div>

          <form onSubmit={entrar} className="flex flex-col gap-4">
            <Field label="E-mail">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            {/* Sem <Field>: o botão de mostrar senha não pode ficar dentro do <label> do campo. */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-senha" className="text-xs font-semibold text-pqf-muted">Senha</label>
              <div className="relative">
                <Input
                  id="admin-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={alternarSenha}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-pqf-muted transition-colors hover:text-pqf-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pqf-blue"
                >
                  {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div role="status" aria-live="polite" className="empty:hidden">
              {erro && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
              {aviso && <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{aviso}</p>}
            </div>

            <Button type="submit" variante="primario" disabled={carregando} className="min-h-11 w-full justify-center">
              {carregando ? 'Aguarde…' : 'Entrar'}
            </Button>

            <Button type="button" variante="fantasma" onClick={esqueciMinhaSenha} disabled={carregando} className="min-h-11 w-full justify-center">
              Esqueci minha senha
            </Button>
          </form>
        </Card>

        <Link href="/" className="flex min-h-11 items-center text-sm font-semibold text-pqf-muted transition-colors hover:text-pqf-blue">
          ← Voltar ao site
        </Link>
      </div>
    </div>
  )
}
