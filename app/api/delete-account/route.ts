// app/api/delete-account/route.ts

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    // Cliente normal — só para pegar a sessão do usuário logado
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Cliente admin com service role — único com poder de deletar usuários auth
    const supabaseAdmin = getAdminClient()

    // Comprovantes de seguro/CND ainda não decididos ficam na pasta do usuário: apaga antes de remover a conta.
    // Falha aqui não impede a exclusão (o titular tem direito a sair), mas fica no log para limpeza manual.
    try {
      const { data: arquivos } = await supabaseAdmin.storage.from('verificacoes-docs').list(user.id, { limit: 100 })
      const caminhos = (arquivos ?? []).map((a) => `${user.id}/${a.name}`)
      if (caminhos.length > 0) {
        const { error: erroArquivos } = await supabaseAdmin.storage.from('verificacoes-docs').remove(caminhos)
        if (erroArquivos) console.error('Comprovantes não apagados na exclusão da conta:', erroArquivos.message)
      }
    } catch (e) {
      console.error('Falha ao limpar comprovantes na exclusão da conta:', e instanceof Error ? e.message : 'erro')
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro inesperado:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
