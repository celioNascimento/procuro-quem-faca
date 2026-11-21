'use client'

import { useState } from 'react'
import { useSegurancaConta } from '@/hooks/admin/useSegurancaConta'
import { Badge, Button, Card, Field, Input, PageHeader } from '@/components/admin/ui'
import { EquipeAdmin } from '@/components/admin/seguranca/EquipeAdmin'

export function SegurancaConta({ obrigatorio = false }: { obrigatorio?: boolean }) {
  const { estado, cadastro, codigo, setCodigo, ocupado, erro, comecar, confirmar, cancelar, desativar } = useSegurancaConta()
  const [confirmandoDesativar, setConfirmandoDesativar] = useState(false)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-20 md:px-6">
      <PageHeader titulo="Segurança da conta" descricao="Proteja o painel com um código do seu celular, além da senha." />

      {obrigatorio && estado === 'desligada' && (
        <p role="status" data-testid="aviso-obrigatorio" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Para usar o painel, primeiro ligue a verificação em duas etapas. Leva 2 minutos e só precisa ser feito uma vez.
        </p>
      )}

      {erro && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{erro}</p>}

      {estado === 'carregando' && <p role="status" className="py-12 text-center text-sm text-pqf-muted">Carregando...</p>}

      {estado === 'desligada' && (
        <Card titulo="Verificação em duas etapas" descricao="Hoje o painel abre só com a senha.">
          <div className="space-y-4">
            <Badge tom="alerta">Desligada</Badge>
            <p className="text-sm text-pqf-ink">
              Com ela ligada, quem descobrir a sua senha ainda precisa do seu celular para entrar. Você vai precisar de um aplicativo autenticador
              (Google Authenticator, Microsoft Authenticator, 1Password ou parecido).
            </p>
            <Button variante="primario" disabled={ocupado} onClick={() => void comecar()}>Ligar verificação em duas etapas</Button>
          </div>
        </Card>
      )}

      {estado === 'cadastrando' && cadastro && (
        <Card titulo="Cadastre o aplicativo" descricao="São 3 passos e levam 1 minuto.">
          <ol className="space-y-5 text-sm text-pqf-ink">
            <li>
              <p className="font-semibold">1. Abra o aplicativo autenticador e escolha adicionar conta.</p>
            </li>
            <li>
              <p className="mb-2 font-semibold">2. Aponte a câmera para este quadrado.</p>
              <img src={cadastro.qrCode} alt="QR code para cadastrar o aplicativo autenticador" className="size-48 rounded-lg border border-slate-200 bg-white p-2" />
              <p className="mt-2 text-xs text-pqf-muted">Não consegue ler? Digite esta chave no aplicativo:</p>
              <code data-testid="chave-manual" className="mt-1 block break-all rounded-lg bg-slate-50 p-3 text-sm">{cadastro.segredo}</code>
            </li>
            <li>
              <Field label="3. Digite o código de 6 números que o aplicativo mostrar">
                <Input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={codigo} onChange={(e) => setCodigo(e.target.value)} className="max-w-48 text-center text-lg tracking-widest" />
              </Field>
            </li>
          </ol>
          <div className="mt-5 flex gap-2">
            <Button variante="primario" disabled={ocupado} onClick={() => void confirmar()}>Confirmar e ligar</Button>
            <Button variante="fantasma" disabled={ocupado} onClick={() => void cancelar()}>Cancelar</Button>
          </div>
        </Card>
      )}

      {estado === 'ligada' && (
        <Card titulo="Verificação em duas etapas" descricao="O painel pede o código do celular a cada entrada.">
          <div className="space-y-4">
            <Badge tom="sucesso">Ligada</Badge>
            <p className="text-sm text-pqf-muted">Se trocar de celular, desative aqui e cadastre o novo aplicativo. Se perder o celular antes disso, peça ajuda ao suporte técnico.</p>
            {!confirmandoDesativar ? (
              <Button className="border-red-200 text-red-700 hover:border-red-600 hover:text-red-700" disabled={ocupado} onClick={() => setConfirmandoDesativar(true)}>Desativar</Button>
            ) : (
              <div className="space-y-3 rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-semibold text-pqf-ink">Desativar deixa o painel protegido só pela senha. Confirma?</p>
                <div className="flex gap-2">
                  <Button className="border-red-200 bg-red-600 text-white hover:bg-red-700 hover:text-white" disabled={ocupado} onClick={() => { setConfirmandoDesativar(false); void desativar() }}>Sim, desativar</Button>
                  <Button variante="fantasma" onClick={() => setConfirmandoDesativar(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <EquipeAdmin />
    </div>
  )
}
