// lib/auth/destinoReivindicacao.ts
//
// Quem abre o link pessoal de um perfil (/cadastro?reivindicar=ID&token=...) sem estar logado é
// mandado para o login. Para não perder o link no caminho, o login recebe o endereço em `?next=` e,
// depois de entrar, volta para ele. Só este formato exato é aceito: qualquer outro valor em `next`
// é ignorado, então ninguém consegue usar o parâmetro para levar o usuário a outro lugar.

const FORMATO = /^\/cadastro\?reivindicar=(\d{1,12})&token=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export function destinoReivindicacaoSeguro(next: string | null | undefined): string | null {
  if (!next) return null
  const partes = FORMATO.exec(next)
  return partes ? `/cadastro?reivindicar=${partes[1]}&token=${partes[2]}` : null
}

// Lê o `next` da URL atual (só no navegador)
export function destinoReivindicacaoDaUrl(): string | null {
  if (typeof window === 'undefined') return null
  return destinoReivindicacaoSeguro(new URLSearchParams(window.location.search).get('next'))
}
