# Autenticação e Autorização — PQF

## Provedores de autenticação

O PQF tem **dois métodos de login em paralelo**, ambos via Supabase Auth:

### 1. Google OAuth

Botão "Entrar com Google" (`GoogleButton`), fluxo padrão via `signInWithOAuth`.

### 2. Email/senha com auto-criação de conta

A tela de login (`app/login/page.tsx`) tem um formulário de email/senha abaixo do botão Google. O texto da UI ("Primeira vez? Sua conta será criada automaticamente") indica que **login e cadastro são a mesma ação** — não há uma tela de "criar conta" separada. Isso é tratado pelo hook `useLoginForm`.

### Recuperação de senha

Fluxo de duas partes:
1. **Solicitação** — botão "Redefinir senha" na tela de login (`handleEsqueciSenha`, em `useLoginForm`), que dispara o email de recovery do Supabase
2. **Nova senha** — página em `app/recuperar-senha` (arquivo `NovaSenha`, atualmente `.js` — candidato à conversão para `.tsx`, ver observação abaixo)

**Detalhes técnicos da página de nova senha:**
- Detecta o link de recovery via `access_token`/`type=recovery` no hash da URL, ou sessão já ativa (`PASSWORD_RECOVERY` event do `onAuthStateChange`)
- Trata `error=access_denied` na URL como link expirado/já usado
- Após sucesso: faz `signOut()` explícito e redireciona para `/login?msg=senha_alterada` — força novo login com a senha nova em vez de manter a sessão de recovery ativa
- Registra tentativa de acesso em `logs_atividades` com `entidade_tipo: 'recuperacao_senha'`
- Tem validação de força de senha (fraca/boa/forte) puramente client-side, sem bloquear submissão — só orienta o usuário

> ⚠️ **Este arquivo mistura duas responsabilidades no nome:** a rota é `recuperar-senha` mas o componente exportado é `NovaSenha` — nomenclatura vale revisar (o arquivo é especificamente a etapa de "definir a nova senha", não a solicitação inicial).

## Papéis (roles)

O sistema tem **três** dimensões de papel.

### 1. Papel de produto (derivado): `cliente` vs `prestador` — usado por `useAuth`

Determinado **dinamicamente** — não é um campo salvo em `auth.users`, e sim inferido pela existência de um registro na tabela `prestadores` vinculado ao `user_id`:

```typescript
const { data } = await supabase
  .from('prestadores')
  .select('id, status')
  .eq('user_id', s.user.id)
  .maybeSingle()

role = data ? 'prestador' : 'cliente'
```

Qualquer usuário autenticado que não tenha um registro em `prestadores` é tratado como `cliente`. Um mesmo `user_id` não pode ter mais de um registro em `prestadores` (índice único em `user_id`). Usado principalmente pelo `HeaderBotoes` para decidir o que mostrar na navegação.

### 2. Papel de onboarding (armazenado): `profiles.role`

Campo explícito, gravado na tabela `profiles` **automaticamente**, no momento em que uma conta nova é criada, por `garantirRoleInicial` (`lib/services/auth.service.ts`) — nunca perguntado diretamente ao usuário. A tela do PQF que a pessoa está usando no momento do cadastro já entrega essa informação implicitamente:

```typescript
await supabase.from('profiles').upsert({ id: userId, role: roleDesejado, updated_at: new Date() })
```

`garantirRoleInicial` só grava se ainda não houver `role` — nunca sobrescreve uma escolha já feita.

### ⚠️ Tensão arquitetural entre as duas fontes de papel (ainda existe, escopo reduzido)

`useAuth().role` (derivado) e `profiles.role` (armazenado) ainda **podem divergir momentaneamente**: uma conta recém-criada tem `profiles.role: 'prestador'` de imediato, mas `useAuth().role` só passa a refletir isso quando o cadastro em `/cadastro` é de fato concluído e um registro em `prestadores` é criado. Esse intervalo é curto (só durante o próprio fluxo de cadastro) e não tem mais o problema maior que existia antes — decisão de destino pós-login — que já foi resolvido (ver abaixo).

Continua registrado no roadmap como possível simplificação futura: unificar as duas fontes exigiria migrar `useAuth`, um trabalho maior e fora de escopo desta consolidação.

### 3. Papel administrativo: `owner` / `moderator` / `editor`

Independente dos dois anteriores. Controlado pela tabela `perfis_admin`, vinculada a `auth.users` por `user_id`. Um usuário pode ser cliente **e** admin ao mesmo tempo — são checagens separadas. Detalhado na seção de Proteção de `/admin` abaixo.

## `useAuth` — hook central de sessão (client-side)

Localizado em `hooks/useAuth.ts`. Responsabilidades:

