// app/api/notificacoes/denuncia/route.ts
//
// Avisa o administrador por e-mail que há uma denúncia nova. A denúncia em si continua sendo
// gravada como sempre. Contra abuso, esta rota só envia quando:
//  - existe de fato uma denúncia aberta, criada há poucos minutos, para o perfil informado;
//  - não houve aviso para esse perfil nos últimos minutos;
//  - o total de avisos de denúncia não passou do limite da janela.

import { NextResponse, after } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { NOTIFICACOES } from '@/config/notificacoes'
import { enviarEmail } from '@/lib/notificacoes/email'
import { emailNovaDenuncia } from '@/lib/notificacoes/mensagens'

const JANELA_DENUNCIA_RECENTE_MIN = 5
const ACAO_LOG = 'EMAIL_DENUNCIA'

const minutosAtras = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

export async function POST(request: Request) {
  let prestadorId: number
  try {
    const corpo = await request.json()
    prestadorId = Number(corpo?.prestadorId)
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  if (!Number.isInteger(prestadorId) || prestadorId <= 0) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  try {
    const admin = getAdminClient()

    const { count: recentes } = await admin
      .from('denuncias')
      .select('id', { count: 'exact', head: true })
      .eq('prestador_id', prestadorId)
      .eq('status', 'aberta')
      .gte('created_at', minutosAtras(JANELA_DENUNCIA_RECENTE_MIN))
    if (!recentes) return NextResponse.json({ ok: true, enviado: false })

    const { count: doPerfil } = await admin
      .from('logs_atividades')
      .select('id', { count: 'exact', head: true })
      .eq('acao', ACAO_LOG)
      .eq('entidade_id', String(prestadorId))
      .gte('created_at', minutosAtras(NOTIFICACOES.intervaloEmailDenunciaMinutos))
    if (doPerfil) return NextResponse.json({ ok: true, enviado: false })

    const { count: total } = await admin
      .from('logs_atividades')
      .select('id', { count: 'exact', head: true })
      .eq('acao', ACAO_LOG)
      .gte('created_at', minutosAtras(10))
    if ((total ?? 0) >= NOTIFICACOES.limiteEmailsDenunciaPor10Min) {
      return NextResponse.json({ ok: true, enviado: false })
    }

    // Registra antes de enviar, para duas chamadas seguidas não gerarem dois e-mails
    await admin.from('logs_atividades').insert({
      acao: ACAO_LOG,
      entidade_tipo: 'prestador',
      entidade_id: String(prestadorId),
      detalhes: {},
    })

    after(async () => {
      await enviarEmail(emailNovaDenuncia())
    })

    return NextResponse.json({ ok: true, enviado: true })
  } catch (e) {
    console.error('[notificacao] aviso de denúncia falhou', e instanceof Error ? e.message : 'erro')
    return NextResponse.json({ ok: true, enviado: false })
  }
}
