# Autenticação e Autorização — PQF

## Provedores de autenticação

Dois métodos de login em paralelo, ambos via Supabase Auth:

### 1. Google OAuth

Botão "Entrar com Google" (`components/auth/GoogleButton.tsx`) — puramente apresentacional, delega a `hooks/useGoogleAuth.ts`, que aceita `roleDesejado` opcional e o embute como `?role=` na URL de callback (`app/auth/callback/route.ts`).

### 2. Email/senha com auto-criação de conta

`app/login/page.tsx` (tela "Área do Profissional") é puramente apresentacional; toda a lógica vive em `hooks/useLoginForm.ts`. O texto da UI ("Primeira vez? Sua conta será criada automaticamente") indica que login e cadastro são a mesma ação.

`handleLogin`: tenta `signInWithPassword`; se falhar com credenciais inválidas, tenta `signUp` — se a conta já existir, o Supabase revela isso via `identities: []` na resposta (sem gerar sessão nem sobrescrever senha), e a UI mostra "e-mail ou senha incorretos". Se for conta nova de fato, grava `role='prestador'` via `garantirRoleInicial` e resolve o destino via `resolverDestinoPosLogin`.

Se o destino calculado for `/cadastro`, `email`/`password` são salvos em `sessionStorage.pqf_prefill` antes de navegar, para que `useCadastroPrestador` já preencha os campos de acesso automaticamente.

### Recuperação de senha

1. **Solicitação** — `handleEsqueciSenha` (`useLoginForm.ts`): valida existência da conta via RPC `verificar_usuario_existe`, dispara `resetPasswordForEmail`.
2. **Definição de nova senha** — `app/recuperar-senha/page.tsx` + `hooks/useNovaSenha.ts` + `lib/services/recuperacaoSenha.service.ts`. Detecta o link via `access_token`/`type=recovery` no hash da URL ou sessão ativa (`PASSWORD_RECOVERY` event). Trata `error=access_denied` como link expirado. Após sucesso, usa `useLogout().logout({ origem: 'recuperacao_senha', redirectTo: '/login?msg=senha_alterada' })`.

Componentes de apoio: `components/auth/EyeIconButton.tsx` (toggle de visibilidade isolado), `components/auth/SenhaInput.tsx` (input + toggle embutido, usa `EyeIconButton` internamente), `components/auth/ForcaSenhaBar.tsx` (indicador visual de força, client-side, não bloqueia submissão).

## Papéis (roles)

Três dimensões independentes:

### 1. Papel de produto (derivado): `useAuth().role`

Determinado dinamicamente pela existência de um registro em `prestadores` vinculado ao `user_id`:
```typescript
role = data ? 'prestador' : 'cliente'
```
Um `user_id` não pode ter mais de um registro em `prestadores` (índice único). Usado por `HeaderBotoes` para navegação e por `useConfirmarExclusaoConta` para decidir o fluxo de exclusão.

### 2. Papel de onboarding (armazenado): `profiles.role`

Gravado automaticamente na criação de conta por `garantirRoleInicial` (`lib/services/auth.service.ts`), nunca perguntado ao usuário. Só grava se ainda não houver role — nunca sobrescreve.

**Detalhe de implementação relevante:** `garantirRoleInicial` checa `!profile?.role` (não `!profile`), protegendo contra o cenário de um trigger de banco já ter criado a linha em `profiles` com role nula. O upsert encadeia `.select('role')` na mesma requisição (evita depender de uma leitura separada logo após a escrita, que não tem garantia de ver o resultado a tempo) e usa o valor em memória como fallback.

### Consolidação entre as duas fontes

Historicamente havia uma divergência onde `useAuth().role` dependia exclusivamente da existência do registro em `prestadores`, enquanto `profiles.role` guardava a intenção do usuário no momento do login. Isso causava falhas de roteamento para cadastros interrompidos.

**Solução implementada:** 
O `useAuth` consolida o estado de sessão, `profiles.role` e `prestadores.status`. Ele executa um `Promise.all` buscando simultaneamente `profiles.role` e `prestadores.status`.
- Se `profiles.role` for `'prestador'`, mas a linha em `prestadores` não existir, o hook consolida: `role = 'prestador'` e `prestadorStatus = 'pendente'`.
- Para evitar *FOUC (Flash of Unstyled Content)* e transições bruscas na UI, esses dois valores sofrem **Cache Otimista** via `localStorage` (`pqf_auth_state`), permitindo que a interface (como o `HeaderAuthButton`) renderize o estado correto de forma síncrona, enquanto o banco revalida em background.

### 3. Papel administrativo: `owner`/`moderator`/`editor`

