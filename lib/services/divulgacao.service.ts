// lib/services/divulgacao.service.ts
import { supabase } from '@/lib/supabase'
import { insertLog } from '@/lib/db/logs'
import type { DadosDivulgacao } from '@/lib/divulgacao/tipos'

type Rel<T> = T | T[] | null
const um = <T,>(v: Rel<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null))

interface PrestadorRow {
  id: number
  nome: string
  slug: string | null
  whatsapp: string | null
  foto_perfil: string | null
  verificado: boolean | null
  garantia_dias: number | null
  categorias: Rel<{ nome: string }>
  cidades: Rel<{ nome: string }>
}

interface FotoRow { url_foto: string | null; ordem: number | null }
interface ProjetoRow { id: string; portfolio_fotos: FotoRow[] | null }

/** Primeira foto (menor `ordem`) de cada projeto concluído, até `max` — o "melhor" recorte de cada serviço. */
export function escolherFotosPortfolio(projetos: ProjetoRow[], max = 4): string[] {
  const urls: string[] = []
  for (const p of projetos) {
    const fotos = [...(p.portfolio_fotos ?? [])]
      .filter(f => Boolean(f.url_foto))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    if (fotos[0]?.url_foto) urls.push(fotos[0].url_foto)
    if (urls.length >= max) break
  }
  return urls
}

export async function fetchDadosDivulgacao(prestadorId: number): Promise<DadosDivulgacao> {
  const { data, error } = await supabase
    .from('prestadores')
    .select('id, nome, slug, whatsapp, foto_perfil, verificado, garantia_dias, categorias(nome), cidades(nome)')
    .eq('id', prestadorId)
    .single()
  if (error) throw error
  const p = data as unknown as PrestadorRow

  const [projetosRes, indicacoesRes] = await Promise.all([
    supabase
      .from('portfolio_projetos')
      .select('id, portfolio_fotos(url_foto, ordem)')
      .eq('prestador_id', prestadorId)
      .eq('status', 'finalizado')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('avaliacoes')
      .select('id', { count: 'exact', head: true })
      .eq('prestador_id', prestadorId)
      .eq('visivel', true)
      .eq('indica', true),
  ])
  if (projetosRes.error) throw projetosRes.error
  if (indicacoesRes.error) throw indicacoesRes.error
  const projetos = (projetosRes.data ?? []) as unknown as ProjetoRow[]

  return {
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    categoria: um(p.categorias)?.nome ?? null,
    cidade: um(p.cidades)?.nome ?? null,
    verificado: p.verificado === true,
    whatsapp: p.whatsapp,
    fotoPerfilUrl: p.foto_perfil,
    totalIndicacoes: indicacoesRes.count ?? 0,
    totalConcluidos: projetos.length,
    garantiaDias: p.garantia_dias ?? 0,
    fotosPortfolio: escolherFotosPortfolio(projetos),
  }
}

export type AcaoDivulgacao = 'BAIXAR_MATERIAL_DIVULGACAO' | 'COPIAR_LINK_DIVULGACAO' | 'COPIAR_MENSAGEM_DIVULGACAO'

/** Fire-and-forget: medir uso não pode atrapalhar o prestador. */
export function registrarUsoDivulgacao(prestadorId: number, acao: AcaoDivulgacao, detalhe: string) {
  insertLog({ acao, entidadeTipo: 'prestador', entidadeId: String(prestadorId), detalhes: { detalhe, origem: 'dashboard' } }).catch(() => {})
}
