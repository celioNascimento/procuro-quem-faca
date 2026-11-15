// lib/garantia/oferta.ts
//
// Quando o PRESTADOR pode oferecer reparo a uma avaliação negativa. Espelha a regra do banco
// (função garantia_oferecer_reparo, que é quem decide de verdade): aqui só serve para a tela
// mostrar ou esconder o formulário, sem convidar o prestador a tentar algo que o banco vai recusar.

export interface AvaliacaoParaOferta {
  nota: number
  indica: boolean | null
  oculta_por_garantia: boolean | null
}

export function podeOferecerReparo(av: AvaliacaoParaOferta | null, garantiaDias: number | null | undefined): boolean {
  if (!av) return false
  if (!garantiaDias || garantiaDias <= 0) return false // exige garantia configurada no perfil
  if (av.oculta_por_garantia) return false             // já resolvida via garantia
  return (av.indica ?? true) === false || av.nota <= 3 // negativa: não indica ou nota até 3
}
