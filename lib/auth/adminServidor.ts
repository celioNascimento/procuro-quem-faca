// lib/auth/adminServidor.ts
// Checagem única de "quem chama é administrador" para as rotas de API do painel.
// Não basta estar em `perfis_admin`: a conta com verificação em duas etapas precisa ter provado o código
// (nível aal2). As rotas de API não passam pelo proxy, então sem isto a senha sozinha abriria os dados.

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { precisaDoCodigo } from '@/lib/auth/adminMfa'

export type ResultadoAdmin = { ok: true; userId: string } | { ok: false; resposta: NextResponse }

export async function validarAdminNaApi(auth: SupabaseClient): Promise<ResultadoAdmin> {
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { ok: false, resposta: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }

  const { data: admin } = await auth.from('perfis_admin').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!admin) return { ok: false, resposta: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) }

  // Na dúvida (erro ao consultar), não libera.
  const { data: nivel, error } = await auth.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || precisaDoCodigo(nivel)) {
    return { ok: false, resposta: NextResponse.json({ error: 'Confirme o código de verificação em duas etapas.' }, { status: 403 }) }
  }
  return { ok: true, userId: user.id }
}
