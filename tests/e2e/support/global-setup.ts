// tests/e2e/support/global-setup.ts
//
// A homologação fica atrás da proteção de deploy da Vercel. Para o robô entrar sem login
// humano, trocamos o segredo de bypass por um cookie de sessão UMA vez, antes de todos os
// testes. O cookie fica em um arquivo de estado que o playwright.config reaproveita.
//
// O segredo vem de E2E_BYPASS_SECRET (GitHub Actions). Nunca é impresso nem gravado:
// só o cookie resultante vai para o arquivo, que está no .gitignore.

import { request } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const ARQUIVO_BYPASS = 'tests/e2e/.auth/bypass.json';

export default async function globalSetup() {
  const segredo = process.env.E2E_BYPASS_SECRET;
  const baseURL = process.env.E2E_BASE_URL;
  if (!segredo || !baseURL) return;

  const contexto = await request.newContext({ baseURL });
  const resposta = await contexto.get('/', {
    params: {
      'x-vercel-protection-bypass': segredo,
      'x-vercel-set-bypass-cookie': 'true',
    },
  });

  if (!resposta.ok()) {
    await contexto.dispose();
    throw new Error(
      `Bypass da proteção de deploy falhou (HTTP ${resposta.status()}). ` +
        'Confira se o segredo E2E_BYPASS_SECRET é o "Protection Bypass for Automation" deste projeto na Vercel.',
    );
  }

  mkdirSync(dirname(ARQUIVO_BYPASS), { recursive: true });
  await contexto.storageState({ path: ARQUIVO_BYPASS });
  await contexto.dispose();
}
