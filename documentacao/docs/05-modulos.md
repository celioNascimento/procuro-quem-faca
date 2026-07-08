# Módulos — PQF

Este documento cobre os módulos de produto em detalhe, complementando a visão de arquitetura em [`02-arquitetura.md`](./02-arquitetura.md).

---

## Cadastro de Prestador

**Rota:** `app/cadastro/page.tsx`
**Componente:** `CadastroPage` → `FormularioCadastro` (envolvido em `Suspense` por usar `useSearchParams`)

### O que essa tela faz

Um único formulário multiuso que cobre **três cenários diferentes**, decididos em tempo de execução:

1. **Cadastro novo** — usuário sem sessão e sem registro em `prestadores`
2. **Edição de perfil existente** (`modoEdicao`) — usuário já logado com um registro próprio em `prestadores`
3. **Reivindicação de perfil** (`?reivindicar=<id>`) — usuário assume um perfil criado por curadoria pública (`origem_tipo: 'curadoria_publica'`) que ainda não tem `user_id`

### Hooks orquestrados

| Hook | Responsabilidade |
|---|---|
| `usePrestadorForm` | Estado do formulário (`formData`), handlers de campo (`handleNomeChange`, `handleWhatsappChange`, etc.), `toggleItem` para arrays (habilidades, cidades atendidas) |
| `useCategorias` | Carrega grupos, categorias e habilidades disponíveis |
| `useLocalizacao` | Carrega estados, regiões e cidades em cascata |
| `useSlugCheck` | Verifica disponibilidade do slug em tempo real conforme o usuário digita |

### Fluxo de inicialização (`useEffect` com `inicializadoRef` para rodar uma única vez)

```
Verifica sessão atual
      ↓
Tem user + já tem prestador ativo (não pendente, não curadoria)?
      → Sim: redireciona para /dashboard (bloqueia cadastro duplicado)
      ↓ Não
Carrega listas base (grupos, habilidades, estados) em paralelo
      ↓
Tem ?reivindicar=<id>?
      ├─ Sim → busca esse prestador específico
      │         ├─ já tem user_id igual ao logado? → vai pra /dashboard
      │         ├─ já tem user_id de outra pessoa? → modal "Perfil Indisponível"
      │         └─ sem user_id → carrega dados no form, pré-aceita termos, modoEdicao=false
      ↓ Não
Tem prestador próprio (perfilExistente)?
      → Sim: carrega no form, modoEdicao=true
      → Não: pré-preenche nome com dado do Google (user_metadata.full_name), região padrão PR
```

### Autenticação embutida no formulário

Diferente da tela `/login`, aqui o cadastro de conta **acontece dentro do mesmo formulário** de dados profissionais — não há redirecionamento para outra tela:

- Usuário não logado → campos de email/senha aparecem inline (`SecaoAcessoCadastro`)
- Usuário já logado → mostra dados da sessão + opção de trocar senha (`SecaoAcessoLogado`)

No submit, se não há sessão:
```typescript
supabase.auth.signUp({ email, password: senha, ... })
```
Se o email já existe (`already registered`), tenta login automático com a senha informada em vez de mostrar erro — só falha de verdade se a senha estiver incorreta, caso em que mostra modal orientando ir para `/login`.

> 💡 **Isso é um segundo ponto de criação de conta**, além da tela `/login` documentada em [`04-autenticacao.md`](./04-autenticacao.md). Vale adicionar uma nota lá cruzando essa informação: existem dois lugares onde uma conta nova pode ser criada (login direto, ou auto-cadastro dentro do formulário de prestador).

### Validação e progresso

`calcularProgresso()` roda a cada render, verificando 9 condições (nome, whatsapp, categoria, cidade, foto, termos, privacidade, slug disponível, senha válida se aplicável) e retorna uma porcentagem — usada tanto na barra de progresso do header quanto para habilitar/desabilitar o botão de submit (exige 100%).

**Campos obrigatórios:**
- Nome (>3 caracteres)
- WhatsApp (≥10 dígitos)
- Grupo, categoria e cidade selecionados
- Foto de perfil (upload via `fazerUploadFoto`, limite de 10MB)
- Aceite de termos e privacidade (checkboxes separados)
- Slug disponível
- Senha válida (só se estiver criando conta ou trocando senha)

### Upload de foto

`fazerUploadFoto(file, userId, fotoAntigaUrl?)` — função em `lib/uploadFoto.ts` (não detalhada aqui). Trata erro de arquivo grande (`TOO_LARGE`) com modal específico mostrando o tamanho real do arquivo.

### Submit — o que acontece na ordem

```
1. Validações finais (foto obrigatória, slug disponível, senhas conferem)
2. Se sem sessão → signUp (ou signIn se já existir o email)
3. Se logado e trocando senha → updateUser({ password })
4. Limpa nome de cidades_atendidas duplicando a cidade-sede
5. Se reivindicando → deleta qualquer outro registro de prestador do mesmo user_id
   (evita um usuário ficar com 2 prestadores — reforça a constraint de índice único)
6. upsert em `prestadores` com status: 'ativo', origem_tipo calculado
7. Se não estava logado → signInWithPassword (garante sessão ativa)
8. Redireciona para /dashboard (hard redirect via window.location.href, não router.push)
```

**Nota técnica:** o uso de `window.location.href` em vez de `router.push` no redirecionamento final é provavelmente proposital — força reload completo da aplicação, garantindo que o `useAuth` reprocesse a sessão do zero (evita estado de `role` desatualizado logo após criar o prestador).

### Exclusão de perfil

