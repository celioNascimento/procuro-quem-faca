// lib/auth/avatarConta.ts
//
// Qual foto aparece no avatar do cabeçalho. Ordem: foto enviada no perfil (Meus dados) > foto da
// conta Google > nenhuma (o componente mostra o ícone de usuário). Mesma regra do painel do cliente
// (`usePerfilDados`), para a pessoa ver a mesma foto em todo o app.

export type MetadadosDaConta = {
  picture?: unknown
  avatar_url?: unknown
} | null | undefined

function textoOuVazio(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** Foto da conta Google. O Google pode preencher `picture`, `avatar_url` ou os dois. */
export function fotoDaContaGoogle(metadados: MetadadosDaConta): string {
  return textoOuVazio(metadados?.picture) || textoOuVazio(metadados?.avatar_url)
}

/** Foto final do avatar; string vazia quando não há nenhuma. */
export function escolherAvatarConta(fotoDoPerfil: string | null | undefined, metadados: MetadadosDaConta): string {
  return textoOuVazio(fotoDoPerfil) || fotoDaContaGoogle(metadados)
}
