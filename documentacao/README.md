# Procuro Quem Faça (PQF)

Marketplace de prestadores de serviço para Londrina, PR.

O PQF conecta clientes a profissionais locais e constrói confiança com portfólios fotográficos, acompanhamento do serviço e avaliações vinculadas a projetos reais.

## Documentação

| Documento | Conteúdo |
|---|---|
| [00 — Glossário](./docs/00-glossario.md) | Conceitos e pontos de entrada no código |
| [01 — Visão geral](./docs/01-visao-geral.md) | Problema, solução e público |
| [02 — Arquitetura](./docs/02-arquitetura.md) | Stack, estrutura e padrões |
| [03 — Banco de dados](./docs/03-banco-de-dados.md) | Modelo Supabase/Postgres e RLS |
| [04 — Autenticação](./docs/04-autenticacao.md) | Login, onboarding e proteção de rotas |
| [05–10](./docs/05-cadastro-prestador.md) | Cadastro, dashboards, portfólio, avaliação e busca |
| [11 — Anúncios](./docs/11-anuncios.md) | MVP de anúncios administrados |
| [12 — Admin](./docs/12-admin.md) | Área administrativa e permissões |
| [13 — Roadmap](./docs/13-roadmap.md) | Próximas evoluções |

## Stack atual

- Next.js 15.5.12 com App Router e TypeScript
- React 19, Tailwind CSS 4 e componentes próprios
- Supabase: Postgres, Auth, Storage, RLS e Realtime
- Vitest, Testing Library e Playwright
- PostHog, Vercel Analytics e Speed Insights
- Deploy na Vercel

## Início rápido

```bash
git clone <repo-url>
cd procuro-quem-faca
npm install
# configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Comandos disponíveis:

```bash
npm run dev       # desenvolvimento
npm run build     # build de produção
npm run lint      # ESLint
npm run test:run  # testes unitários
```

Abra [http://localhost:3000](http://localhost:3000).

> A documentação é mantida em português e deve refletir o código ativo, distinguindo funcionalidades implementadas de itens planejados.

## Links

- Site: [procuroquemfaca.com.br](https://procuroquemfaca.com.br)
- Deploy: consulte as configurações da Vercel do projeto e o arquivo `package.json`.

---

Última revisão: setembro de 2026.