- Expõe `session`, `role`, `prestadorStatus`, `roleLoading`, `loading`, `erroLogin`, `loginGoogle`
- **Cache otimista de sessão** em `localStorage` (`pqf_session_cache`) — evita flash de UI deslogada no primeiro render, checando expiração do token antes de usar o cache
- Ao detectar sessão (via `getSession()` ou `onAuthStateChange`), consulta `prestadores` para resolver `role` e `prestadorStatus` na mesma query
- Reage a `SIGNED_OUT` limpando `role`, `prestadorStatus` e o cache

**`prestadorStatus`** é usado para distinguir prestador com cadastro completo (`ativo`) de prestador com cadastro pendente (`pendente`) — controla se o botão "Meu Painel" no header leva para `/dashboard` ou `/cadastro`.

## Fluxo completo de login e onboarding

Consolidado em torno de duas peças centrais, usadas por todo ponto de entrada que pode autenticar ou criar uma conta:

- **`lib/services/auth.service.ts`** — única camada de I/O: `getStatusOnboarding` (lê `profile` + `prestador` de um usuário existente), `garantirRoleInicial` (grava `role` só se ainda não houver, retornando o valor confirmado na mesma requisição — evita depender de uma leitura separada logo após a escrita), `getPrestadorResumo` (busca só o prestador), `logoutCliente` (signOut genérico, usado por `useHeaderCliente`)
- **`lib/auth/resolverDestinoPosLogin.ts`** — única função pura de decisão: `resolverDestinoPosLogin(profile, prestador) → string`

```
Login via Google ──────┐
Login via e-mail/senha ─┼──→ conta pode ser nova ou existente
Sessão já ativa ────────┘
        ↓
Tem ?next= explícito? (ex: botão "Área do Cliente" da home)
        ├─ Sim → redireciona direto pra lá, ignora toda lógica de role
        ↓ Não
Conta nova sendo criada agora?
        ├─ Sim → garantirRoleInicial(role da tela de origem) + getPrestadorResumo
        └─ Não → getStatusOnboarding (lê profile + prestador existentes)
        ↓
resolverDestinoPosLogin(profile, prestador):
        ├─ role='prestador' E cadastro completo (categoria_id + nome + status≠pendente) → /dashboard
        ├─ role='cliente' → /dashboard
        ├─ role='prestador' mas cadastro incompleto:
        │     ├─ origem_tipo='curadoria_publica' → /cadastro?reivindicar=<id>
        │     └─ senão → /cadastro
        └─ role ausente (caso residual, ver nota no arquivo) → /dashboard
```

**Quem atribui `role` a uma conta nova, e quando:**

| Ponto de entrada | Role atribuída | Mecanismo |
|---|---|---|
| Botão "Área do cliente" (home) | — | Nem passa pela lógica de role; usa `?next=/painel/perfil` direto |
| `GoogleButton` na tela `/login` ("Área do Profissional") | `prestador` | `useGoogleAuth` passa `?role=prestador` na URL de callback |
| `handleLogin` em `/login`, fallback de `signUp` | `prestador` | `garantirRoleInicial` chamado direto após criar a conta |

Não existe mais uma tela perguntando "como você quer usar o PQF" — cada ponto de entrada já sabe a resposta pelo contexto em que está.

### `app/auth/callback/route.ts` — Route Handler do OAuth

Server-side (Route Handler, não client component) — usa `createServerClient` com cookies via `next/headers`, definindo `secure: !isDev` explicitamente (cookies não-seguros permitidos em desenvolvimento local sem HTTPS).

Lê `?role=` da URL (setado por `useGoogleAuth` quando aplicável) — se presente, usa `garantirRoleInicial` (evita re-leitura separada); senão, usa `getStatusOnboarding` para uma conta já existente.

### `hooks/useGoogleAuth.ts` — lógica de OAuth extraída do `GoogleButton`

`GoogleButton.tsx` hoje é puramente apresentacional — a chamada a `signInWithOAuth` mora neste hook, que aceita um `roleDesejado` opcional e o embute como `?role=` na URL de callback. A tela `/login` ("Área do Profissional") passa `roleDesejado="prestador"`.

### `app/auth/link-expirado/page.js` — Link de recuperação inválido

Tela de erro dedicada para quando um link de recuperação de senha (ver `NovaSenha` acima, seção de Recuperação) chega expirado, já usado, ou com token corrompido. Registra um log de segurança (`LINK_RECUPERACAO_EXPIRADO`, `entidade_tipo: 'seguranca'`) com URL da tentativa e user agent, antes de oferecer botão único para reiniciar o processo em `/login`.

> Nota de conversão: ainda `.js`, candidato à lista de conversão para `.tsx` no roadmap.

