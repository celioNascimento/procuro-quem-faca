//app/(admin)/admin//anunciantes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client com service role — só usado server-side, nunca exposto ao browser.
// Segue o mesmo padrão de /api/delete-account (ver 14-glossario.md > Exclusão de conta).
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoAdmin: true, persistSession: false } }
  )
}

function gerarSenhaTemporaria() {
  // Senha temporária legível o suficiente pra repassar por WhatsApp, mas com
  // entropia razoável. Lojista deve trocar no primeiro acesso (ver TODO no painel dele, futuro).
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 10; i++) senha += chars[Math.floor(Math.random() * chars.length)]
  return senha
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, razaoSocial, cnpjCpf, whatsapp } = body

    if (!email || !razaoSocial) {
      return NextResponse.json({ error: 'email e razaoSocial são obrigatórios' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1) Verifica se já existe um usuário Auth com esse e-mail (evita duplicar
    //    ao editar/re-tentar cadastro de um lojista já existente).
    const { data: existentes, error: erroLista } = await supabase.auth.admin.listUsers()
    if (erroLista) throw erroLista

    let userId: string
    let senhaTemporaria: string | null = null

    const usuarioExistente = existentes.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (usuarioExistente) {
      userId = usuarioExistente.id
    } else {
      senhaTemporaria = gerarSenhaTemporaria()
      const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
        email,
        password: senhaTemporaria,
        email_confirm: true, // pula confirmação por e-mail — admin já validou o contato
        user_metadata: { origem: 'cadastro_admin_anunciante' },
      })
      if (erroCriar) throw erroCriar
      userId = criado.user.id
    }

    // 2) Cria (ou reaproveita) o registro em anunciantes vinculado a esse user_id.
    //    anunciantes.user_id é UNIQUE — upsert evita erro de conflito em re-tentativa.
    const { data: anunciante, error: erroAnunciante } = await supabase
      .from('anunciantes')
      .upsert(
        {
          user_id: userId,
          razao_social: razaoSocial,
          cnpj_cpf: cnpjCpf ?? null,
          whatsapp: whatsapp ?? null,
          status_conta: 'ativo', // admin já está validando manualmente ao cadastrar
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (erroAnunciante) throw erroAnunciante

    return NextResponse.json({
      anunciante,
      senhaTemporaria, // null se o usuário já existia — não gera nova senha nesse caso
      novoUsuario: !usuarioExistente,
    })
  } catch (err: any) {
    console.error('[admin/anunciantes] erro:', err)
    return NextResponse.json({ error: err.message ?? 'Erro ao criar anunciante' }, { status: 500 })
  }
}
