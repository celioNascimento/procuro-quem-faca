// app/api/garantia/promover-fotos/route.ts
//
// Promove as fotos de resolução (fase='resolucao') de um caso de garantia
// do bucket privado 'garantia' para o bucket público 'garantia-publico'.
// Roda server-side com service role key — o client-side não tem permissão
// de leitura/escrita cruzada entre buckets com policies diferentes.
//
// Chamado quando um caso de garantia fecha como 'resolvida'
// (ver garantia.service.ts -> confirmarResolucaoGarantia).
//
// IMPORTANTE — pré-requisitos de infraestrutura que este código assume:
//  1. Bucket 'garantia' existe e é PRIVADO
//  2. Bucket 'garantia-publico' existe e é PÚBLICO
//  3. Variável de ambiente SUPABASE_SERVICE_ROLE_KEY está configurada
//     (nunca exposta ao client — só em rotas server-side/edge functions)
//
// Nenhum desses três itens pode ser criado por código; precisam ser
// configurados manualmente no painel do Supabase antes deste endpoint
// funcionar.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

const BUCKET_PRIVADO = 'garantia'
const BUCKET_PUBLICO = 'garantia-publico'

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient()
    const { casoId } = await req.json()

    if (!casoId) {
      return NextResponse.json({ error: 'casoId é obrigatório' }, { status: 400 })
    }

    // Busca só as fotos de resolução ainda não promovidas
    const { data: fotos, error: fotosError } = await supabaseAdmin
      .from('garantia_fotos')
      .select('id, url_foto')
      .eq('caso_id', casoId)
      .eq('fase', 'resolucao')
      .eq('publica', false)

    if (fotosError) throw fotosError
    if (!fotos || fotos.length === 0) {
      return NextResponse.json({ promovidas: 0 })
    }

    const resultados = await Promise.all(
      fotos.map(async (foto) => {
        // url_foto já é o PATH puro dentro do bucket privado (não uma URL
        // completa) — desde que uploadImagemGarantia passou a retornar o
        // path diretamente, sem chamar getPublicUrl (que não funciona em
        // bucket privado). Não é mais necessário fazer parsing de URL aqui.
        const path = foto.url_foto

        // Baixa do bucket privado
        const { data: arquivo, error: downloadError } = await supabaseAdmin.storage
          .from(BUCKET_PRIVADO)
          .download(path)

        if (downloadError || !arquivo) {
          console.error(`Erro ao baixar foto ${foto.id}:`, downloadError)
          return { id: foto.id, sucesso: false }
        }

        // Sobe no bucket público (mesmo path)
        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET_PUBLICO)
          .upload(path, arquivo, { upsert: true })

        if (uploadError) {
          console.error(`Erro ao promover foto ${foto.id}:`, uploadError)
          return { id: foto.id, sucesso: false }
        }

        const { data: urlPublica } = supabaseAdmin.storage
          .from(BUCKET_PUBLICO)
          .getPublicUrl(path)

        // Atualiza registro: marca como pública e troca a url_foto
        // para apontar para o bucket público
        const { error: updateError } = await supabaseAdmin
          .from('garantia_fotos')
          .update({ publica: true, url_foto: urlPublica.publicUrl })
          .eq('id', foto.id)

        if (updateError) {
          console.error(`Erro ao atualizar registro da foto ${foto.id}:`, updateError)
          return { id: foto.id, sucesso: false }
        }

        return { id: foto.id, sucesso: true }
      }),
    )

    const sucesso = resultados.filter((r) => r.sucesso).length
    const falhas = resultados.filter((r) => !r.sucesso)

    return NextResponse.json({ promovidas: sucesso, falhas })
  } catch (err) {
    console.error('Erro ao promover fotos de garantia:', err)
    return NextResponse.json({ error: 'Erro interno ao promover fotos.' }, { status: 500 })
  }
}

function extrairPathDoBucket(url: string, bucket: string): string | null {
  const marcador = `/storage/v1/object/public/${bucket}/`
  const idx = url.indexOf(marcador)
  if (idx === -1) return null
  return url.slice(idx + marcador.length)
}