## Proteção de rotas — `middleware.ts`

O middleware roda em **todas as rotas** exceto assets estáticos (ver `matcher`), e aplica três regras antes de qualquer página renderizar:

| Regra | Condição | Ação |
|---|---|---|
| **A — Áreas privadas** | Sem sessão e rota é `/dashboard` ou `/cadastro` | Redireciona para `/login` |
| **B — Evitar login duplicado** | Com sessão e rota é `/login` | Redireciona para `/dashboard` |
| **C — Área administrativa** | Rota começa com `/admin` | Ver detalhamento abaixo |

### Regra C — Proteção de `/admin`

```
Rota /admin/*
      ↓
Sem sessão? → redireciona para /
      ↓
Com sessão → consulta perfis_admin (user_id = auth.uid())
      ↓
Sem registro em perfis_admin? → redireciona para /
      ↓
Com registro → segue normalmente
```

**Decisão de design:** redirecionamento silencioso para a home (`/`), não para `/login` nem um 404 customizado — evita revelar que a rota `/admin` existe para quem não tem acesso, sem forçar fluxo de login desnecessário para quem já está autenticado como cliente/prestador comum.

**Dependência crítica de RLS:** essa checagem só funciona se `perfis_admin` tiver uma policy de `SELECT` permitindo que o usuário leia sua própria linha:

```sql
CREATE POLICY "admin_pode_ler_propria_linha"
ON perfis_admin
FOR SELECT
USING (user_id = auth.uid());
```

Sem essa policy, o RLS bloqueia por padrão e **até administradores legítimos seriam redirecionados para fora** — um erro aqui quebra acesso em vez de só bloquear intrusos. Sempre validar com uma conta admin real após qualquer mudança nessa policy.

**Nível de acesso por `role` dentro do admin:** o middleware hoje só verifica *existência* de registro em `perfis_admin`, não o valor de `role`. Diferenciação entre `owner`/`moderator`/`editor` (ex: só `owner` pode deletar) deve ser feita dentro das páginas/actions do admin, não no middleware.

## Clients Supabase — por contexto

O projeto usa três formas de instanciar o client Supabase, cada uma para um contexto de execução diferente:

```
lib/
├── supabase.ts             ← re-export de compatibilidade (não editar diretamente)
└── supabase/
    ├── client.ts            ← browser (client components) — createBrowserClient
    └── server.ts            ← server components / route handlers — createServerClient + cookies()
```

`middleware.ts` e `app/auth/callback/route.ts` instanciam cada um seu próprio `createServerClient` inline (não reutilizam `lib/supabase/server.ts`) — ambos manipulam cookies em contratos específicos (`NextRequest`/`NextResponse` no middleware; `cookies()` de `next/headers` com opções customizadas de `secure` no callback) que não se encaixam exatamente no helper genérico de Server Component.

**Regra prática:**
- Em um `'use client'` component/hook → `import { supabase } from '@/lib/supabase'`
- Em um Server Component ou Route Handler → `import { createClient } from '@/lib/supabase/server'` e `await createClient()`
- Nunca importar `lib/supabase/client.ts` em código server-side, nem vice-versa
- Exceções conhecidas e aceitáveis: `middleware.ts` e `auth/callback/route.ts`, que têm necessidades de cookie específicas demais para o helper genérico

## Pontos de atenção conhecidos

- **RLS e sessão são a causa mais comum de "erro que não faz sentido".** Se um `update`/`insert` falha sem motivo aparente, checar primeiro se a sessão está presente (`supabase.auth.getSession()`) antes de suspeitar de lógica de negócio ou de dados.
- **`perfis` vs `profiles` — resolvido: `profiles` é a tabela ativa.** Confirmado ao revisar o fluxo de onboarding: `profiles.role` é usado ativamente em `auth/callback` e `useLoginForm`. `perfis` (sem "o" — nome em português) não apareceu em nenhum fluxo revisado até agora e é forte candidata a tabela legada. Ver ação recomendada em `03-banco-de-dados.md`.
- **Conversão `.js` → `.tsx` pendente:** `app/recuperar-senha` (`NovaSenha`) e `app/auth/link-expirado/page.js` ainda em JavaScript puro, sem tipagem. Candidatas à conversão gradual — ver `07-roadmap.md`.
- **Tensão `useAuth().role` vs `profiles.role`** — ver seção de Papéis acima. Não resolvida de raiz; apenas o ponto de maior risco (destino pós-login) foi consolidado.
- **Exclusão de conta agora é simétrica entre cliente e prestador** — ambos os fluxos chamam `/api/delete-account` (remoção real de `auth.users` via service role) além de limpar dados de domínio. Ver `05-modulos.md`, seção Painel do Cliente / Dashboard do Prestador.