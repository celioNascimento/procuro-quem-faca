// lib/selos/motivosCnpj.ts
// Por que informar o CNPJ. Fonte única: aparece na aba CNPJ do painel e no artigo da Central de ajuda,
// para os dois dizerem sempre a mesma coisa. O texto promete só o que o sistema faz: o selo NÃO muda a
// posição na busca, e o número do CNPJ e a razão social nunca aparecem para o cliente.

export interface MotivoCnpj {
  titulo: string
  texto: string
}

export const MOTIVOS_CNPJ: readonly MotivoCnpj[] = [
  {
    titulo: 'O cliente vê confiança antes de te chamar',
    texto:
      'Quem contrata ainda não te conhece. O selo "CNPJ ativo" aparece no seu cartão na busca e no seu perfil, e mostra que a Receita Federal reconhece o seu negócio como ativo.',
  },
  {
    titulo: 'Você ganha uma marca que ajuda o cliente a decidir',
    texto:
      'Na lista de profissionais, o selo ao lado do seu nome é um motivo a mais para o cliente escolher você. Ele não muda a posição na busca: quem não tem o selo não perde lugar.',
  },
  {
    titulo: 'É o primeiro passo para subir de nível',
    texto:
      'O CNPJ ativo é a base do nível Bronze. Com 10 serviços avaliados por 10 clientes diferentes no PQF, você chega ao nível Prata. Também liberam os selos de tempo de CNPJ e de atividade compatível.',
  },
  {
    titulo: 'Ajuda a fechar serviços para empresas e condomínios',
    texto:
      'Lojas, condomínios e empresas costumam querer contratar quem tem CNPJ. Com o selo, você já mostra isso no seu perfil, sem precisar explicar.',
  },
  {
    titulo: 'É seguro, gratuito e você controla',
    texto:
      'O cliente vê apenas "CNPJ ativo" e a data da consulta. O número do CNPJ e a razão social não aparecem para ninguém. É opcional e você pode remover quando quiser. Vale também para MEI.',
  },
]