Botão de excluir (dentro de `CadastroCard`, visível em modo edição/reivindicação) abre `ModalConfirmacao` → `handleExcluirPerfil` deleta o registro de `prestadores` diretamente (cascata via FK cuida de fotos/projetos/avaliações vinculados, conforme `on delete CASCADE` documentado em `03-banco-de-dados.md`).

### Pontos de atenção

- **Tipagem `as any`** em `form.set({ nome: nomeSocial, slug: form.handleNomeChange(nomeSocial) as any })` — indica que `handleNomeChange` provavelmente tem efeito colateral (atualiza state internamente) mas também retorna um valor usado aqui de forma não totalmente tipada. Vale revisar a assinatura desse handler se for mexer nessa função.
- **Regra de bloqueio de recadastro** (`perfilExistente.status !== 'pendente'`) depende de `status`, que é o mesmo campo usado pelo `useAuth`/`HeaderBotoes` para decidir se redireciona para `/cadastro` ou `/dashboard` — os dois pontos do código precisam continuar sincronizados quanto ao significado de `pendente`.

---

## Dashboard do Prestador

**Route group:** `app/(dashboard)/dashboard/`

```
app/(dashboard)/dashboard/
├── layout.tsx          # DashboardLayout — header com botão voltar dinâmico
├── page.tsx             # Dashboard raiz (conteúdo não detalhado ainda)
└── perfil/
    └── page.tsx          # PerfilPage — abas "Meus Projetos" / "Dados Profissionais"
```

### `layout.tsx` — `DashboardLayout`

Envolve toda a área `(dashboard)`. Particularidade: o `Header` recebe `href` dinâmico via `?origem=` na query string (o mesmo `origem` que o `HeaderBotoes` do site público monta ao gerar o link "Meu Painel" — ver [`04-autenticacao.md`](./04-autenticacao.md)). Isso permite que "voltar" no dashboard leve o prestador de volta à página exata de onde ele veio, não sempre para a home.

Usa `Suspense` porque `useSearchParams()` exige isso no App Router.

### `usePerfilStatus` — gatekeeper do dashboard

```typescript
cadastroCompleto = !!(prestador?.nome?.trim() && prestador?.whatsapp && prestador?.categoria_id)
```

Três campos mínimos definem "cadastro completo": nome, whatsapp e categoria. Note que isso é **mais permissivo** que a validação de 100% exigida no formulário de cadastro (`calcularProgresso`) — um prestador pode ter `cadastroCompleto: true` aqui sem ter preenchido foto, bio, termos, etc. novamente (esses já foram exigidos na criação inicial do registro `ativo`).

Também retorna `slug`, usado para montar o link "Ver meu perfil" (`/${slug}`, abre em nova aba).

### `perfil/page.tsx` — `PerfilPage`

Tela principal onde o prestador passa o dia a dia. Duas abas:

| Aba | Componente | Condição de bloqueio |
|---|---|---|
| **Meus Projetos** (padrão, abre primeiro) | `PortfolioDashboardTab` | Bloqueada se `!cadastroCompleto` |
| **Dados Profissionais** | `EditarPerfilTab` | Nunca bloqueada |

**Lógica de redirecionamento automático:** se `!validando && !cadastroCompleto`, força a aba para `perfil` mesmo que o padrão seja `portfolio` — garante que um prestador com cadastro incompleto sempre caia primeiro na tela de completar dados, não numa aba de portfólio vazia e bloqueada.

Terceiro item na barra de navegação (não é bem uma "aba", é um link externo): **"Ver meu perfil"**, só aparece quando `slug` existe e abre `/${slug}` em nova guia — deixa o prestador conferir como o perfil público está aparecendo sem sair do dashboard.

### Aba "Dados Profissionais" — `EditarPerfilTab.tsx`

Reaproveita quase integralmente os mesmos hooks e subcomponentes do `FormularioCadastro` (`usePrestadorForm`, `useCategorias`, `useLocalizacao`, `useSlugCheck`, `SecaoOQueVoceFaz`, `SecaoDadosPessoais`, `SecaoLocalizacao`, `FotoUpload`) — é essencialmente o mesmo formulário, sem a parte de criação de conta (usuário já está logado) e sem o fluxo de reivindicação.

**Particularidade importante — promoção automática do funil de ativação:**

```typescript
const novoAtivacaoStatus =
  camposObrigatoriosOk && (statusAtual === 'nao_enviado' || !statusAtual)
    ? 'perfil_completo'
    : statusAtual
```

Ao salvar, se todos os campos obrigatórios da vitrine estiverem preenchidos **e** o prestador ainda não passou por nenhuma etapa do funil de ativação via WhatsApp (`ativacao_status` ainda é `nao_enviado`), o sistema promove automaticamente para `perfil_completo`. Isso **não sobrescreve** estados que já vieram de outro fluxo (`respondeu_positivo`, `sem_whatsapp`, etc.) — a condição protege contra regressão do funil de ativação documentado em [`03-banco-de-dados.md`](./03-banco-de-dados.md).

**Exclusão de conta** (`handleExcluirContaTotal`) vai além do `EditarPerfilTab` de cadastro: também remove a foto do Storage manualmente (extraindo o path da URL pública) antes de deletar o registro e fazer `signOut()` — limpeza mais completa que o `handleExcluirPerfil` do formulário de cadastro original, que só deleta a linha do banco.

### Aba "Meus Projetos" — `PortfolioDashboardTab.tsx`

Orquestra `usePortfolioDashboard` e alterna entre duas visões:

