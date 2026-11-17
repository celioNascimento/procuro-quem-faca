// app/api/cnpj/route.ts
// POST { cnpj } do prestador logado: valida, consulta a Receita (fontes abertas),
// aprova na hora ou manda para a fila de revisão. Escrita só pelo servidor (chave de serviço).

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { verificarCnpj, type RepositorioCnpj } from '@/lib/cnpj/verificar'
import { consultarCnpj, type CacheConsulta, type DadosCnpj } from '@/lib/cnpj/consulta'

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
    }

    let corpoEntrada: { cnpj?: unknown }
    try {
      corpoEntrada = await req.json()
    } catch {
      return NextResponse.json({ erro: 'Envie o CNPJ em JSON.' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: prestador, error: erroPrestador } = await admin
      .from('prestadores')
      .select('id, nome')
      .eq('user_id', user.id)
      .maybeSingle()

    if (erroPrestador) {
      console.error('Erro ao buscar prestador:', erroPrestador)
      return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
    }
    if (!prestador) {
      return NextResponse.json({ erro: 'Perfil de prestador não encontrado.' }, { status: 404 })
    }

    const repositorio: RepositorioCnpj = {
      async cnpjEmUsoPorOutro(cnpj, prestadorId) {
        const { data, error } = await admin
          .from('prestador_cnpj')
          .select('prestador_id')
          .eq('cnpj', cnpj)
          .neq('prestador_id', prestadorId)
          .maybeSingle()
        if (error) throw error
        return data !== null
      },
      async gravar({ prestadorId, dados, status, motivo, validoAte }) {
        const agoraIso = new Date().toISOString()
        const { error: erroCnpj } = await admin.from('prestador_cnpj').upsert(
          {
            prestador_id: prestadorId,
            cnpj: dados.cnpj,
            razao_social: dados.razaoSocial,
            nome_fantasia: dados.nomeFantasia,
            situacao: dados.situacao,
            porte: dados.porte,
            natureza_juridica: dados.naturezaJuridica,
            mei: dados.mei,
            cnae_codigo: dados.cnaeCodigo,
            cnae_descricao: dados.cnaeDescricao,
            data_abertura: dados.dataAbertura,
            consultado_em: agoraIso,
            fonte: dados.fonte,
          },
          { onConflict: 'prestador_id' },
        )
        if (erroCnpj) throw erroCnpj

        const { error: erroVerif } = await admin.from('prestador_verificacoes').upsert(
          {
            prestador_id: prestadorId,
            tipo: 'cnpj',
            status,
            dados: { situacao: dados.situacao, motivo, mei: dados.mei },
            valido_ate: status === 'aprovada' ? validoAte : null,
            fonte_validacao: dados.fonte,
            verificado_em: status === 'aprovada' ? agoraIso : null,
          },
          { onConflict: 'prestador_id,tipo' },
        )
        if (erroVerif) throw erroVerif
      },
    }

    // Cache compartilhado entre instâncias serverless (tabela cnpj_consultas_cache, 24h).
    const cacheBanco: CacheConsulta = {
      async get(cnpj) {
        const { data, error } = await admin
          .from('cnpj_consultas_cache')
          .select('dados, expira_em')
          .eq('cnpj', cnpj)
          .maybeSingle()
        if (error) throw error
        if (!data) return undefined
        return { dados: data.dados as DadosCnpj, expiraEm: new Date(data.expira_em).getTime() }
      },
      async set(cnpj, { dados, expiraEm }) {
        const { error } = await admin.from('cnpj_consultas_cache').upsert(
          {
            cnpj,
            dados,
            consultado_em: new Date().toISOString(),
            expira_em: new Date(expiraEm).toISOString(),
          },
          { onConflict: 'cnpj' },
        )
        if (error) throw error
      },
    }

    const resultado = await verificarCnpj(
      { prestadorId: prestador.id, nomePrestador: prestador.nome ?? '', cnpjBruto: corpoEntrada.cnpj },
      { repositorio, consultar: (cnpj) => consultarCnpj(cnpj, { cache: cacheBanco }) },
    )

    return NextResponse.json(resultado.corpo, { status: resultado.http })
  } catch (err) {
    console.error('Erro inesperado na verificação de CNPJ:', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
