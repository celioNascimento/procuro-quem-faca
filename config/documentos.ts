// config/documentos.ts
//
// Versão dos documentos legais (Termos de Uso e Política de Privacidade) e regras do aceite.
//
// QUANDO OS TEXTOS MUDAREM (por exemplo, depois da revisão do advogado): aumentar VERSAO_DOCUMENTOS.
// Com a versão nova, todos os usuários logados passam de novo pela tela de aceite.

export const VERSAO_DOCUMENTOS = '2026-11'

// Tipos gravados em `consentimentos` que o aceite exige (valores aceitos pelo banco)
export const CONSENTIMENTOS_OBRIGATORIOS = ['termos_uso', 'politica_privacidade'] as const

export type TipoConsentimento = (typeof CONSENTIMENTOS_OBRIGATORIOS)[number]

export type OrigemConsentimento =
  | 'cadastro_prestador'
  | 'cadastro_cliente'
  | 'upload_foto'
  | 'painel'
  | 'login'
  | 'outro'

// Rotas em que a tela de aceite não aparece: a pessoa precisa conseguir ler os documentos,
// entrar, recuperar a senha ou excluir a conta sem ser bloqueada. No /cadastro de prestador
// o aceite é feito e gravado pelo próprio formulário.
const ROTAS_SEM_ACEITE = [
  '/termos',
  '/privacidade',
  '/login',
  '/auth',
  '/cadastro',
  '/recuperar-senha',
  '/confirmar-exclusao',
  '/reivindicar',
  '/admin',
] as const

export function rotaExigeAceite(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return !ROTAS_SEM_ACEITE.some(rota => pathname === rota || pathname.startsWith(`${rota}/`))
}