**Visão lista** (`showWizard === false`):
```
PrestadorSideCard (coluna fixa)  +  DashboardHeader (stats) → EstadoVazio ou grid de ProjetoCard
```

**Visão wizard** (`showWizard === true`):
```
PrestadorSideCard (coluna fixa)  +  UploadWizardContainer (key por projeto)
```

| Subcomponente | Papel |
|---|---|
| `PrestadorSideCard` | Card fixo na coluna esquerda com foto, nome, categoria, cidade, WhatsApp e média de avaliação do prestador — sempre visível, tanto na lista quanto durante edição de projeto |
| `DashboardHeader` | Banner azul com contagem total de projetos, concluídos e ativos + botão "Adicionar Trabalho" |
| `EstadoVazio` | Empty state clicável — mesmo clique de `onNovoProjeto` no header |
| `ProjetoCard` | Card de cada projeto na grade, com thumbnail (foto de maior `ordem`, i.e. a mais recente/"depois"), contador de fotos, e badge de status visual |

**Lógica de status visual em `ProjetoCard` (`getStatusConfig`)** — mapeia `status` do projeto + presença de avaliação em 5 rótulos diferentes:

| `status` do projeto | `avaliacoes.length > 0`? | Label exibido |
|---|---|---|
| `em_registro` | — | Rascunho |
| `pendente` | — | Aguard. cliente |
| `em_execucao` | — | Em progresso |
| `finalizado` | Sim | Concluído |
| `finalizado` | Não | Aguard. avaliação |

Isso é uma **derivação de UI** sobre os dois campos de banco (`portfolio_projetos.status` + existência de linha em `avaliacoes`) — não existe um status de banco chamado "aguardando avaliação" diretamente; é calculado no frontend.

**Grid ímpar:** quando o número de projetos é ímpar, um botão "+" extra preenche o espaço vazio no grid de 2 colunas — detalhe de polimento visual.

### ✅ Confirmado: `UploadWizard.tsx` é seguro para deletar

`PortfolioDashboardTab.tsx` já importa e usa `UploadWizardContainer` (não o `UploadWizard.tsx` antigo):

```typescript
import { UploadWizardContainer } from './wizard/UploadWizardContainer'
// ...
<UploadWizardContainer key={projetoParaEdicao?.id || 'novo'} ... />
```

O uso de `key={projetoParaEdicao?.id || 'novo'}` no componente pai é exatamente o mecanismo de remontagem mencionado no comentário do `UploadWizardContainer.tsx` — confirma que a correção do bug de loop foi aplicada de ponta a ponta.

### Refatoração do wizard em subcomponentes — mais clara agora

`PrestadorCardHorizontal.tsx` tem um comentário de uso explícito no próprio arquivo:

```typescript
/**
 * Card horizontal do prestador exibido ACIMA do WizardForm.
 * Substitui a coluna esquerda que ficava dentro do wizard.
 *
 * Uso em PortfolioDashboardTab (ou onde o wizard é montado):
 *   <PrestadorCardHorizontal ... />
 *   <WizardForm hookData={hookData} />
 */
```

Isso confirma a intenção: **substituir o cabeçalho azul inline** do `UploadWizardContainer.tsx` (com WhatsApp/nome/título do cliente sobre fundo gradiente azul) por um layout mais simples — um card horizontal com dados do *prestador* (não do cliente) acima do formulário, deixando `WizardForm` cuidar só dos dados do serviço e da timeline.

**`TimelineVertical`** (`components/shared/TimelineVertical.tsx`) não é órfão — já está em uso ativo pela `LinhaDeTempo` (módulo de Acompanhamento do Cliente, documentado adiante). `WizardTimeline.tsx` reaproveitaria esse mesmo componente do lado do prestador, dando consistência visual entre a timeline que o prestador vê no dashboard e a que o cliente vê ao acompanhar o serviço — mas essa integração specific ainda não foi feita no `UploadWizardContainer.tsx` atual.

**Resumo do estado real:**
- `UploadWizard.tsx` → deletar (legado, confirmado não usado)
- `UploadWizardContainer.tsx` → ativo, funcional, mas ainda com hero/form/timeline inline
- `PrestadorCardHorizontal.tsx` + `WizardForm.tsx` + `WizardTimeline.tsx` → peças prontas de uma refatoração visual (hero simplificado + reuso do design system de timeline), não finalizada

### ⚠️ `PortfolioTab.js` é código placeholder/mock — não confundir com `PortfolioDashboardTab.tsx`

