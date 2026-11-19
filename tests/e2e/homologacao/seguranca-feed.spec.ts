// tests/e2e/homologacao/seguranca-feed.spec.ts
//
// Varredura de segurança de 19/11/2026 (feed, curtir/seguir/salvar, Instagram, denúncia).
// Tudo direto na API do banco de TESTE, como um atacante faria sem passar pela interface.

import { expect, test, type APIRequestContext } from '@playwright/test';
import { CONTAS, PERFIL_SEED, motivoParaPular, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from '../support/ambiente';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ timeout: 60_000 });

const anon = { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${SUPABASE_TESTE_ANON_KEY}`, 'Content-Type': 'application/json' };
const rest = (tabela: string, filtro = '') => `${SUPABASE_TESTE_URL}/rest/v1/${tabela}${filtro}`;
const rpc = (nome: string) => `${SUPABASE_TESTE_URL}/rest/v1/rpc/${nome}`;

async function tokenDoPrestador(request: APIRequestContext, papel: 'prestador' | 'prestadorMei' = 'prestador') {
  const r = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: CONTAS[papel].email, password: CONTAS[papel].senha },
  });
  expect(r.ok(), await r.text()).toBe(true);
  const t = (await r.json()).access_token as string;
  return { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
}

test('o feed público nunca devolve WhatsApp, telefone, e-mail nem dados do cliente', async ({ request }) => {
  const r = await request.post(rpc('feed_projetos'), { headers: anon, data: { p_limite: 30 } });
  expect(r.ok(), await r.text()).toBe(true);
  const corpo = await r.text();
  expect(corpo).not.toMatch(/"(whatsapp|telefone|celular|email|e-mail|user_id|cliente[a-z_]*)"\s*:/i);
});

test('visitante não lê quem segue, quem salvou nem quem curtiu', async ({ request }) => {
  for (const tabela of ['seguidores', 'portfolio_salvos', 'portfolio_curtidas']) {
    const r = await request.get(rest(tabela, '?select=*&limit=5'), { headers: anon });
    const linhas = r.ok() ? await r.json() : [];
    expect(linhas, `${tabela} vazou linhas para visitante`).toEqual([]);
  }
});

test('visitante não consegue seguir, curtir, salvar nem ocultar trabalho', async ({ request }) => {
  const chamadas: [string, Record<string, unknown>][] = [
    ['seguir_prestador', { p_prestador_id: PERFIL_SEED.id }],
    ['alternar_curtida', { p_projeto_id: '00000000-0000-4000-8000-000000000000' }],
    ['alternar_salvo', { p_projeto_id: '00000000-0000-4000-8000-000000000000' }],
    ['feed_ocultar_projeto', { p_projeto_id: '00000000-0000-4000-8000-000000000000', p_ocultar: true }],
  ];
  for (const [nome, dados] of chamadas) {
    const r = await request.post(rpc(nome), { headers: anon, data: dados });
    const texto = await r.text();
    expect(texto, nome).not.toMatch(/"ok"|"curtido"\s*:\s*true|"salvo"\s*:\s*true/);
  }
});

test('ninguém escreve direto nas tabelas de curtir/seguir/salvar (só pelas funções)', async ({ request }) => {
  const logado = await tokenDoPrestador(request);
  for (const [tabela, dados] of [
    ['portfolio_curtidas', { projeto_id: '00000000-0000-4000-8000-000000000000' }],
    ['seguidores', { prestador_id: PERFIL_SEED.id }],
    ['portfolio_salvos', { projeto_id: '00000000-0000-4000-8000-000000000000' }],
  ] as const) {
    const r = await request.post(rest(tabela), { headers: { ...logado, Prefer: 'return=minimal' }, data: dados });
    expect(r.ok(), `${tabela} aceitou escrita direta`).toBe(false);
  }
});

test('slug com "/" ou "." é recusado pelo banco (evita link que sai do PQF)', async ({ request }) => {
  const logado = await tokenDoPrestador(request);
  for (const slug of ['/evil.com', 'evil.com', 'a b', 'Maiuscula']) {
    const r = await request.patch(rest('prestadores', `?id=eq.${PERFIL_SEED.id}`), { headers: { ...logado, Prefer: 'return=representation' }, data: { slug } });
    const corpo = r.ok() ? await r.json() : [];
    expect(corpo, `slug "${slug}" foi aceito`).toEqual([]);
  }
  const atual = await request.get(rest('prestadores', `?id=eq.${PERFIL_SEED.id}&select=slug`), { headers: anon });
  expect((await atual.json())[0].slug).toBe(PERFIL_SEED.slug);
});

test('Instagram fora do formato é recusado pelo banco', async ({ request }) => {
  const logado = await tokenDoPrestador(request);
  for (const instagram of ['https://evil.com/x', 'a b', '@@dupla', 'x'.repeat(40)]) {
    const r = await request.patch(rest('prestadores', `?id=eq.${PERFIL_SEED.id}`), { headers: { ...logado, Prefer: 'return=representation' }, data: { instagram } });
    const corpo = r.ok() ? await r.json() : [];
    expect(corpo, `instagram "${instagram}" foi aceito`).toEqual([]);
  }
});

test('denúncia com texto gigante é recusada (limite de 3000 caracteres)', async ({ request }) => {
  const r = await request.post(rest('denuncias'), {
    headers: { ...anon, Prefer: 'return=minimal' },
    data: { prestador_id: PERFIL_SEED.id, motivo: 'x'.repeat(3001), status: 'aberta' },
  });
  expect(r.ok(), 'denúncia gigante foi aceita').toBe(false);
});

test('limite de ritmo: a 31ª tentativa de seguir em 1 minuto é barrada', async ({ request }) => {
  // Conta que nenhum outro teste usa para seguir, para não atrapalhar a cota de ninguém.
  const logado = await tokenDoPrestador(request, 'prestadorMei');
  let ultima = '';
  for (let i = 0; i < 31; i++) {
    const r = await request.post(rpc('seguir_prestador'), { headers: logado, data: { p_prestador_id: PERFIL_SEED.id } });
    ultima = (await r.text()).replace(/"/g, '');
  }
  expect(ultima).toBe('muito_rapido');
});

test('foto de trabalho só aceita endereço do Storage do projeto', async ({ request }) => {
  const logado = await tokenDoPrestador(request);
  const lista = await request.get(rest('portfolio_fotos', '?select=id,url_foto&limit=1'), { headers: logado });
  const [foto] = lista.ok() ? await lista.json() : [];
  test.skip(!foto, 'sem foto de teste para tentar');
  const r = await request.patch(rest('portfolio_fotos', `?id=eq.${foto.id}`), {
    headers: { ...logado, Prefer: 'return=representation' },
    data: { url_foto: 'https://rastreador.exemplo/p.gif' },
  });
  expect(r.ok() ? await r.json() : [], 'URL externa foi aceita').toEqual([]);
  const depois = await request.get(rest('portfolio_fotos', `?id=eq.${foto.id}&select=url_foto`), { headers: logado });
  expect((await depois.json())[0].url_foto).toBe(foto.url_foto);
});
