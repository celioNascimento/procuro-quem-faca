// app/api/admin/equipe/route.ts
// Adiciona alguém à equipe de admins. Só o dono (conferido no banco). Sem conta no site: manda convite por e-mail.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { validarAdminNaApi } from '@/lib/auth/adminServidor'
import { convidarAdmin, ErroDeConvite } from '@/lib/auth/convidarAdmin'

export async function POST(req: NextRequest) {
  try {
    const auth = await createClient()
    const admin = await validarAdminNaApi(auth)
    if (!admin.ok) return admin.resposta

    const corpo = await req.json().catch(() => null)
    const email = typeof corpo?.email === 'string' ? corpo.email : ''

    const resultado = await convidarAdmin(email, req.nextUrl.origin, {
      adicionar: async (e) => {
        const { data, error } = await auth.rpc('admin_equipe_adicionar', { p_email: e })
        if (error) throw error
        return String(data)
      },
      enviarConvite: async (e, redirectTo) => {
        const { error } = await getAdminClient().auth.admin.inviteUserByEmail(e, { redirectTo })
        if (error) throw new Error(error.message)
      },
    })
    return NextResponse.json(resultado)
  } catch (e) {
    if (e instanceof ErroDeConvite) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('[api/admin/equipe] erro', e)
    return NextResponse.json({ error: 'Não foi possível concluir. Tente de novo.' }, { status: 500 })
  }
}
