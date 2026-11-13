// lib/cadastro/pendencias.ts
//
// O botão "Finalizar Cadastro" só fica ativo quando todo o formulário está pronto. Esta função diz,
// em palavras simples, o que ainda falta, para a pessoa nunca ficar diante de um botão cinza sem
// saber o motivo. A lista segue exatamente as mesmas regras do cálculo do progresso.

export interface DadosDoCadastro {
  nome?: string | null
  whatsapp?: string | null
  grupo_id?: string | number | null
  categoria_id?: string | number | null
  cidade_id?: string | number | null
  foto_perfil?: string | null
  slugDisponivel: boolean
  aceitouTermos: boolean
  aceitouPrivacidade: boolean
  // Só conta quando a pessoa ainda não está logada (a conta é criada junto com o cadastro)
  logado: boolean
  email?: string
  senha?: string
  confirmarSenha?: string
}

export function listarPendenciasCadastro(d: DadosDoCadastro): string[] {
  const faltando: string[] = []

  if (!((d.nome ?? '').trim().length > 3)) faltando.push('Seu nome ou o nome do seu negócio (mínimo 4 letras)')
  if (!((d.whatsapp ?? '').replace(/\D/g, '').length >= 10)) faltando.push('Seu WhatsApp com DDD')
  if (!d.grupo_id) faltando.push('O grupo do seu serviço')
  if (!d.categoria_id) faltando.push('A categoria do seu serviço')
  if (!d.cidade_id) faltando.push('A cidade onde você atende')
  if (!(d.foto_perfil && d.foto_perfil.length > 10)) faltando.push('Uma foto de perfil ou logo')
  if (!d.slugDisponivel) faltando.push('Um endereço de perfil disponível (troque o texto, se este já estiver em uso)')

  if (!d.logado) {
    if (!(d.email ?? '').includes('@')) faltando.push('Um e-mail válido')
    if (!((d.senha ?? '').length >= 6)) faltando.push('Uma senha com pelo menos 6 caracteres')
    else if (d.senha !== d.confirmarSenha) faltando.push('A confirmação da senha igual à senha')
  }

  if (!d.aceitouTermos) faltando.push('Aceitar os Termos de Uso')
  if (!d.aceitouPrivacidade) faltando.push('Aceitar a Política de Privacidade')

  return faltando
}