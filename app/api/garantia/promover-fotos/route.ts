// app/api/garantia/promover-fotos/route.ts
//
// Promove as fotos de resolução (fase='resolucao') de um caso de garantia do bucket privado
// 'garantia' para o bucket público 'garantia-publico', para aparecerem no perfil público do
// prestador. Roda no servidor com a chave administrativa porque o navegador não tem permissão
// para ler um bucket e gravar no outro.
//
// QUEM PODE CHAMAR (tudo conferido aqui, antes de usar a chave administrativa):
//  1. Alguém logado — a sessão vem do cookie, nunca do corpo do pedido.
//  2. O CLIENTE do caso (quem confirmou a resolução). O prestador não publica fotos.
//  3. Só depois que o caso está 'resolvida' — foto de caso aberto nunca vai a público.
//  4. Só arquivos que estão na pasta do próprio caso (`<casoId>/...`): sem isso, alguém poderia
//     registrar uma foto apontando para o arquivo de OUTRO caso e publicá-lo.
// Os pedidos sem login, de outra pessoa ou fora desse estado recebem a mesma resposta genérica,
// para não revelar se um caso existe.
//
// Pré-requisitos de infraestrutura (configurados no painel do Supabase, não por código):
//  - bucket 'garantia' PRIVADO e 'garantia-publico' PÚBLICO
//  - SUPABASE_SERVICE_ROLE_KEY nas variáveis do servidor

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { caminhoPertenceAoCaso } from '@/lib/garantia/caminho'

const BUCKET_PRIVADO = 'garantia'
const BUCKET_PUBLICO = 'garantia-publico'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NEGADO = () => NextResponse.json({ error: 'Não foi possível concluir.' }, { status: 404 })

export async function POST(req: NextRequest) {
  let casoId: unknown
  try {
    ;({ casoId } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }
  if (typeof casoId !== 'string' || !UUID.test(casoId)) {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  }

  try {
    // 1 e 2: quem está logado e se é o cliente do caso (a leitura passa pelas regras do banco)
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NEGADO()

    const { data: caso } = await supabase
      .from('solicitacoes_garantia')
      .select('id, status, cliente_user_id')
      .eq('id', casoId)
      .maybeSingle()

    // 3: caso do próprio cliente e já resolvido
    if (!caso || caso.cliente_user_id !== user.id || caso.status !== 'resolvida') return NEGADO()

    const admin = getAdminClient()

    const { data: fotos, error: fotosError } = await admin
      .from('garantia_fotos')
      .select('id, url_foto')
      .eq('caso_id', casoId)
      .eq('fase', 'resolucao')
      .eq('publica', false)

    if (fotosError) throw fotosError
    if (!fotos || fotos.length === 0) return NextResponse.json({ promovidas: 0 })

    const resultados = await Promise.all(
      fotos.map(async (foto) => {
        // url_foto é o PATH dentro do bucket privado (não uma URL) — ver uploadImagemGarantia.
        const path = foto.url_foto
        // 4: arquivo de outro caso (ou path estranho) nunca é copiado
        if (!caminhoPertenceAoCaso(path, casoId)) return { id: foto.id, sucesso: false }

        const { data: arquivo, error: downloadError } = await admin.storage
          .from(BUCKET_PRIVADO)
          .download(path)
        if (downloadError || !arquivo) {
          console.error(`[promover-fotos] erro ao baixar foto ${foto.id}`)
          return { id: foto.id, sucesso: false }
        }

        const { error: uploadError } = await admin.storage
          .from(BUCKET_PUBLICO)
          .upload(path, arquivo, { upsert: true })
        if (uploadError) {
          console.error(`[promover-fotos] erro ao promover foto ${foto.id}`)
          return { id: foto.id, sucesso: false }
        }

        const { data: urlPublica } = admin.storage.from(BUCKET_PUBLICO).getPublicUrl(path)

        const { error: updateError } = await admin
          .from('garantia_fotos')
          .update({ publica: true, url_foto: urlPublica.publicUrl })
          .eq('id', foto.id)
        if (updateError) {
          console.error(`[promover-fotos] erro ao atualizar foto ${foto.id}`)
          return { id: foto.id, sucesso: false }
        }
        return { id: foto.id, sucesso: true }
      }),
    )

    return NextResponse.json({
      promovidas: resultados.filter((r) => r.sucesso).length,
      falhas: resultados.filter((r) => !r.sucesso).length,
    })
  } catch (err) {
    console.error('[promover-fotos] erro inesperado', err instanceof Error ? err.message : 'erro')
    return NextResponse.json({ error: 'Erro interno ao promover fotos.' }, { status: 500 })
  }
}
