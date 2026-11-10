// config/controlador.ts
//
// Dados do controlador de dados pessoais (LGPD, art. 5º, VI e art. 9º, III) e do canal de privacidade.
// Fonte única: a Política de Privacidade e a página /reivindicar leem daqui.
//
// QUANDO O PQF TIVER CNPJ: preencher `razaoSocial` e `cnpj` e, se quiser, ajustar `nome`.
// A Política de Privacidade passa a exibir a empresa sozinha; não é preciso mexer na página.

export const CONTROLADOR = {
  // Pessoa física responsável pelo PQF até a abertura da empresa
  nome: 'Celio Roberto Ramos do Nascimento',
  razaoSocial: null as string | null,
  cnpj: null as string | null,
  // Canal de privacidade (encarregado pelo tratamento de dados pessoais) e de pedidos dos titulares
  emailPrivacidade: 'procuroquemfaca@gmail.com',
  // Prazo para responder pedidos de titulares
  prazoRespostaDias: 15,
} as const

export const DATA_ATUALIZACAO_PRIVACIDADE = 'novembro de 2026'
