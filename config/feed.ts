// config/feed.ts
//
// Aviso do feed mostrado ao cliente no "Aceitar trabalho". Ao aceitar, o app envia a versão abaixo
// e o banco grava `feed_aceito_em` e `feed_aceito_versao`: só assim o trabalho pode entrar no feed.
//
// QUANDO O TEXTO MUDAR (por exemplo, depois da revisão do advogado): aumentar VERSAO_AVISO_FEED.
// Trabalhos já aceitos continuam com a versão que o cliente viu.

export const VERSAO_AVISO_FEED = '2026-11-feed-1'

export const TEXTO_AVISO_FEED =
  'Ao aceitar, as fotos deste trabalho aparecem no perfil e no feed de divulgação do prestador. ' +
  'Seu nome, telefone e endereço nunca aparecem. Você pode tirar o trabalho do feed quando quiser, em Meus serviços.'
