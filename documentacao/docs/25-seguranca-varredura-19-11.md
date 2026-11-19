# Varredura de segurança — 19/11/2026 (feed, social, Instagram)

## Corrigido (commitado, aguardando push)
- **Next.js 16.3.3 → 16.4.6** (crítico: RCE sem login no otimizador de imagens com SVG, DoS em Server Actions, vazamento de cache). `pnpm audit --prod`: sem vulnerabilidades. O `package-lock.json` (npm) ainda acusa `sharp` e `dompurify`: o repo tem os dois lockfiles; confirmar qual a Vercel usa (pnpm tem prioridade) e apagar o que sobrar.
- **Cabeçalhos de segurança** em `next.config.ts`: nosniff, X-Frame-Options DENY, Referrer-Policy, HSTS, Permissions-Policy. Teste: `tests/seguranca/cabecalhos.test.ts`.
- **Slug do prestador** (`prestadores_slug_formato`, migração `20261119200000`): só `[a-z0-9_-]`. Antes, um slug `/site.com` virava o link `//site.com` (fora do PQF) no feed. Defesa extra no app: `enderecoDoPerfil()` em `lib/feed/feed.ts`.
- **`portfolio_curtidas`**: privilégios de tabela revogados (a RLS já negava; curtir só pelas RPCs).
- **Denúncia**: `denuncias.motivo` limitado a 3000 caracteres (formulário público sem limite); o formulário limita a 1000.

## Conferido, sem problema
RPCs do feed/social: `security definer` com `search_path` fixo, checam `auth.uid()` e dono; `feed_projetos` não devolve WhatsApp, telefone nem dados do cliente; foto com pessoas só com consentimento; `seguidores` e `portfolio_salvos` só lidos pelo próprio usuário; rotas `/api/cron/*` exigem `CRON_SECRET`; rotas admin conferem `perfis_admin`; sem segredo no repositório (`.env*` no .gitignore).

## Segunda leva (19/11 tarde) — padrão de grandes empresas
Migração `20261119210000_seguranca_ritmo_e_fotos` (depois de `20261119200000`), aplicada e validada no TESTE:
- **Foto só do Storage:** `portfolio_fotos.url_foto` precisa ser URL pública do bucket `portfolios` (`portfolio_fotos_url_storage`). Impede rastreador de IP em quem vê o feed. As fotos de teste (seed) foram trocadas de `example.invalid` para o caminho do Storage (na tabela e na base `e2e_baseline`). Na produção a migração falha inteira se houver foto fora disso.
- **Limite de ritmo por pessoa** (`checar_ritmo`, tabela `acoes_ritmo`, só o banco acessa): curtir e salvar 60/min, seguir e ocultar 30/min; estourou devolve `muito_rapido` ("Calma! Muitas ações em pouco tempo…"). Linhas com mais de 1 hora são apagadas na própria chamada; apagar a conta apaga as linhas (cascata).
- **Denúncia pública com teto:** no máximo 10 denúncias abertas por perfil por hora e 60 no total por minuto (função `denuncia_dentro_do_limite`, chamada pela política de INSERT).
- **CSP em duas camadas** (`next.config.ts`): enforçada só `object-src 'none'; base-uri 'self'; frame-ancestors 'none'`; a política completa de origens (Supabase, Google, Vercel) está em **modo relatório** (`Content-Security-Policy-Report-Only`), com relatórios em `/api/csp-report` (logs da Vercel, prefixo `[csp-report]`). Próximo passo: olhar os relatórios por alguns dias, ajustar origens e então enforçar; depois trocar `'unsafe-inline'` por nonce.
- **Limite por IP no firewall da Vercel** (rotas `/api/*` públicas: titular, denúncia, CNPJ): ainda NÃO configurado; é mudança de produção, só com o "de acordo". O Supabase não passa pela Vercel, por isso a denúncia direta usa o teto do banco.

## Pendências (decisão do dono)
1. **Leaked password protection** do Supabase Auth: recurso de plano pago; plano free não tem. Bloqueada, sem ação.
2. **Funções `e2e_*`** são executáveis por `anon` só no banco de TESTE (travadas pelo marcador do ambiente). Conferir que **não existem na produção** antes de qualquer migração.
3. Comparação do `CRON_SECRET` com `!==` (não tempo-constante). Risco baixo.
4. `alternar_curtida`/`alternar_salvo` aceitam qualquer trabalho em execução/finalizado, inclusive de perfil bloqueado. Baixo.
5. Descrição do trabalho é texto livre do prestador e pode conter telefone (não é dado do cliente, mas vai ao feed).

## Testes automatizados
- Unidade: `tests/seguranca/cabecalhos.test.ts`, `lib/feed/feed.test.ts` (slug), `lib/feed/denuncia.test.ts` (limites), `lib/instagram.test.ts`, `app/api/cron/*/route.test.ts`.
- E2E na API do TESTE: `tests/e2e/homologacao/seguranca-feed.spec.ts` (feed sem WhatsApp, tabelas sociais fechadas, escrita direta recusada, slug/Instagram/denúncia inválidos recusados) e `seguranca-acessos.spec.ts`.
- **Auditor do banco** (`tests/e2e/homologacao/auditoria-banco.spec.ts`, função `e2e_auditar_seguranca()` em `supabase/homologacao/auditoria_seguranca.sql`, só no TESTE): falha se aparecer tabela sem RLS, função `security definer` sem `search_path`, função nova aberta a visitante ou gravação nova aberta a visitante. As listas aprovadas ficam no próprio teste: mudança proposital = incluir o nome no mesmo commit.
- **`pnpm audit --prod --audit-level=high`** como passo do CI (`.github/workflows/ci.yml`): falha com vulnerabilidade alta/crítica em dependência de produção.
