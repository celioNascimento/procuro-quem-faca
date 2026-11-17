// tests/e2e/support/ambiente.ts
//
// Configuração do ambiente de homologação para os testes E2E.
//
// Regra de ouro: testes que entram com contas e gravam dados só rodam contra o
// ambiente de homologação (banco de teste). Nunca contra produção.

/** Domínios de produção. Qualquer teste mutável aborta se a base apontar para eles. */
const HOSTS_PRODUCAO = ['procuroquemfaca.com.br', 'www.procuroquemfaca.com.br']

/** Projeto Supabase de TESTE. Toda chamada ao Supabase durante o E2E deve ir para ele. */
export const SUPABASE_TESTE_REF = 'qvrkmaavbrtjnwcaocax'

/** Projeto Supabase de PRODUÇÃO. Se aparecer em qualquer requisição, o teste falha. */
export const SUPABASE_PRODUCAO_REF = 'skhqvcluiacwujeeqefg'

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000'

/** Só liga os testes de homologação quando o workflow (ou o dev) pede explicitamente. */
export const HOMOLOGACAO_ATIVA = process.env.E2E_HOMOLOGACAO === '1'

export function baseAponta_para_producao(base: string = BASE_URL): boolean {
  try {
    return HOSTS_PRODUCAO.includes(new URL(base).hostname)
  } catch {
    return false
  }
}

/** Motivo para pular os testes de homologação, ou null se podem rodar. */
export function motivoParaPular(): string | null {
  if (!HOMOLOGACAO_ATIVA) {
    return 'Testes de homologação desligados (defina E2E_HOMOLOGACAO=1 e E2E_BASE_URL do ambiente de teste).'
  }
  if (baseAponta_para_producao()) {
    return 'E2E_BASE_URL aponta para produção: testes com conta e gravação são proibidos aqui.'
  }
  return null
}

export type Papel = 'prestador' | 'cliente'

/**
 * Contas fictícias do banco de teste (domínio .invalid, não recebem e-mail).
 * A senha é fictícia e fixa; pode ser sobrescrita por variável de ambiente.
 */
const SENHA_PADRAO_TESTE = 'Teste@1234'

export const CONTAS: Record<Papel, { email: string; senha: string; nome: string }> = {
  prestador: {
    email: process.env.E2E_PRESTADOR_EMAIL ?? 'prestador@pqf-teste.invalid',
    senha: process.env.E2E_PRESTADOR_SENHA ?? SENHA_PADRAO_TESTE,
    nome: 'Pedro Pedreiro Teste',
  },
  cliente: {
    email: process.env.E2E_CLIENTE_EMAIL ?? 'cliente@pqf-teste.invalid',
    senha: process.env.E2E_CLIENTE_SENHA ?? SENHA_PADRAO_TESTE,
    nome: 'Clara Cliente Teste',
  },
}

/** Perfil público fictício semeado no banco de teste. */
export const PERFIL_SEED = {
  slug: 'pedro-pedreiro-teste-pedreiro-londrina',
  nome: 'Pedro Pedreiro Teste',
  id: 2,
} as const
