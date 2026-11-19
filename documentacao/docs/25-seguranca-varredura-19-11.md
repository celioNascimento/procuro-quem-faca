# Varredura de segurança — 19/11/2026 (feed, social, Instagram)

## Corrigido (commitado, aguardando push)
- **Next.js 16.3.3 → 16.4.6** (crítico: RCE sem login no otimizador de imagens com SVG, DoS em Server Actions, vazamento de cache). `pnpm audit --prod`: sem vulnerabilidades. O `package-lock.json` (npm) ainda acusa `sharp` e `dompurify`: o repo tem os dois lockfiles; confirmar qual a Vercel usa (pnpm tem prioridade) e apagar o que sobrar.
- **Cabeçalhos de segurança** em `next.config.ts`: nosniff, X-Frame-Options DENY, Referrer-Policy, HSTS, Permissions-Policy. Teste: `tests/seguranca/cabecalhos.test.ts`.
- **Slug do prestador** (`prestadores_slug_formato`, migração `20261119200000`): só `[a-z0-9_-]`. Antes, um slug `/site.com` virava o link `//site.com` (fora do PQF) no feed. Defesa extra no app: `enderecoDoPerfil()` em `lib/feed/feed.ts`.
- **`portfolio_curtidas`**: privilégios de tabela revogados (a RLS já negava; curtir só pelas RPCs).
- **Denúncia**: `denuncias.motivo` limitado a 3000 caracteres (formulário público sem limite); o formulário limita a 1000.

## Conferido, sem problema
RPCs do feed/social: `security definer` com `search_path` fixo, checam `auth.uid()` e dono; `feed_projetos` não devolve WhatsApp, telefone nem dados do cliente; foto com pessoas só com consentimento; `seguidores` e `portfolio_salvos` só lidos pelo próprio usuário; rotas `/api/cron/*` exigem `CRON_SECRET`; rotas admin conferem `perfis_admin`; sem segredo no repositório (`.env*` no .gitignore).

## Pendências (decisão do dono)
1. **Leaked password protection** desligada no Supabase Auth (painel: Authentication → Passwords). Fazer no TEST e na produção.
2. **Funções `e2e_*`** (criar conta, resetar fixtures) são executáveis por `anon` no banco de TESTE. Têm trava de ambiente (`ambiente_teste_marcador`), mas confirmar que **não existem na produção** antes de qualquer migração.
3. **Foto por URL externa**: `portfolio_fotos.url_foto` aceita qualquer URL (rastreador de IP de quem vê o feed). Restringir ao Storage do projeto exige trocar as fotos do seed (`example.invalid`).
4. **Sem limite de ritmo** em curtir/seguir/salvar e na denúncia anônima (spam). Avaliar limite por usuário/IP.
5. **CSP** (Content-Security-Policy) ainda não existe; entrar primeiro em modo report-only.
6. Comparação do `CRON_SECRET` com `!==` (não é tempo-constante). Risco baixo; trocar por `timingSafeEqual` se quiser.
7. `alternar_curtida`/`alternar_salvo` aceitam qualquer trabalho em execução/finalizado, inclusive de perfil bloqueado. Baixo.
8. Descrição do trabalho é texto livre do prestador e pode conter telefone (não é dado do cliente, mas vai ao feed).

## Testes automatizados
- Unidade: `tests/seguranca/cabecalhos.test.ts`, `lib/feed/feed.test.ts` (slug), `lib/feed/denuncia.test.ts` (limites), `lib/instagram.test.ts`, `app/api/cron/*/route.test.ts`.
- E2E na API do TESTE: `tests/e2e/homologacao/seguranca-feed.spec.ts` (feed sem WhatsApp, tabelas sociais fechadas, escrita direta recusada, slug/Instagram/denúncia inválidos recusados) e `seguranca-acessos.spec.ts`.
- Dá para automatizar depois: auditor SQL no CI (`rls` ligada em toda tabela, `security definer` com `search_path`, nenhum `anon` em função de escrita) e `pnpm audit --prod` como etapa do CI.
