# Cadastro de Prestador — PQF

Complementa `02-arquitetura.md`. Para localizar um conceito específico (ex: "avatar", "WhatsApp", "status de projeto") em todos os módulos que o tocam, ver `00-glossario.md`.

**Rota:** `app/cadastro/page.tsx` (JSX puro) + `hooks/useCadastroPrestador.ts` + `lib/services/cadastroPrestador.service.ts`

Um único formulário multiuso cobrindo três cenários, decididos em tempo de execução:

1. **Cadastro novo** — sem sessão e sem registro em `prestadores`
2. **Edição de perfil existente** (`modoEdicao`) — logado com registro próprio
3. **Reivindicação de perfil** (`?reivindicar=<id>`) — assume perfil de curadoria pública sem `user_id`

**Hooks orquestrados:** `usePrestadorForm` (estado do form), `useCategorias`, `useLocalizacao`, `useSlugCheck` (debounce 500ms via `verificarSlugDisponivel`).

**Subcomponentes de seção** (`components/perfil/`), reaproveitados no Cadastro e na Edição (dashboard): `FotoUpload`, `SecaoDadosPessoais`, `SecaoOQueVoceFaz`, `SecaoLocalizacao`, `SecaoTermos` (com links reais para `/termos`/`/privacidade`).

**Fluxo de inicialização** (roda uma vez via `inicializadoRef`):
```
Verifica sessão → tem prestador ativo (não pendente, não curadoria)? → /dashboard
Carrega listas base (grupos, habilidades, estados) em paralelo
Tem ?reivindicar=<id>?
  ├─ Sim → busca prestador específico; já reivindicado por outro → modal; sem user_id → carrega no form
  ↓ Não
Tem prestador próprio? → carrega no form, modoEdicao=true
  ↓ Não → pré-preenche nome do Google, região padrão PR


**Tratamento de Cadastros Interrompidos (`isPendente`)**
O formulário possui uma trava estrita de segurança alimentada pelo `prestadorStatus` global (via `useAuth`). 
Mesmo que o usuário já possua uma sessão válida e caia no fluxo que o hook de cadastro interpreta como "Edição" (`modoEdicao = true`), se o status global for `'pendente'`, o sistema força o comportamento de "Novo Cadastro":
1. Exige compulsoriamente a marcação e o aceite visual das checkboxes de **Termos de Uso** e **Política de Privacidade**.
2. Altera o texto do botão de submissão de "Salvar Alterações" para "Finalizar Cadastro", reduzindo a ambiguidade na UX.


**Autenticação embutida no formulário:** diferente de `/login`, o cadastro de conta acontece no mesmo formulário (`SecaoAcessoCadastro`/`SecaoAcessoLogado`, ambos usando `components/auth/SenhaInput.tsx`). É um segundo ponto de criação de conta, além de `/login`.

**Submit:** valida → `criarContaEmail`/`loginEmail` (se sem sessão) → `atualizarSenha` (se logado trocando) → limpa cidades duplicadas da sede → `deletarOutrosPrestadoresDoUsuario` (se reivindicando) → `upsertPrestador` → `loginEmail` (garante sessão) → `window.location.href = '/dashboard'` (hard redirect, força `useAuth` reprocessar do zero).

**Exclusão de perfil** (distinta de exclusão de conta completa): `handleExcluirPerfil` → `deletarPrestador`, cascata via FK.

**Pendência de tipagem:** `PrestadorRow` (tipo estendido local) cobre a ausência de `user_id` em `PrestadorFormData` — ver `03-banco-de-dados.md`.

**Prefill de credenciais:** `sessionStorage.pqf_prefill` é gravado por `useLoginForm.ts` sempre que o destino pós-login é `/cadastro`, e lido/removido aqui no estado inicial de `email`/`senha`.
