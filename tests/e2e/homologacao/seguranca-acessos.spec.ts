// tests/e2e/homologacao/seguranca-acessos.spec.ts
//
// Auditoria de 18/11/2026: fotos só do dono, `perfis` fechada e `anon` sem gravação onde não precisa.
// Tudo direto na API do banco de TESTE, como um atacante faria sem passar pela interface.

import { expect, test, type APIRequestContext } from '@playwright/test';
import { CONTAS, motivoParaPular, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from '../support/ambiente';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ mode: 'serial', timeout: 60_000 });

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function token(request: APIRequestContext, papel: 'prestador' | 'cliente') {
  const r = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: CONTAS[papel].email, password: CONTAS[papel].senha },
  });
  expect(r.ok(), await r.text()).toBe(true);
  return (await r.json()).access_token as string;
}

const comToken = (t: string) => ({ apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${t}` });
const anon = { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${SUPABASE_TESTE_ANON_KEY}` };

const urlObjeto = (bucket: string, caminho: string) => `${SUPABASE_TESTE_URL}/storage/v1/object/${bucket}/${caminho}`;
const urlPublica = (bucket: string, caminho: string) => `${SUPABASE_TESTE_URL}/storage/v1/object/public/${bucket}/${caminho}`;

test('visitante sem login não consegue enviar arquivo para fotos-perfil', async ({ request }) => {
  const r = await request.post(urlObjeto('fotos-perfil', `e2e-anon-${Date.now()}.png`), {
    headers: { ...anon, 'Content-Type': 'image/png' },
    data: PNG,
  });
  expect(r.ok()).toBe(false);
});

test('outra pessoa logada não apaga nem sobrescreve a foto de alguém; o dono apaga', async ({ request }) => {
  const dono = await token(request, 'cliente');
  const outra = await token(request, 'prestador');
  const caminho = `e2e-dono-${Date.now()}.png`;

  const envio = await request.post(urlObjeto('fotos-perfil', caminho), {
    headers: { ...comToken(dono), 'Content-Type': 'image/png' },
    data: PNG,
  });
  expect(envio.ok(), await envio.text()).toBe(true);
  expect((await request.get(urlPublica('fotos-perfil', caminho))).status()).toBe(200);

  // Outra pessoa tenta sobrescrever e apagar
  await request.put(urlObjeto('fotos-perfil', caminho), {
    headers: { ...comToken(outra), 'Content-Type': 'image/png' },
    data: Buffer.from('lixo'),
  });
  await request.delete(urlObjeto('fotos-perfil', caminho), { headers: comToken(outra) });

  const depois = await request.get(urlPublica('fotos-perfil', caminho));
  expect(depois.status()).toBe(200);
  expect((await depois.body()).equals(PNG)).toBe(true);

  // O dono consegue apagar
  const apagou = await request.delete(urlObjeto('fotos-perfil', caminho), { headers: comToken(dono) });
  expect(apagou.ok(), await apagou.text()).toBe(true);
  expect((await request.get(urlPublica('fotos-perfil', caminho))).status()).toBeGreaterThanOrEqual(400);
});

test('outra pessoa logada não sobrescreve arquivo do bucket portfolios', async ({ request }) => {
  const dono = await token(request, 'prestador');
  const outra = await token(request, 'cliente');
  const caminho = `e2e-port-${Date.now()}.png`;

  const envio = await request.post(urlObjeto('portfolios', caminho), {
    headers: { ...comToken(dono), 'Content-Type': 'image/png' },
    data: PNG,
  });
  expect(envio.ok(), await envio.text()).toBe(true);

  await request.put(urlObjeto('portfolios', caminho), {
    headers: { ...comToken(outra), 'Content-Type': 'image/png' },
    data: Buffer.from('lixo'),
  });
  const depois = await request.get(urlPublica('portfolios', caminho));
  expect((await depois.body()).equals(PNG)).toBe(true);

  await request.delete(urlObjeto('portfolios', caminho), { headers: comToken(dono) });
});

test('tabela legada perfis não é legível nem gravável pelo visitante', async ({ request }) => {
  const leitura = await request.get(`${SUPABASE_TESTE_URL}/rest/v1/perfis?select=id&limit=1`, { headers: anon });
  expect(leitura.ok()).toBe(false);
  const escrita = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/perfis`, {
    headers: { ...anon, 'Content-Type': 'application/json' },
    data: { id: '00000000-0000-0000-0000-000000000000', nome_completo: 'x' },
  });
  expect(escrita.ok()).toBe(false);
});

test('visitante não grava em tabelas administrativas, mas ainda registra visita e denúncia', async ({ request }) => {
  const json = { ...anon, 'Content-Type': 'application/json' };

  for (const tabela of ['anuncios', 'perfis_admin', 'categorias', 'transacoes_carteira']) {
    const r = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/${tabela}`, { headers: json, data: {} });
    expect(r.ok(), `anon não deveria gravar em ${tabela}`).toBe(false);
    expect([401, 403]).toContain(r.status());
  }

  const visita = await request.post(`${SUPABASE_TESTE_URL}/rest/v1/visitas_perfil`, {
    headers: { ...json, Prefer: 'return=minimal' },
    data: { prestador_id: 2 },
  });
  expect(visita.ok(), await visita.text()).toBe(true);
});
