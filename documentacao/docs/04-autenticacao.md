# Autenticação e Autorização — PQF

## Provedores de autenticação

O PQF tem **dois métodos de login em paralelo**, ambos via Supabase Auth:

### 1. Google OAuth

Botão "Entrar com Google" (`GoogleButton`), fluxo padrão via `signInWithOAuth`.

### 2. Email/senha com auto-criação de conta

A tela de login (`app/login/page.tsx`) tem um formulário de email/senha abaixo do botão Google. O texto da UI ("Primeira vez? Sua conta será criada automaticamente") indica que **login e cadastro são a mesma ação** — não há uma tela de "criar conta" separada. Isso é tratado pelo hook `useLoginForm` (não detalhado aqui — ver `hooks/useLoginForm.ts` para a lógica exata de signIn vs signUp).

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

O sistema tem duas dimensões de papel, independentes:

### 1. Papel de produto: `cliente` vs `prestador`

Determinado **dinamicamente** — não é um campo salvo em `auth.users`, e sim inferido pela existência de um registro na tabela `prestadores` vinculado ao `user_id`:

```typescript
const { data } = await supabase
  .from('prestadores')
  .select('id, status')
  .eq('user_id', s.user.id)
  .maybeSingle()

role = data ? 'prestador' : 'cliente'
```

Qualquer usuário autenticado que não tenha um registro em `prestadores` é tratado como `cliente`. Um mesmo `user_id` não pode ter mais de um registro em `prestadores` (índice único em `user_id`).

### 2. Papel administrativo: `owner` / `moderator` / `editor`

Independente do papel de produto. Controlado pela tabela `perfis_admin`, vinculada a `auth.users` por `user_id`. Um usuário pode ser cliente **e** admin ao mesmo tempo — são checagens separadas.

## `useAuth` — hook central de sessão

Localizado em `hooks/useAuth.ts`. Responsabilidades:

- Expõe `session`, `role`, `prestadorStatus`, `roleLoading`, `loading`, `erroLogin`, `loginGoogle`
- **Cache otimista de sessão** em `localStorage` (`pqf_session_cache`) — evita flash de UI deslogada no primeiro render, checando expiração do token antes de usar o cache
- Ao detectar sessão (via `getSession()` ou `onAuthStateChange`), consulta `prestadores` para resolver `role` e `prestadorStatus` na mesma query
- Reage a `SIGNED_OUT` limpando `role`, `prestadorStatus` e o cache

**`prestadorStatus`** é usado para distinguir prestador com cadastro completo (`ativo`) de prestador com cadastro pendente (`pendente`) — controla se o botão "Meu Painel" no header leva para `/dashboard` ou `/cadastro`.

## Fluxo de login

```
Usuário clica em "Entrar com Google"
        ↓
loginGoogle() → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback?next=/painel/perfil' })
        ↓
Google OAuth → retorna para /auth/callback
        ↓
Sessão criada, cookies definidos
        ↓
onAuthStateChange dispara no client → useAuth resolve role
```

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

`middleware.ts` instancia seu próprio `createServerClient` inline (não reutiliza `lib/supabase/server.ts`), porque o middleware manipula cookies via `NextRequest`/`NextResponse`, um contrato diferente do usado em Server Components.

**Regra prática:**
- Em um `'use client'` component/hook → `import { supabase } from '@/lib/supabase'`
- Em um Server Component ou Route Handler → `import { createClient } from '@/lib/supabase/server'` e `await createClient()`
- Nunca importar `lib/supabase/client.ts` em código server-side, nem vice-versa

## Pontos de atenção conhecidos

- **RLS e sessão são a causa mais comum de "erro que não faz sentido".** Se um `update`/`insert` falha sem motivo aparente, checar primeiro se a sessão está presente (`supabase.auth.getSession()`) antes de suspeitar de lógica de negócio ou de dados.
- **`perfis` vs `profiles`** (tabelas de perfil complementar) — duplicação a resolver, ver [`03-banco-de-dados.md`](./03-banco-de-dados.md). Nenhuma das duas está diretamente ligada à autorização, mas afeta dados de perfil carregados após login.
- **Conversão `.js` → `.tsx` pendente:** a página de nova senha (`app/recuperar-senha`) ainda está em JavaScript puro, sem tipagem. Junto de outros arquivos `.js`/`.jsx` do projeto, é candidata à conversão gradual — ver `07-roadmap.md`.