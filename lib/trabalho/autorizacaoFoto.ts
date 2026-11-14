// lib/trabalho/autorizacaoFoto.ts
//
// O banco só aceita "aparece pessoa na foto" junto com "autorização confirmada"
// (constraint portfolio_fotos_consentimento_terceiros_chk: NOT contem_pessoas OR consentimento_terceiros_confirmado).
// Enquanto o prestador marcou o rosto mas ainda não confirmou a autorização, o estado fica só na tela
// (e já bloqueia o envio ao cliente). Esta função diz o que, de fato, deve ser gravado.

export type GravacaoDaAutorizacao =
  | { gravar: false }
  | { gravar: true; contemPessoas: boolean; autorizado: boolean }

export function planoDeGravacaoDaAutorizacao(
  novo: { contemPessoas: boolean; autorizado: boolean },
  jaConfirmadoNoBanco: boolean,
): GravacaoDaAutorizacao {
  const incompleto = novo.contemPessoas && !novo.autorizado
  if (!incompleto) return { gravar: true, contemPessoas: novo.contemPessoas, autorizado: novo.autorizado }
  // Autorização que estava salva e foi retirada: limpa o registro (o banco não guarda "pessoa sem autorização").
  if (jaConfirmadoNoBanco) return { gravar: true, contemPessoas: false, autorizado: false }
  return { gravar: false }
}
