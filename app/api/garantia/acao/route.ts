// app/api/garantia/acao/route.ts
//
// Única porta de escrita do fluxo de garantia. Usa a SESSÃO de quem está logado (não a chave de
// administrador): quem decide se a pessoa pode fazer aquilo é a função do banco (auth.uid()).
// Depois de gravar, avisa o outro lado por e-mail (se falhar, a ação já foi feita e continua valendo).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { montarChamada } from '@/lib/garantia/acoes'
import { DESTINATARIO_DO_EVENTO } from '@/lib/notificacoes/garantia'
import { notificarGarantia } from '@/lib/notificacoes/garantiaEnvio'

export async function POST(request: Request) {
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  const montado = montarChamada(corpo)
  if (!montado.ok) return NextResponse.json({ error: montado.erro }, { status: 400 })

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) return NextResponse.json({ error: 'Faça login para continuar.' }, { status: 401 })

  const { chamada } = montado
  const { data, error } = await supabase.rpc(chamada.funcao, chamada.args)
  if (error) {
    // As funções do banco escrevem mensagens em português para a pessoa (erro P0001); o resto é interno
    const amigavel = error.code === 'P0001' ? error.message : 'Não foi possível concluir. Tente novamente.'
    if (error.code !== 'P0001') console.error('[garantia] rpc falhou', chamada.funcao, error.code)
    return NextResponse.json({ error: amigavel }, { status: error.code === 'P0001' ? 400 : 500 })
  }

  const destinatario = DESTINATARIO_DO_EVENTO[chamada.evento]
  if (destinatario && data) await notificarGarantia(chamada.evento, destinatario, data)

  return NextResponse.json(data)
}
