// tests/e2e/homologacao/foto-unica.spec.ts
//
// Foto única (20/11/2026): quem tem conta de prestador e de cliente usa a mesma foto nos dois perfis.
// Direto na API do banco de TESTE, como a interface faria. Restaura tudo no final.

import { expect, test, type APIRequestContext } from '@playwright/test';
import { CONTAS, motivoParaPular, SUPABASE_TESTE_ANON_KEY, SUPABASE_TESTE_URL } from '../support/ambiente';

test.skip(motivoParaPular() !== null, motivoParaPular() ?? '');
test.describe.configure({ timeout: 60_000 });

const rest = (tabela: string, filtro = '') => `${SUPABASE_TESTE_URL}/rest/v1/${tabela}${filtro}`;
const BUCKET = `${SUPABASE_TESTE_URL}/storage/v1/object/public/fotos-perfil`;

async function entrar(request: APIRequestContext) {
  const r = await request.post(`${SUPABASE_TESTE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_TESTE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: CONTAS.prestador.email, password: CONTAS.prestador.senha },
  });
  expect(r.ok(), await r.text()).toBe(true);
  const corpo = await r.json();
  const headers = { apikey: SUPABASE_TESTE_ANON_KEY, Authorization: `Bearer ${corpo.access_token as string}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  return { headers, userId: corpo.user.id as string };
}

test('foto única: prestador e cliente da mesma conta sempre mostram a mesma foto', async ({ request }) => {
  const { headers, userId } = await entrar(request);
  const meuPrestador = rest('prestadores', `?user_id=eq.${userId}`);
  const meuPerfil = rest('profiles', `?id=eq.${userId}`);

  const lerFotoPrestador = async () => ((await (await request.get(`${meuPrestador}&select=foto_perfil`, { headers })).json()) as { foto_perfil: string | null }[])[0]?.foto_perfil ?? null;
  const lerAvatar = async () => ((await (await request.get(`${meuPerfil}&select=avatar_url`, { headers })).json()) as { avatar_url: string | null }[])[0]?.avatar_url ?? null;

  const fotoOriginal = await lerFotoPrestador();
  const avatarOriginal = await lerAvatar();
  const sufixo = Date.now();
  const fotoDoPrestador = `${BUCKET}/e2e-prestador-${sufixo}.png`;
  const fotoDoCliente = `${BUCKET}/e2e-cliente-${sufixo}.png`;

  try {
    // 1) o prestador troca a foto: o cliente acompanha
    const p1 = await request.patch(meuPrestador, { headers, data: { foto_perfil: fotoDoPrestador } });
    expect(p1.ok(), await p1.text()).toBe(true);
    expect((await p1.json()).length, 'o prestador não conseguiu trocar a própria foto').toBe(1);
    expect(await lerAvatar()).toBe(fotoDoPrestador);

    // 2) o cliente envia uma foto nova (do PQF): o prestador acompanha
    const p2 = await request.patch(meuPerfil, { headers, data: { avatar_url: fotoDoCliente } });
    expect(p2.ok(), await p2.text()).toBe(true);
    expect((await p2.json()).length, 'o cliente não conseguiu trocar o próprio avatar').toBe(1);
    expect(await lerFotoPrestador()).toBe(fotoDoCliente);

    // 3) foto de fora do PQF (ex.: Google) não sobrescreve a foto do prestador
    const p3 = await request.patch(meuPerfil, { headers, data: { avatar_url: 'https://lh3.googleusercontent.com/a/e2e' } });
    expect(p3.ok(), await p3.text()).toBe(true);
    expect(await lerFotoPrestador()).toBe(fotoDoCliente);
  } finally {
    // devolve o estado original (a foto do prestador primeiro, depois o avatar)
    await request.patch(meuPrestador, { headers, data: { foto_perfil: fotoOriginal } });
    await request.patch(meuPerfil, { headers, data: { avatar_url: avatarOriginal } });
  }
});