Independente das duas anteriores. Tabela `perfis_admin`, vinculada por `user_id`. Um usuário pode ser cliente/prestador **e** admin ao mesmo tempo.

## `useAuth` — hook central de sessão (client-side)

`hooks/useAuth.ts`. Expõe `session`, `role`, `prestadorStatus`, `roleLoading`, `loading`, `erroLogin`, `loginGoogle`, `sessionChecked`.

- **Cache otimista de sessão** em `localStorage` (`pqf_session_cache`) — evita flash de UI deslogada no primeiro render, checando expiração do token antes de usar.
- Ao detectar sessão, consulta `prestadores` para resolver `role`/`prestadorStatus` na mesma query.
- Reage a `SIGNED_OUT` limpando `role`, `prestadorStatus` e o cache.

**`prestadorStatus`** distingue prestador com cadastro completo (`ativo`) de pendente (`pendente`) — controla se "Meu Painel" leva a `/dashboard` ou `/cadastro`.

**`loading` vs `sessionChecked`:** `loading` é exclusivo do fluxo `loginGoogle()` (só `true` durante o clique no botão OAuth) — não indica se a checagem inicial de sessão terminou. `sessionChecked` vira `true` assim que a primeira resolução de `getSession()`/`onAuthStateChange` ocorre. Qualquer gate de acesso (redirecionar para `/login` na ausência de sessão) deve usar `sessionChecked`, não `loading`.

**`useSession()`** (`hooks/useSession.ts`) é uma versão mínima — só `session`, sem resolver role nem cache. Propositalmente mais leve para telas que só precisam saber "há sessão?".

## Fluxo completo de login e onboarding

Duas peças centrais usadas por todo ponto de entrada:

- **`lib/services/auth.service.ts`**: `getStatusOnboarding` (lê profile+prestador de usuário existente), `garantirRoleInicial`, `getPrestadorResumo`, `logoutCliente`
- **`lib/auth/resolverDestinoPosLogin.ts`**: `resolverDestinoPosLogin(profile, prestador) → string`, único ponto de decisão

```
Login via Google ──────┐
Login via e-mail/senha ─┼──→ conta pode ser nova ou existente
Sessão já ativa ────────┘
        ↓
Tem ?next= explícito? → redireciona direto, ignora lógica de role
        ↓ Não
Conta nova sendo criada agora?
        ├─ Sim → garantirRoleInicial(role da tela de origem) + getPrestadorResumo
        └─ Não → getStatusOnboarding
        ↓
resolverDestinoPosLogin(profile, prestador):
        ├─ role='prestador' E prestador completo (categoria_id + nome + status≠pendente) → /dashboard
        ├─ role='cliente' → /dashboard
        ├─ role='prestador' incompleto:
        │     ├─ origem_tipo='curadoria_publica' → /cadastro?reivindicar=<id>
        │     └─ senão → /cadastro
        └─ role ausente (residual) → /dashboard
```

`isPrestadorCompleto` usa o mesmo critério que `useAuth`/`HeaderBotoes` usam para decidir entre `/dashboard` e `/cadastro` no header — divergir reintroduziria inconsistência.

**Quem atribui `role` a uma conta nova:**

| Ponto de entrada | Role atribuída | Mecanismo |
|---|---|---|
| Botão "Área do cliente" (home) | — | Usa `?next=/painel/perfil` direto, ignora role |
| `GoogleButton` em `/login` | `prestador` | `useGoogleAuth` passa `?role=prestador` |
| `handleLogin`, fallback de `signUp` | `prestador` | `garantirRoleInicial` chamado após criar a conta |

Não existe tela perguntando "como você quer usar o PQF" — cada ponto de entrada já sabe a resposta pelo contexto.

### `app/auth/callback/route.ts`

Route Handler server-side. Instancia `createServerClient` inline (exceção documentada, ver seção de Clients abaixo), com `secure: !isDev`. Lê `?role=` — se presente, usa `garantirRoleInicial`; senão, `getStatusOnboarding`.

### `app/auth/link-expirado/page.tsx`

Tela de erro para link de recuperação expirado/usado/corrompido. Registra `LINK_RECUPERACAO_EXPIRADO` via `insertLog` (`lib/db/logs.ts`).

## Proteção de rotas — `middleware.ts`

Roda em todas as rotas exceto assets estáticos.

| Regra | Condição | Ação |
|---|---|---|
| **A — Áreas privadas** | Sem sessão e rota é `/dashboard` ou `/cadastro` | Redireciona para `/login` |
| **B — Evitar login duplicado** | Com sessão e rota é `/login` | Redireciona para `/dashboard` |
| **C — Área administrativa** | Rota começa com `/admin` | Ver abaixo |

