// tests/e2e/homologacao/auditoria-banco.spec.ts
//
// Auditor de segurança do banco de TESTE (o schema é o mesmo da produção, menos os auxiliares e2e_*).
// Falha quando aparece algo novo que ninguém aprovou: tabela sem RLS, função "security definer" sem search_path,
// função aberta a visitante ou gravação aberta a visitante. Se a mudança for proposital, inclua o nome na lista
// abaixo NO MESMO commit (a lista é a decisão registrada). SQL do auditor: supabase/homologacao/auditoria_seguranca.sql.

import { expect, test } from '@playwright/test';
import { CONTAS, motivoParaPular, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from '../support/ambiente';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');

// Funções que o visitante (sem login) pode chamar de propósito: leitura pública, selos, feed e fluxos por token.
const VISITANTE_PODE_EXECUTAR = new Set([
  'categoria_sem_mapeamento_cnae', 'consultar_perfil_por_token', 'excluir_perfil_por_token', 'experiencia_no_pqf',
  'feed_cidades', 'feed_projetos', 'foto_do_projeto_pode_ser_vista', 'niveis_dos_prestadores', 'nivel_do_prestador',
  'perfil_social', 'placar_indicacoes_dos_prestadores', 'registrar_solicitacao_titular', 'selos_publicos',
  'total_seguidores', 'usuario_tem_acesso_ao_caso_garantia',
]);
// Auxiliares do ambiente de teste: existem só na homologação (travados pelo marcador do ambiente).
const AUXILIAR_DE_TESTE = /^e2e_/;
// Gravações abertas a visitante: denúncia, registro de atividade e contagem de visita.
const VISITANTE_PODE_GRAVAR = new Set(['denuncias:INSERT', 'logs_atividades:INSERT', 'visitas_perfil:INSERT']);

async function auditar(request: import('@playwright/test').APIRequestContext) {
  const login = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: CONTAS.prestador.email, password: CONTAS.prestador.senha },
  });
  expect(login.ok(), await login.text()).toBe(true);
  const token = (await login.json()).access_token as string;
  const r = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/e2e_auditar_seguranca`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {},
  });
  expect(r.ok(), await r.text()).toBe(true);
  return (await r.json()) as { sem_rls: string[]; secdef_sem_search_path: string[]; anon_executa: string[]; anon_escreve: string[] };
}

test('toda tabela do schema public tem RLS ligada', async ({ request }) => {
  expect((await auditar(request)).sem_rls).toEqual([]);
});

test('toda função "security definer" fixa o search_path', async ({ request }) => {
  expect((await auditar(request)).secdef_sem_search_path).toEqual([]);
});

test('visitante só executa as funções aprovadas', async ({ request }) => {
  const novas = (await auditar(request)).anon_executa.filter(n => !VISITANTE_PODE_EXECUTAR.has(n) && !AUXILIAR_DE_TESTE.test(n));
  expect(novas, `função nova aberta a visitante: ${novas.join(', ')}. Se for proposital, aprove na lista deste teste.`).toEqual([]);
});

test('visitante só grava onde foi aprovado', async ({ request }) => {
  const novas = (await auditar(request)).anon_escreve.filter(g => !VISITANTE_PODE_GRAVAR.has(g));
  expect(novas, `gravação nova aberta a visitante: ${novas.join(', ')}`).toEqual([]);
});

test('o auditor não é chamável por visitante', async ({ request }) => {
  const r = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/rpc/e2e_auditar_seguranca`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${SUPABASE_TESTE_ANON_KEY}`, 'Content-Type': 'application/json' },
    data: {},
  });
  expect(r.ok()).toBe(false);
});
