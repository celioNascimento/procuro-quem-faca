// lib/selos/evolucao.ts
// Barra de evolução: fala em conquistas, nunca em "perfil incompleto". Estados "em_breve" e "nao_aplica"
// aparecem na lista, mas não entram na conta. É só visual: não muda a ordem da busca.

import { META_EXPERIENCIA } from '@/config/selos'
import type { FaseSeloCnpj } from './cnpjEstado'
import { textoTempoCnpj, type FaixaTempoCnpj } from './tempoCnpj'
import type { FaseDocumento } from './documentos'
import { linkWhatsappSuporte } from '@/lib/help/chat-ajuda'

export type EstadoConquista =
  | 'conquistado'
  | 'em_andamento'   // CNPJ em conferência pela equipe
  | 'em_progresso'   // acumulando (ex.: 3 de 10 clientes)
  | 'disponivel'
  | 'depende_cnpj'   // só existe depois do CNPJ ativo
  | 'nao_aplica'     // não vale para este perfil (ex.: CNAE de outra atividade); não conta
  | 'nao_sabemos'    // ainda não sabemos qual CNAE combina com a categoria; pedimos ajuda; não conta
  | 'em_breve'       // ainda não disponível; não conta

export interface Conquista {
  id: string
  titulo: string
  estado: EstadoConquista
  detalhe?: string
  /** Convite para a pessoa nos ajudar (ex.: informar o CNAE da categoria). */
  acao?: { texto: string; href: string }
}

export interface ResumoEvolucao {
  conquistados: number
  total: number
  percentual: number
  texto: string
}

/** O que o banco informa sobre os selos calculados (null enquanto carrega ou se a consulta falhar). */
export interface ExtrasEvolucao {
  experiencia: { servicos: number; clientes: number; atingido: boolean }
  tempoCnpj: FaixaTempoCnpj | null
  atividadeCompativel: boolean
  /** true quando a categoria do perfil não tem nenhum CNAE cadastrado (não sabemos conferir). */
  categoriaSemMapeamento?: boolean
  /** Nível calculado pelo banco ('bronze', 'prata') ou null. */
  nivel?: string | null
}

const NAO_CONTAM: EstadoConquista[] = ['em_breve', 'nao_aplica', 'nao_sabemos']

/** Mensagem do WhatsApp do PQF para quem quer ajudar a mapear o CNAE da própria categoria. */
export const PEDIDO_AJUDA_CNAE =
  'Quero ajudar com o selo "Atividade compatível": minha categoria ainda não tem CNAE cadastrado e posso informar qual código uso.'

export function resumoEvolucao(conquistas: Conquista[]): ResumoEvolucao {
  const contam = conquistas.filter((c) => !NAO_CONTAM.includes(c.estado))
  const conquistados = contam.filter((c) => c.estado === 'conquistado').length
  const total = contam.length
  const percentual = total === 0 ? 0 : Math.round((conquistados / total) * 100)
  const texto = `${conquistados} de ${total} ${total === 1 ? 'selo conquistado' : 'selos conquistados'}`
  return { conquistados, total, percentual, texto }
}

export interface FasesDocumentos { seguro: FaseDocumento; cnd: FaseDocumento }

function conquistaDocumento(id: 'seguro' | 'cnd', titulo: string, fase: FaseDocumento | undefined): Conquista {
  if (!fase) return { id, titulo, estado: 'em_breve' }
  if (fase === 'aprovado' || fase === 'a_vencer') return { id, titulo, estado: 'conquistado', detalhe: fase === 'a_vencer' ? 'Perto de vencer: envie o comprovante atualizado.' : undefined }
  if (fase === 'em_conferencia') return { id, titulo, estado: 'em_andamento' }
  return { id, titulo, estado: 'disponivel', detalhe: fase === 'expirado' ? 'Venceu: envie um comprovante atualizado.' : undefined }
}

export function montarConquistas(faseCnpj: FaseSeloCnpj, extras: ExtrasEvolucao | null = null, docs?: FasesDocumentos): Conquista[] {
  const estadoCnpj: EstadoConquista =
    faseCnpj === 'aprovado' ? 'conquistado' : faseCnpj === 'em_conferencia' ? 'em_andamento' : 'disponivel'
  const cnpj: Conquista = { id: 'cnpj', titulo: 'CNPJ ativo', estado: estadoCnpj }

  if (!extras) {
    return [
      cnpj,
      { id: 'experiencia', titulo: 'Experiência no PQF', estado: 'em_breve' },
      { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'em_breve' },
      { id: 'atividade', titulo: 'Atividade compatível', estado: 'em_breve' },
      conquistaDocumento('seguro', 'Seguro de responsabilidade civil', docs?.seguro),
      conquistaDocumento('cnd', 'CND federal', docs?.cnd),
    ]
  }

  const cnpjAtivo = faseCnpj === 'aprovado'
  const { servicos, clientes, atingido } = extras.experiencia
  const experiencia: Conquista = {
    id: 'experiencia',
    titulo: 'Experiência no PQF',
    estado: atingido ? 'conquistado' : servicos > 0 ? 'em_progresso' : 'disponivel',
    detalhe: atingido
      ? undefined
      : `${Math.min(clientes, META_EXPERIENCIA.clientes)} de ${META_EXPERIENCIA.clientes} clientes diferentes avaliaram seus serviços`,
  }

  const tempo: Conquista = !cnpjAtivo
    ? { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'depende_cnpj', detalhe: 'Aparece depois do CNPJ ativo.' }
    : extras.tempoCnpj
      ? { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'conquistado', detalhe: textoTempoCnpj(extras.tempoCnpj) }
      : { id: 'tempo_cnpj', titulo: 'Tempo de CNPJ', estado: 'em_breve', detalhe: 'Aparece quando o CNPJ completar 1 ano.' }

  const atividade: Conquista = !cnpjAtivo
    ? { id: 'atividade', titulo: 'Atividade compatível', estado: 'depende_cnpj', detalhe: 'Aparece depois do CNPJ ativo.' }
    : extras.atividadeCompativel
      ? { id: 'atividade', titulo: 'Atividade compatível', estado: 'conquistado' }
      : extras.categoriaSemMapeamento
        ? {
            id: 'atividade',
            titulo: 'Atividade compatível',
            estado: 'nao_sabemos',
            detalhe: 'Ainda não sabemos qual atividade de CNPJ combina com a sua categoria, então não conseguimos conferir este selo. Se você sabe, ajude-nos.',
            acao: { texto: 'Contar qual CNAE eu uso', href: linkWhatsappSuporte('prestador', PEDIDO_AJUDA_CNAE) },
          }
        : {
          id: 'atividade',
          titulo: 'Atividade compatível',
          estado: 'nao_aplica',
          detalhe: 'Nenhuma atividade registrada no CNPJ combina com a categoria do perfil.',
        }

  return [
    cnpj, experiencia, tempo, atividade,
    conquistaDocumento('seguro', 'Seguro de responsabilidade civil', docs?.seguro),
    conquistaDocumento('cnd', 'CND federal', docs?.cnd),
  ]
}