```javascript
// PortfolioTab.js
{[1, 2, 3, 4, 5, 6].map(i => (
  <img src={`https://picsum.photos/400/400?random=${i}`} ... />
))}
```

Usa imagens aleatórias do Picsum — claramente um protótipo/mock, não conectado a dados reais. `PortfolioDashboardTab.tsx` é o componente real e ativo (usa `usePortfolioDashboard`, `ProjetoCard`, dados do Supabase). `PortfolioTab.js` é candidato a remoção — nome quase idêntico ao componente real é um risco de confusão para quem for editar o código depois.

---

## Portfólio Público (perfil `[slug]`)

**Rota:** `app/[slug]/page.tsx` (a confirmar caminho exato)
**Componente:** `PerfilPublico` → `PerfilCarregado` (padrão: componente raiz só trata loading/erro, subcomponente interno só renderiza depois que os dados existem — evita hooks condicionais)

Estrutura em duas colunas (sticky na esquerda em desktop): `PerfilHero` + ações na esquerda; `PerfilSobre`, `PerfilCTA` (WhatsApp), `PortfolioGrid` e `PerfilAvaliacoes` na direita.

### `usePerfilPrestador` — hook de carregamento

Busca em duas queries paralelas-sequenciais:
1. `prestadores` com joins de `cidades`, `categorias`, `portfolio_projetos` (incluindo `portfolio_fotos` e `avaliacoes.indica` aninhados) — filtrado por `slug` **ou** por `id` se o parâmetro da URL for um UUID (regex simples detecta o formato)
2. `avaliacoes` separadamente, filtrando `visivel = true` e limitando a 10, mais recentes primeiro

**Por que uma segunda query separada para avaliações**, já que o join já trouxe `avaliacoes(id, indica)` por projeto? Porque o join traz só `indica` (usado no `PortfolioGrid` para o badge "✦ Indico" por projeto), enquanto a segunda query traz o objeto completo de avaliação (`nota`, `comentario`) para a seção `PerfilAvaliacoes` — e só as **visíveis** (`visivel = true`), aplicando moderação. É uma escolha deliberada de não misturar os dois propósitos na mesma query.

**Filtro de projetos exibidos:** só `em_execucao` e `finalizado` aparecem no portfólio público — projetos em `em_registro` ou `pendente` (ainda não aceitos pelo cliente) ficam invisíveis publicamente, o que faz sentido para não expor trabalho não confirmado.

**Ordenação de projetos:** finalizados primeiro, depois por data mais recente dentro de cada grupo de status.

**Captura e limpeza do parâmetro `?from=`:**
```
Tem ?from=? → usa como urlRetorno + loga 'VISITA_PERFIL_VIA_BUSCA' + remove da URL visível via history.replaceState
Não tem? → monta urlRetorno como /prestadores?q=<categoria> (fallback razoável de "voltar para resultados parecidos")
```
A remoção do `?from=` da URL visível (sem disparar navegação/refetch) é proposital — evita que o parâmetro apareça em links compartilhados/salvos pelo usuário, mantendo a URL pública limpa (`/[slug]`), enquanto ainda usa a informação internamente para o botão "voltar" e analytics.

> Nota de nomenclatura: confirma-se aqui que o parâmetro é `?from=` (não `?origem=`, usado no dashboard) — reforça o item já registrado no roadmap sobre padronizar esse nome entre os dois fluxos.

### `PerfilHero.tsx`
- Usa `useAvaliacoes(prestador.id)` para stats de nota/total — hook próprio, separado da carga inicial de `usePerfilPrestador` (uma terceira fonte de dados de avaliação, além do join e da query de `PerfilAvaliacoes` — os três coexistem para propósitos diferentes: badge por projeto, stats agregados do hero, e lista detalhada)
- Ações secundárias: "Denunciar" (`/denunciar/[id]`) e "Compartilhar" (via `useCompartilharPerfil`)

### `PerfilSobre.tsx`
Bio do prestador com fallback textual explícito quando vazia: *"Informações coletadas via curadoria pública. Este profissional ainda não personalizou sua biografia."* — reforça sutilmente ao visitante (e principalmente ao próprio prestador, se for ver seu perfil) que reivindicar/completar o perfil melhora a apresentação. Lista de habilidades como chips, só renderiza a seção se houver alguma.

### `PerfilCTA.tsx` — botão de WhatsApp com CTA persistente

Comportamento notável: usa `IntersectionObserver` no botão principal de CTA para detectar quando ele sai da viewport (`scrolled` state) — quando isso acontece, um **botão flutuante circular** (fixed, canto inferior direito) aparece como CTA persistente. Garante que o caminho para contato via WhatsApp esteja sempre acessível independente de quanto o visitante rolou a página.

Se o prestador não tiver WhatsApp válido, o componente retorna `null` — sem CTA quebrado ou vazio.

Mensagem pré-formatada no link `wa.me`: *"Olá {nome}, vi seu perfil no Procuro Quem Faça e gostaria de um orçamento."* — mesma modelo de mensagem padronizada visto em outros pontos do sistema (aceite/conclusão de projeto).

### `PortfolioGrid.tsx`
Grid responsivo (2 ou 3 colunas conforme quantidade de projetos) de cards de projeto, cada um abrindo `ProjetoModal` (não revisado ainda) ao clicar. Capa = foto de maior `ordem` (mais recente/"depois"), com fallback para `/placeholder-job.png` se não houver foto ou se a imagem falhar ao carregar (`onError` com guard para não entrar em loop infinito de fallback).

Badge "✦ Indico" aparece se **qualquer** avaliação do projeto tiver `indica: true` — nota: um projeto pode ter mais de uma avaliação vinculada em teoria (múltiplos registros em `avaliacoes` para o mesmo `projeto_id`), embora o fluxo de avaliação (`useAvaliar`) pareça ter sido desenhado para uma avaliação por projeto. Vale confirmar se há proteção de unicidade no banco (constraint) além da lógica de UI que oculta `BlocoAvaliacao` se já existir `avaliacaoExistente`.

Status visual simplificado (2 estados, diferente do `ProjetoCard` do dashboard que tem 5): "Concluído" (`finalizado` ou já tem foto de ordem 3) vs. "Em andamento" (com indicador pulsante). Público não precisa ver o detalhe fino de `pendente`/`em_registro`/etc. que o prestador vê no dashboard.

### `PerfilAvaliacoes.tsx`
Lista as até 10 avaliações visíveis carregadas por `usePerfilPrestador`. Calcula média local (`mediaNotas`) e contagem de indicações a partir do array já em memória — sem nova query. Não renderiza nada (`return null`) se não houver avaliações — seção inteira some, não mostra "nenhuma avaliação ainda".

### `useCompartilharPerfil` — hook completo

Mais robusto do que documentado anteriormente: usa uma camada de service (`lib/services/compartilharPerfil.service.ts`) com funções puras (`buildUrlPerfil`, `buildTextoPadrao`, `buildTextoWhatsApp`) e efeitos (`compartilharViaNative`, `compartilharViaWhatsApp`, `registrarCompartilhamento`).

**Dois modos de compartilhamento, expostos separadamente:**
- `compartilhar()` — tenta Web Share API nativa do dispositivo; se não disponível, cai para copiar link (clipboard), mostrando "Copiado!" por 2s
- `compartilharWhatsApp(numeroDestinatario?)` — abre WhatsApp diretamente com mensagem formatada, podendo mirar um número específico ou abrir o seletor de contato

Todo compartilhamento é registrado via `registrarCompartilhamento({ prestador_id, canal, origem })` — rastreamento de qual canal (`clipboard`/`native_share`/`whatsapp`) e de onde (`perfil_publico`/`dashboard`/`pagina_sucesso`) o compartilhamento ocorreu, útil para entender quais pontos do produto geram mais divulgação orgânica.

### `RastreamentoAtivacaoProvider`
Wrapper fino em `Suspense` (por usar `useSearchParams`) que só invoca `useRastreamentoAtivacao(prestador, srcParam)` — captura parâmetro `?src=` (provavelmente identifica a origem de uma campanha de ativação via WhatsApp, ver `ativacao_status` em `03-banco-de-dados.md`) e não renderiza nada (`return null`). Lógica real do rastreamento está no hook, não revisado ainda.

### ✅ Corrigido: `AdCard` no perfil usava valor inválido de `AdPage`

O código original tinha:
```typescript
<AdCard page={"perfil" as AdPage} categoria={...} />
```

`AdPage` (em `types/ads.ts`) não inclui `'perfil'` — só `'perfil_prestador'`. O cast `as AdPage` fazia o TypeScript aceitar, mas o valor real em runtime não correspondia a nenhuma opção válida do tipo, provavelmente fazendo essa posição cair num fallback genérico em vez do pensado para o perfil.

**Correção aplicada:** trocado para `page="perfil_prestador"`, removendo o cast e o import de `AdPage` que só existia por causa dele.

## Acompanhamento do Cliente

**Rota:** `app/acompanhamento/[token]/page.tsx` (a confirmar caminho exato)
**Hook:** `useAcompanhamento(token)` — acesso via `avaliacao_token` do projeto, sem exigir login do cliente

Layout de duas colunas: `CardPrestador` + `StatusMini` + `RodapeSeguranca` (sticky, esquerda) e `LinhaDeTempo` (direita).

**`LinhaDeTempo.tsx`** é a versão **do lado do cliente** do mesmo conceito visual da timeline do prestador (`WizardTimeline.tsx`, ainda não integrada) — e efetivamente já usa o componente compartilhado `TimelineVertical`:

```typescript
import { TimelineVertical, TimelineEstado, TimelineNo } from '@/components/shared/TimelineVertical'
```

Isso confirma que `TimelineVertical` é peça real de design system do projeto, não código órfão — só falta o lado do prestador (`WizardTimeline.tsx`) ser efetivamente conectado ao `UploadWizardContainer.tsx` para os dois lados (cliente e prestador) compartilharem a mesma base visual de timeline.

**Diferenças de estado entre as duas timelines:**
- `WizardTimeline` (prestador): 3 estados (`concluido`/`ativo`/`pendente`) baseados só em `fotosUrls`
- `LinhaDeTempo` (cliente): mesma lógica de estado, mas cada nó é **clicável** (`onFotoClick`) e abre `ModalDiscussao` — o cliente pode comentar em cada foto, algo que não existe do lado do prestador na timeline em si (comentários do prestador ficam dentro do `WizardZoomModal`, não na lista)

Contador de comentários por foto aparece inline em cada nó da timeline do cliente (`MessageSquare` + contagem), dando visibilidade de "essa etapa tem N comentários" sem precisar abrir o modal.

## Avaliação

**Rota:** `app/avaliar/[token]/page.tsx` (a confirmar caminho exato)
**Hook:** `useAvaliar(token)` — não detalhado neste documento ainda (código não revisado)

Reaproveita `CardPrestador` e `RodapeSeguranca` do módulo de Acompanhamento. Componentes específicos: `CarrosselFinalizacao` (mostra as 3 fotos finais) e `BlocoAvaliacao` (nota, comentário, campo "indica" — mapeando diretamente para as colunas `nota`, `comentario`, `indica` de `avaliacoes` documentadas em `03-banco-de-dados.md`).

Se `avaliacaoExistente` já existir, oculta `BlocoAvaliacao` — impede reavaliação (reforçado também por regra de negócio/constraint no banco, a confirmar se há um índice único `projeto_id` em `avaliacoes` além do trigger de auto-avaliação já documentado).

## Reivindicação de Perfil

**Rota:** `app/reivindicar/page.tsx`
**Componente:** `PaginaReivindicar` → `ReivindicarConteudo`

Tela intermediária entre o perfil público (banner "Este é o seu perfil?") e o formulário de cadastro. Puramente informativa/motivacional — lista vantagens de "assumir" o perfil (edição total, prioridade no ranking) e, ao confirmar, apenas redireciona:

```typescript
router.push(`/cadastro?reivindicar=${prestadorId}`)
```

Toda a lógica real de reivindicação (validar se já tem dono, transferir dados, etc.) vive no `FormularioCadastro`, já documentado na seção de Cadastro. Esta página não faz nenhuma chamada ao Supabase além de checar se há sessão ativa (`checkSession`, resultado não usado para nenhuma decisão visível no componente — possível código residual).

## Página de Sucesso

**Rota:** `app/sucesso/page.tsx`
**Componente:** `PaginaSucesso`

Tela de agradecimento pós-avaliação. **Puramente estática** — sem hooks de dados, sem props, sem parâmetros de rota. O botão "Compartilhar Resultado" não tem `onClick` implementado (`<button>` sem handler) — provavelmente placeholder visual ainda não conectado a `navigator.share` ou similar.

> ⚠️ Não recebe nenhum dado do projeto/avaliação que acabou de ser feita — não personaliza com nome do prestador ou nota dada. Vale avaliar se isso é intencional (tela genérica) ou uma oportunidade perdida de reforçar a experiência (ex: "Sua avaliação para João Silva foi registrada").

## Denúncia

**Rota:** `app/denunciar/[id]/page.tsx`
**Componente:** `PaginaDenuncia`
**Service:** `criarDenuncia(prestadorId, motivo)` em `lib/services/denuncia.service.ts`

Formulário simples: textarea de motivo → `criarDenuncia` → tela de sucesso inline (sem navegação, troca de estado `sucesso`). Mapeia diretamente para a tabela `denuncias` documentada em `03-banco-de-dados.md` (`prestador_id`, `motivo`, `status: 'aberta'` por padrão).

Aviso no rodapé ("Falsas denúncias podem levar ao banimento") é só texto informativo — não há enforcement técnico visível nesta tela (a aplicação de banimento por denúncias falsas, se existir, aconteceria no admin/moderação).

## ⚠️ Chat em tempo real — decisão: não será implementado

Existe um componente `ProjetoTimeline.jsx` (ainda em JS, sem tipagem) implementando um **chat em tempo real completo** entre cliente e prestador, usando uma tabela **`projeto_mensagens`** que não apareceu no schema revisado em `03-banco-de-dados.md`:

```typescript
supabase.from('projeto_mensagens').select('*').eq('projeto_id', idDoProjeto)
// realtime via supabase.channel(`room_${idDoProjeto}`)
```

Campos inferidos do código: `id`, `projeto_id`, `conteudo`, `remetente_tipo` (`cliente`/`prestador`), `tipo_evento` (`chat` vs. eventos de sistema, ex: mudança de fase), `created_at`.

**Isso seria funcionalmente diferente do que já existe:**
- `portfolio_comentarios` → comentário vinculado a uma **foto específica** (`foto_id`), estilo "feedback pontual sobre essa etapa" — é o que `ModalDiscussao` (Acompanhamento) e `WizardZoomModal` (Dashboard) já cobrem
- `projeto_mensagens` (este achado) → chat contínuo vinculado ao projeto inteiro, com UI de bolhas estilo WhatsApp, Realtime via canal Supabase

**Decisão registrada:** este recurso **não será implementado**. O WhatsApp já cumpre o papel de comunicação direta entre cliente e prestador — replicar isso dentro do app duplicaria esforço (Realtime, moderação, notificações) sem necessidade real, já que a base de usuários já está habituada ao WhatsApp como canal principal.

`ProjetoTimeline.jsx` e a tabela `projeto_mensagens` (se existir em produção) são candidatos a remoção — ver `07-roadmap.md`.

## Busca e Listagem de Prestadores

Módulo com dois pontos de entrada: a **home** (busca inicial) e **`/prestadores`** (resultados/listagem).

### Home — `app/page.tsx`

**Componentes:** `Home` → `HeroSection` (dynamic import, `ssr: false`) + `SearchForm`

`HeroSection` só envolve `HeaderBotoes` (documentado em `04-autenticacao.md`) em um `Suspense` — nome é um pouco enganoso, não é um "hero" de conteúdo, é a barra de navegação superior posicionada em `absolute`.

**`SearchForm.tsx`:** input controlado + botão, com estado de erro visual (borda/placeholder vermelhos) quando o usuário tenta submeter vazio. Usa `useRef` para ler o valor do input diretamente no submit (`inputRef.current?.value`) em vez de confiar só no state `busca` — parece uma proteção contra o valor do state estar dessincronizado no momento exato do submit (event handler assíncrono vs. render), embora `busca` também seja atualizado via `onChange`.

**Fluxo de submit (`dispararBusca` em `Home`):**
```
Sem termo → mostra erro por 3s, não navega
Com termo → insertLog('BUSCA_REALIZADA', { termo }) → router.push('/prestadores?q=<termo>')
```

Log de busca é fire-and-forget (não aguarda antes de navegar) — não deve atrasar a navegação, mas também significa que uma falha no insert de log é totalmente silenciosa para o usuário.

**Sugestões (`useSugestoes`):**
- Sem debounce no carregamento inicial (busca vazia) — chama na hora
- Com debounce de 300ms conforme o usuário digita
- Fallback em duas camadas: se o banco retornar vazio **ou** der erro, usa `SUGESTOES_FALLBACK` de `config/categorias.ts` — buscador nunca fica sem nenhuma sugestão visível
- Rótulo muda dinamicamente: "Sugestões em destaque" (busca vazia) vs. "Encontramos para você" (busca ativa)
- Clicar numa sugestão dispara a busca diretamente (`dispararBusca(null, item)`), sem precisar de submit do form

### `/prestadores` — Listagem

Já documentado na seção anterior (parâmetros de URL, chips de cidade, injeção de anúncios). Detalhando agora o hook central:

### `usePrestadores` — lógica completa

**Carregamento de dados:** busca `prestadores` ativos + médias de avaliação em paralelo (`getPrestadoresAtivos`, `getMediasAvaliacoes`, ambos em `lib/db/prestadores.ts`, com suporte a `AbortSignal` para cancelar requisições obsoletas se a busca mudar rápido).

**Cálculo de média local:** em vez de depender de uma query agregada do banco, o hook busca todas as notas (`{ prestador_id, nota }[]`) e calcula soma/total em JS (`calcularMedias`). Isso é diferente da view `prestadores_ranqueados` documentada em `03-banco-de-dados.md`, que já calcula `media_interna` no banco — **o frontend não usa essa view**, recalculando por conta própria. Vale avaliar se migrar para a view economizaria payload e lógica duplicada, ou se há um motivo (ex: a view só considera `status = 'ativo'`, e aqui pode ser necessário incluir prestadores em outros status).

**Parsing de busca com cidade embutida (`parsearBusca`):**
```typescript
"pedreiro em Londrina" → { termo: "pedreiro", cidadeExtraida: "Londrina" }
```
Regex simples (`/^(.+?)\s+em\s+(.+)$/i`) extrai cidade quando o usuário digita no formato natural "X em Y" — bate com o placeholder do `SearchForm` ("Ex: pedreiro em Londrina"), então é um padrão pensado e comunicado ao usuário, não uma feature escondida.

Se extrai cidade e a URL não tinha `?cidade=`, aplica via `router.replace` (silencioso, sem novo carregamento perceptível) — sincroniza a URL com o que foi entendido da busca livre.

**Origem `'vitrine'` tem prioridade absoluta:**
```typescript
const vitrines = normalizados.filter(p => p.origem_tipo === 'vitrine')
const demais = normalizados.filter(p => p.origem_tipo !== 'vitrine')
const filtrados = filtrarPrestadores(demais, termoNorm)
setPrestadoresBase([...vitrines, ...filtrados.sort(...)])
```
Prestadores com `origem_tipo: 'vitrine'` (valor não visto antes em `03-banco-de-dados.md` — os valores documentados eram `registro_direto`, `curadoria_publica`, `reivindicado`) aparecem **sempre no topo**, **sem passar pelo filtro de termo de busca**. Isso é provavelmente um mecanismo de destaque pago ou curadoria editorial forte — vale confirmar o significado exato de `'vitrine'` e se deveria estar documentado em `03-banco-de-dados.md` como um valor válido de `origem_tipo`.

> ⚠️ Adicionar `'vitrine'` à lista de valores de `origem_tipo` em `03-banco-de-dados.md` — não havia constraint/check visível para essa coluna no schema fornecido, então não há validação de banco impedindo outros valores livres também.

**Ordenação dos demais:** `pesoOrdenacao(prestador)` (em `lib/ordenacao.ts`, não revisado) define a ordem de exibição dos não-vitrine — provavelmente combina fatores como verificação, avaliação, completude de perfil. A documentar quando o código for revisado.

**Geolocalização silenciosa:**
```typescript
navigator.geolocation.getCurrentPosition(...) → Nominatim (OpenStreetMap) reverse geocoding
```
Só roda se **não houver** `?cidade=` na URL. Usa a API pública do Nominatim (OpenStreetMap) para reverse geocode — serviço gratuito, mas sujeito a rate limit e sem SLA; se cair, falha silenciosamente (não bloqueia a listagem, só não teria filtro de cidade automático). Permissão negada pelo usuário também falha silenciosamente — não há prompt algum além do nativo do browser.

**Prioridade de cidade efetiva:** `URL (?cidade=) > cidade extraída da busca textual > geolocalização`. Faz sentido — intenção explícita do usuário (URL ou texto digitado) sempre vence sobre inferência de localização.

### `PrestadorCard.tsx` — card individual

Reaproveita `getIniciais`, `getLocalizacao`, `getPerfilHref` de `lib/prestadorUtils.ts` (agora corrigido — ver nota de bug abaixo).

**Link de perfil carrega contexto de origem:**
```typescript
getPerfilHref(slug, id) → `/${slug || id}?from=${encodeURIComponent(pathname + search)}`
```
Isso é o `?from=` que o `usePerfilPrestador` (perfil público) provavelmente consome para o botão "voltar" saber para onde retornar — mesma ideia do `?origem=` usado no dashboard (`04-autenticacao.md`), mas com nome de parâmetro diferente (`from` vs. `origem`). Vale padronizar o nome do parâmetro entre os dois fluxos se forem conceitualmente a mesma coisa.

**"É você?" inline:** para prestadores de `origem_tipo: 'curadoria_publica'`, um pequeno link de texto no canto do card leva direto para `/reivindicar` — ponto de entrada adicional ao fluxo de reivindicação, além do banner já documentado dentro do perfil público (`PerfilHero`).

**Fallback de imagem:** `onError` no `<img>` seta `imgError`, trocando para as iniciais do nome — evita ícone quebrado do browser se a URL da foto falhar.

### 🐛 Bug corrigido: `getPerfilHref` — tipo incompatível

**Sintoma:** `Argument of type 'number' is not assignable to parameter of type 'string'`, no `PrestadorCard.tsx`, chamando `getPerfilHref(prestador.slug, prestador.id)`.

**Causa:** `prestadores.id` é `bigint` no banco (`03-banco-de-dados.md`), tipado como `number` no TypeScript — mas `getPerfilHref` declarava `id: string`.

**Fix:**
```typescript
// lib/prestadorUtils.ts
export function getPerfilHref(slug: string | null, id: string | number): string {
```
O corpo da função não precisou mudar — o template literal (`` `/${slug || id}...` ``) já convertia `number` para string automaticamente em runtime; o erro era puramente de tipagem estática, não de comportamento.

### Log de atividades — `insertLog` e função auxiliar nova

`hooks/useLog.ts` centraliza a escrita em `logs_atividades` (documentada em `03-banco-de-dados.md`), capturando `usuario_id`/`usuario_email` da sessão atual automaticamente — todo lugar que chama `insertLog` não precisa se preocupar em passar dados do usuário manualmente.

Função nova adicionada: `checkLogExists(usuarioId, acao)` — verifica se um usuário já disparou uma ação específica alguma vez. Não vi ainda nenhum lugar chamando essa função no código revisado até agora; possível uso: evitar logs duplicados de eventos "primeira vez" (ex: primeiro clique em algo), ou gating de alguma feature "mostre isso só uma vez por usuário". A confirmar propósito quando aparecer em uso.

### Peças ainda não documentadas deste módulo

| Peça | Status |
|---|---|
| `lib/buscaUtils.ts` (`normalizarTermo`, `filtrarPrestadores`) | Não revisado — lógica real de matching de texto |
| `lib/ordenacao.ts` (`pesoOrdenacao`) | Não revisado — critério de ranking dos resultados |
| `lib/db/prestadores.ts` (`getPrestadoresAtivos`, `getMediasAvaliacoes`) | Não revisado |
| `lib/db/categorias.ts` (`getSugestoesDestaque`, `getSugestoesPorBusca`) | Não revisado |
| Significado de `origem_tipo: 'vitrine'` | Não documentado em nenhum lugar visto até agora |

---

## Sistema de Anúncios (frontend)

O backend do sistema de anúncios (leilão CPC, segmentação, `anunciantes`/`anuncios`) já foi documentado em `03-banco-de-dados.md`. Esta seção cobre a camada de exibição no app.

### `AdCard.tsx` — componente de exibição

**Dois modos de renderização:**

1. **AdSense real** — se `anuncio?.adsense_slot` existir, renderiza um `<ins className="adsbygoogle">` (Google AdSense). Tem uma checagem de segurança: espera 2s e verifica se o elemento tem altura (`offsetHeight > 10`) — se o AdSense não carregou nada visível (bloqueado por adblock, sem preenchimento disponível, etc.), cai para o fallback automaticamente.
2. **Fallback** (`AdCardFallback`) — usado sempre que não há slot de AdSense, ou quando o AdSense falha silenciosamente.

### 💡 Decisão de produto atual: fallback como canal de contato direto

Nos pontos de uso vistos até agora (`app/prestadores/page.tsx`), `AdCard` é sempre chamado com `anuncio={null}`:

```typescript
<AdCard page="lista_topo" anuncio={null} categoria={queryBusca || filtroHab || ''} />
```

Ou seja, **hoje o sistema sempre cai no fallback** — não há preenchimento real de `anuncio` vindo do banco (`anunciantes`/`anuncios`) nos pontos de chamada revisados. O fallback foi configurado para direcionar para o **WhatsApp do próprio fundador**, funcionando como canal de contato comercial direto.

**Racional documentado pelo usuário:** em um estágio sem tráfego significativo, não compensa operacionalizar o leilão de anúncios real (que exige anunciantes pagantes e volume para ser atrativo). Usar o espaço de anúncio como CTA de contato direto acelera conversas comerciais (parcerias, anunciantes early-adopter, feedback) enquanto a base de usuários cresce — o inventário publicitário "se paga sozinho" promovendo o próprio produto até fazer sentido ligar o sistema de leilão real.

Isso é uma escolha consciente de sequenciamento, não um bug ou feature incompleta — mas é importante deixar registrado que a **infraestrutura de leilão (`anunciantes`, `anuncios`, CPC, segmentação) já existe no banco e está pronta**; o que falta é o "encanamento" de fato popular o campo `anuncio` no `AdCard` a partir de uma query real quando fizer sentido ativar.

### `AdPage` — pontos de inventário definidos

```typescript
type AdPage = 'prestadores' | 'perfil_prestador' | 'busca_servicos' | 'lista_topo'
```

Quatro posições de anúncio mapeadas no tipo. Confirmadas em uso: `lista_topo` (topo da listagem), `prestadores` (a cada 5 cards, ver seção de Busca/Listagem), e `perfil_prestador` (no perfil público — **porém com bug de tipagem**, ver seção de Portfólio Público: o código passa `"perfil"` em vez de `"perfil_prestador"`, mascarado por um `as AdPage`). `busca_servicos` ainda não visto em uso — possivelmente para a home.

### Peças ainda não documentadas deste módulo

| Peça | Status |
|---|---|
| `useAdContext(page, categoria)` | Não revisado — provavelmente resolve `fallback` (conteúdo do CTA) e `contexto` com base na página/categoria |
| `AdCardFallback.tsx` | Não revisado — o card visual que efetivamente aparece hoje na maior parte do site |
| `AdFallback` (tipo) | Já se sabe a forma (`emoji`, `titulo`, `subtitulo`, `cta`, `href(contexto)`, `cor`) — falta ver o conteúdo real configurado |
| Ponto de integração real com `anuncios`/`anunciantes` do banco | Não existe ainda nos call sites revisados — a implementar quando o leilão for ativado |