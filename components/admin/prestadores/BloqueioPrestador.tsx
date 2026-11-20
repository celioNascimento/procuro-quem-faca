'use client'

import { useState } from 'react'
import { ShieldOff } from 'lucide-react'
import { useBloqueioPrestador } from '@/hooks/admin/useBloqueioPrestador'
import { Badge, Button, Field, Textarea } from '@/components/admin/ui'
import type { AdminPrestador } from '@/types/adminPrestadores'

interface Props {
  item: AdminPrestador
  aoConcluir: (prestadorId: number, bloqueado: boolean) => void
}

// Conduta indevida identificada pela equipe: bloqueia o perfil sem esperar denúncia.
// O perfil bloqueado sai das buscas e listas públicas. O motivo fica registrado só para a equipe.
export function BloqueioPrestador({ item, aoConcluir }: Props) {
  const { processando, erro, limparErro, bloquear, desbloquear } = useBloqueioPrestador(aoConcluir)
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')

  if (item.bloqueado) {
    return (
      <section className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-5" data-testid="bloqueio-prestador">
        <div className="flex items-center gap-2"><Badge tom="perigo">Perfil bloqueado</Badge></div>
        <p className="mt-2 text-sm text-slate-600">Este perfil não aparece nas buscas nem nas listas públicas.</p>
        {erro && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{erro}</p>}
        <Button className="mt-4" disabled={processando} onClick={() => void desbloquear(item.id)}>Desbloquear perfil</Button>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-100 p-5" data-testid="bloqueio-prestador">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conduta indevida</p>
      {!aberto ? (
        <>
          <p className="mt-2 text-sm text-slate-600">Se você identificou algo errado neste perfil, pode bloquear sem esperar uma denúncia.</p>
          <Button className="mt-4 border-red-200 text-red-700 hover:border-red-600 hover:text-red-700" icone={<ShieldOff size={14} aria-hidden="true" />} onClick={() => setAberto(true)}>
            Bloquear perfil
          </Button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <Field label="Motivo do bloqueio (obrigatório, fica registrado)">
            <Textarea rows={3} value={motivo} onChange={(e) => { setMotivo(e.target.value); limparErro() }} placeholder="O que foi identificado neste perfil?" />
          </Field>
          <p className="text-xs text-pqf-muted">O perfil sai das buscas e das listas públicas. Você pode desbloquear depois.</p>
          {erro && <p role="alert" className="text-sm font-semibold text-red-700">{erro}</p>}
          <div className="flex gap-2">
            <Button
              disabled={processando}
              className="border-red-200 bg-red-600 text-white hover:bg-red-700 hover:text-white"
              onClick={async () => { if (await bloquear(item.id, motivo)) { setAberto(false); setMotivo('') } }}
            >
              Confirmar bloqueio
            </Button>
            <Button variante="fantasma" disabled={processando} onClick={() => { setAberto(false); setMotivo(''); limparErro() }}>Cancelar</Button>
          </div>
        </div>
      )}
    </section>
  )
}
