// app/api/titular/route.ts
//
// Recebe o pedido do titular de dados. Registra pelo banco (função com limite por contato) e avisa
// o administrador por e-mail, sem dado pessoal no e-mail. Se o e-mail falhar, o pedido já está salvo.

import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CONTROLADOR } from '@/config/controlador'
import { validarPedidoTitular } from '@/lib/titular/pedido'
import { enviarEmail } from '@/lib/notificacoes/email'
import { emailNovoPedidoTitular } from '@/lib/notificacoes/mensagens'
import { formatarDataPrazo } from '@/lib/titular/prazo'

const LIMITE_CORPO_BYTES = 10_000

function dataPrazoEmDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return formatarDataPrazo(iso)
}

export async function POST(request: Request) {
  const tamanho = Number(request.headers.get('content-length') ?? 0)
  if (tamanho > LIMITE_CORPO_BYTES) {
    return NextResponse.json({ error: 'Pedido muito grande.' }, { status: 413 })
  }

  // O cabeçalho pode faltar (corpo em partes) ou mentir: o tamanho real também é conferido
  let texto: string
  try {
    texto = await request.text()
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  if (texto.length > LIMITE_CORPO_BYTES) {
    return NextResponse.json({ error: 'Pedido muito grande.' }, { status: 413 })
  }

  let corpo: unknown
  try {
    corpo = JSON.parse(texto)
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  const validacao = validarPedidoTitular(corpo)
  if (!validacao.ok) return NextResponse.json({ erros: validacao.erros }, { status: 400 })

  // Robô: responde como se tivesse dado certo, sem gravar nada
  if (validacao.robo) {
    return NextResponse.json({ ok: true, protocolo: 'RECEBIDO', prazoDias: CONTROLADOR.prazoRespostaDias })
  }

  const { dados } = validacao
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('registrar_solicitacao_titular', {
    p_tipo: dados.tipo,
    p_nome: dados.nome,
    p_contato: dados.contato,
    p_descricao: dados.descricao,
    p_prestador_id: dados.prestadorId,
  })

  if (error) {
    if (error.code === '54000') {
      return NextResponse.json({ error: 'Muitos pedidos em pouco tempo. Tente novamente mais tarde.' }, { status: 429 })
    }
    if (error.code === '22023' || error.code === '23503') {
      return NextResponse.json({ error: 'Não foi possível registrar o pedido. Confira os dados.' }, { status: 400 })
    }
    console.error('[titular] erro ao registrar pedido', error.code)
    return NextResponse.json({ error: 'Não foi possível registrar o pedido agora.' }, { status: 500 })
  }

  const protocolo = String(data).slice(0, 8).toUpperCase()

  after(async () => {
    await enviarEmail(
      emailNovoPedidoTitular({
        tipo: dados.tipo,
        protocolo,
        prazoTexto: dataPrazoEmDias(CONTROLADOR.prazoRespostaDias),
      }),
    )
  })

  return NextResponse.json({ ok: true, protocolo, prazoDias: CONTROLADOR.prazoRespostaDias })
}