### Regra A — Proteção de Áreas Privadas e Roteamento Inteligente (A.1)

O `middleware.ts` atua como o porteiro central da aplicação. Para as rotas `/dashboard` e `/cadastro`, ele valida não apenas a sessão, mas a intenção (`profiles.role`) e o status real (`prestadores.status`) do usuário:

- **Prestador Pendente/Incompleto:** Se tentar acessar o `/dashboard`, é interceptado e redirecionado para `/cadastro`.
- **Prestador Ativo/Completo:** Se tentar acessar o `/cadastro`, é redirecionado para o `/dashboard` (a menos que explicitamente acesse telas de edição permitidas).
- **Cliente:** Se um cliente tentar acessar o `/dashboard` (que é exclusivo para prestadores), é redirecionado para a sua área correta em `/painel/perfil`. Se tentar acessar `/cadastro`, a passagem é permitida (assumindo a intenção de se tornar um profissional).


### Regra C — Proteção de `/admin`

```
Sem sessão? → redireciona para /
Com sessão → consulta perfis_admin (user_id = auth.uid())
Sem registro? → redireciona para /
Com registro → segue normalmente
```

Redirecionamento silencioso para a home (não `/login` nem 404) — evita revelar que `/admin` existe.

**Dependência crítica de RLS:** requer policy `SELECT` em `perfis_admin` permitindo o usuário ler sua própria linha. Sem essa policy, até admins legítimos seriam bloqueados. Validar com conta admin real após qualquer mudança nessa policy.

O middleware só verifica *existência* de registro em `perfis_admin`, não o valor de `role` — diferenciação `owner`/`moderator`/`editor` fica nas páginas/actions do admin.

## Clients Supabase — por contexto

```
lib/
├── supabase.ts             ← re-export de compatibilidade
└── supabase/
    ├── client.ts            ← browser (client components) — createBrowserClient
    └── server.ts            ← server components / route handlers — createServerClient + cookies()
```

**Regra prática:**
- `'use client'` component/hook → `import { supabase } from '@/lib/supabase'`
- Server Component/Route Handler → `import { createClient } from '@/lib/supabase/server'` + `await createClient()`
- Exceções conhecidas: `middleware.ts` e `app/auth/callback/route.ts` instanciam `createServerClient` inline — necessidades de cookie (`NextRequest`/`NextResponse` no middleware; `cookies()` com `secure` customizado no callback) específicas demais para o helper genérico.

`app/api/delete-account/route.ts` segue o padrão comum (`lib/supabase/server.ts`) para identificar o usuário logado, mais um client admin (service role) só para `supabaseAdmin.auth.admin.deleteUser`.

## Exclusão de conta

**Fluxo único:** `app/confirmar-exclusao/page.tsx` + `hooks/useConfirmarExclusaoConta.ts`, servindo cliente e prestador.

- Usa `useAuth()` (`session`, `role`, `sessionChecked`) para decidir o caminho
- `role === 'prestador'` → `buscarPrestadorPorUserId` (`cadastroPrestador.service.ts`) + `removerFotoPrestador`/`deletarPrestadorPorUserId` (`lib/services/exclusaoConta.service.ts`)
- `role === 'cliente'` → `ClienteService.fetchClienteProfile` (obtém whatsapp real para anonimização) + `ClienteService.deleteClienteAccount`
- Ambos: `insertLog('EXCLUSAO_CONTA_VOLUNTARIA')` → `POST /api/delete-account` → `signOut()`
- Confirmação por texto ("digite EXCLUIR")

**Exceção não migrada:** `components/dashboard/EditarPerfilTab.tsx` mantém `handleExcluirContaTotal` própria (funcionalmente equivalente: remove foto, deleta `prestadores`, chama `/api/delete-account`, `signOut`), sem redirecionar para `/confirmar-exclusao`. Registrado no roadmap.

## Pontos de atenção conhecidos

- **RLS e sessão são a causa mais comum de "erro que não faz sentido".** Checar `supabase.auth.getSession()` antes de suspeitar de lógica de negócio.
- **`perfis` (legado) vs `profiles` (ativa)** — ver `03-banco-de-dados.md`.
- **`useAuth().role` vs `profiles.role`** — a resolução de sessão consolida as duas fontes com `prestadores.status`; `profiles.role` preserva a intenção de onboarding e `prestadores` representa o registro profissional real.
- **`sessionChecked` deve ser preferido a `loading`** por qualquer consumidor de `useAuth` que precise de gate de sessão.
- Arquivos `.js`/`.jsx` remanescentes sem tipagem: ver `13-roadmap.md`.
