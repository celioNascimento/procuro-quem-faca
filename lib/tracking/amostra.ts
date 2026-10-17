// lib/tracking/amostra.ts
//
// Regra única de "este clique deve ser registrado?" durante o teste por amostra.
//   modo 'todos'   -> registra para todos os prestadores
//   modo 'amostra' -> registra só para quem está na tabela rastreio_amostra
// Qualquer outro valor (inclusive ausente) é tratado como 'amostra', o lado seguro.
// Função pura: não acessa banco.

export function deveRastrear(modo: string | null | undefined, naAmostra: boolean): boolean {
  if (modo === 'todos') return true
  return naAmostra
}
