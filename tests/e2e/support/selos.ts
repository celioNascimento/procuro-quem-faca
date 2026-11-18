// tests/e2e/support/selos.ts
//
// Ajudantes dos E2E dos selos calculados (Etapa 2, Parte B). Chamam funções que só existem no banco de TESTE
// (supabase/homologacao/reset_fixtures.sql) e que recusam rodar sem o marcador "homologacao".

import { SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_REF, SUPABASE_TESTE_URL } from './ambiente';

async function rpcTeste(nome: string, corpo: Record<string, unknown>) {
  if (!SUPABASE_TESTE_URL.includes(SUPABASE_TESTE_REF)) {
    throw new Error(`Recusado: ${SUPABASE_TESTE_URL} não é o banco de teste.`);
  }
  const resposta = await fetch(`${SUPABASE_TESTE_URL}/rest/v1/rpc/${nome}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_TESTE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_TESTE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(corpo),
  });
  if (!resposta.ok) throw new Error(`${nome} falhou (HTTP ${resposta.status}): ${await resposta.text()}`);
}

/** Cria N serviços finalizados e avaliados, cada um por um cliente diferente. O reset apaga tudo. */
export function semearExperiencia(prestadorId: number, servicos: number, nota = 5) {
  return rpcTeste('e2e_semear_experiencia', { p_prestador_id: prestadorId, p_servicos: servicos, p_nota: nota });
}

/** Define a data de abertura (AAAA-MM-DD) e o CNAE do CNPJ fictício do prestador. */
export function ajustarCnpj(prestadorId: number, dataAbertura: string, cnae: string) {
  return rpcTeste('e2e_ajustar_cnpj', { p_prestador_id: prestadorId, p_data_abertura: dataAbertura, p_cnae: cnae });
}

/** Data de hoje menos N anos (e um dia, para ficar além do aniversário), em AAAA-MM-DD. */
export function haAnos(anos: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
