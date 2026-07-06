# Procuro Quem Faça (PQF)

**Marketplace de prestadores de serviço para Londrina, PR.**

🔗 [procuroquemfaca.com.br](https://procuroquemfaca.com.br)

---

## O que é

O PQF conecta clientes que precisam de um serviço (elétrica, pintura, montagem, limpeza, etc.) a prestadores locais confiáveis em Londrina. O diferencial é a **confiança construída por avaliação real** — cada serviço concluído gera um registro fotográfico do antes/durante/depois, compartilhado com o cliente, que pode avaliar o trabalho ao final.

Com o tempo, isso forma uma base de prestadores com histórico verificável — não apenas "nota", mas evidência visual do trabalho entregue.

## Para quem é este documento

- **Devs contribuindo no projeto** → veja [`docs/02-arquitetura.md`](./docs/02-arquitetura.md)
- **Apresentação / visão de produto** → veja [`docs/01-visao-geral.md`](./docs/01-visao-geral.md)
- **Deploy e ambientes** → veja [`docs/06-deploy.md`](./docs/06-deploy.md)

## Stack

- **Framework:** Next.js (App Router)
- **Banco de dados / Auth:** Supabase (Postgres + RLS + Auth via Google OAuth)
- **Deploy:** Vercel
- **Estilo:** Tailwind CSS

## Estrutura da documentação

| Arquivo | Conteúdo |
|---|---|
| [`01-visao-geral.md`](./docs/01-visao-geral.md) | Problema, solução, público-alvo |
| [`02-arquitetura.md`](./docs/02-arquitetura.md) | Stack, estrutura de pastas, padrões de código |
| [`03-banco-de-dados.md`](./docs/03-banco-de-dados.md) | Tabelas, relações, políticas RLS |
| [`04-autenticacao.md`](./docs/04-autenticacao.md) | Fluxo de login, roles, `useAuth` |
| [`05-modulos.md`](./docs/05-modulos.md) | Prestadores, portfólio, busca, wizard de upload |
| [`06-deploy.md`](./docs/06-deploy.md) | Branches, Vercel, variáveis de ambiente |
| [`07-roadmap.md`](./docs/07-roadmap.md) | Funcionalidades planejadas |

## Início rápido (dev local)

```bash
git clone <repo-url>
cd procuro-quem-faca
npm install
cp .env.example .env.local  # preencher com credenciais do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Branches

- `main` → produção
- `laboratorio-anuncios` → ambiente de teste com dados/serviços reais (preview idêntico a produção)

---

*Documentação viva — atualizar conforme o produto evolui.*