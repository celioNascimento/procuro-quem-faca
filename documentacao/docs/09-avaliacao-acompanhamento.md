# Avaliação e Acompanhamento — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

## Avaliação

**Rota:** `app/avaliar/[token]/page.tsx` + `hooks/useAvaliacao.ts` (export `useAvaliar`) + `lib/services/avaliacao.service.ts`

Reaproveita `CardPrestador`/`RodapeSeguranca` do Acompanhamento. `CarrosselFinalizacao` (3 fotos finais) + `BlocoAvaliacao` (nota/comentário/indica).

**Submit** (`handleFinalizarAvaliacao`): `inserirAvaliacao` (`status: 'finalizado'`, `visivel: true`, `indica: indica ?? false`) → `finalizarProjeto` → `router.push('/sucesso')`. Se `avaliacaoExistente?.status === 'finalizado'`, oculta `BlocoAvaliacao`.

### Campo `indica` — comportamento atual

`indica` é `boolean | null` tanto no hook quanto nos tipos:

- `null` — estado inicial; o bloco de indicação fica oculto até o cliente selecionar uma nota
- `true` — cliente selecionou "Indico"
- `false` — cliente selecionou "Não indico"
- No submit, `null` é normalizado para `false` via `indica ?? false`

**Pré-seleção automática por nota** (em `useAvaliar`, via `useEffect` que observa `nota`):
- Nota 4–5 → pré-seleciona `true` (indico)
- Nota 1–2 → pré-seleciona `false` (não indico)
- Nota 3 → volta para `null` (neutro, usuário decide)

### `BlocoAvaliacao.tsx` (`components/acompanhamento/`)

Exibe dois botões lado a lado ("👍 Indico" / "👎 Não indico") em vez de toggle único. O bloco só aparece após o cliente selecionar uma nota (`nota > 0`). Prop `indica` é `boolean | null`; prop `setIndica` recebe `(v: boolean) => void` (o componente nunca emite `null` — só o `useEffect` de pré-seleção pode fazê-lo).

**Visual:**
- `indica === true` → botão "Indico" ativo (azul `bg-blue-600`)
- `indica === false` → botão "Não indico" ativo (slate escuro `bg-slate-700`)
- `indica === null` → ambos no estado neutro (borda `slate-200`)

### `PerfilAvaliacoes.tsx` (`components/profile/`)

Badge no cabeçalho de cada card usa comparação estrita (`=== true` / `=== false`) para não exibir badge em avaliações legadas com `indica: null`:
- `indica === true` → badge azul "👍 Indico"
- `indica === false` → badge slate "👎 Não indico"
- `indica === null` → sem badge

Resumo no topo da seção exibe dois contadores independentes (indicações e não-indicações), ambos só aparecem se > 0.


### `FormularioAvaliacao.tsx` (ativo, `components/profile/`)

Delega a `useSubmitAvaliacao` (`lib/services/avaliacao.service.ts` + `uploadWizard.service.ts` para upload). O fluxo antigo de checkbox "Reportar problema/Solicitar Garantia" ainda contém referências a contestação (`contestacoes`) e precisa ser migrado para `solicitacoes_garantia`. A tabela `contestacoes` está desativada; novos casos devem usar a máquina de estados de garantia/reclamação documentada em `03-banco-de-dados.md`, sem sobrescrever a nota original.

A solicitação de garantia/reclamação deve ser tratada pelo fluxo `solicitacoes_garantia` (`garantia.service.ts`/`garantiaWizard.service.ts`), distinto do fluxo linear pós-serviço (`useAvaliar`). O legado de `contestacoes` permanece desativado.

### `AvaliacoesTab`/`AvaliacaoCard`/`AvaliacoesResumo`

Não conectados a nenhuma tela. `PerfilAvaliacoes` (em produção) esconde a seção quando vazia; `calcularStats` (`lib/utils/avaliacao.utils.ts`) só marca `exibir: true` com 10+ avaliações — decisão de produto para o volume atual.

## Acompanhamento do Cliente

**Rota:** `app/acompanhamento/[token]/page.tsx` + `hooks/useAcompanhamento.ts`

Acesso via `avaliacao_token`, sem login. Duas colunas: `CardPrestador`+`StatusMini`+`RodapeSeguranca` / `LinhaDeTempo`.

**`LinhaDeTempo.tsx`** usa `TimelineVertical` (`components/shared/`, compartilhado com o wizard do prestador). Cada nó clicável abre `ModalDiscussao` (comentários por foto, `onKeyDown` de Enter valida campo não-vazio, consistente com o botão de envio).

**Componentes de `components/acompanhamento/`** — todos puramente apresentacionais, sem I/O direto:

| Componente | Papel |
|---|---|
| `CardPrestador.tsx` | Card do prestador + contato (usa `buildLinkWhatsapp`) + rótulo de status dinâmico conforme `projeto.status` |
| `CarrosselFinalizacao.tsx` | Carrossel de fotos finais (tela de Avaliação) |
| `LinhaDeTempo.tsx` | Timeline do cliente, badge de status por 3 estados reais |
| `ModalDiscussao.tsx` | Chat por foto (comentários cliente/prestador) |
| `BlocoAvaliacao.tsx` | Formulário de nota/comentário/indica |
| `RodapeSeguranca.tsx` | Estático, sem props |
| `StatusMini.tsx` | Dois cards de resumo (progresso, registros) |

## Reivindicação do projeto pelo token

Os links `/acompanhamento/[token]` e `/avaliar/[token]` exigem login (o `proxy.ts` manda para `/login?next=...`). Ao carregar o projeto, `useAcompanhamento` e `useAvaliar` chamam `reivindicarProjetoPorToken(token)` (`lib/services/avaliacao.service.ts`), que executa a função `reivindicar_projeto_por_token` do banco: **a primeira conta logada que abre o link vira a dona do vínculo** (`portfolio_projetos.cliente_user_id`).

| Resultado | Significado | Efeito na tela |
|---|---|---|
| `vinculado` | Esta conta acabou de virar a dona | `projeto.cliente_user_id` é atualizado em memória (garantia já funciona na mesma visita) |
| `ja_vinculado` | Esta conta já era a dona | Nada muda |
| `vinculado_outra_conta` | Outra conta chegou antes | `AvisoProjetoOutraConta`; sem botão de avaliar, sem garantia, e `handleFinalizarAvaliacao` não envia |
| `prestador_dono` | O próprio prestador abriu o link | Não vira cliente; vê a página normalmente |
| `nao_encontrado` / `nao_autenticado` | Token inexistente / sem sessão | Nada muda |

Detalhes que importam:
- A chamada é **não-bloqueante**: se a função não existir (migration não aplicada) ou falhar, o service devolve `null` e `useAcompanhamento` cai no caminho antigo (`reivindicarProjetoPorWhatsapp`, vínculo pelo WhatsApp do perfil), então nada regride antes da migration. Esse fallback pode sair depois que a migration estiver em produção.
- Antes, o vínculo só era criado se o WhatsApp do `profiles` batesse com o do projeto, o que raramente acontecia para quem entra só com Google. A policy antiga (`portfolio_projetos_reivindicar_cliente`) não foi removida.
- O token funciona como segredo de portador: se o link for repassado, a primeira pessoa que entrar com uma conta vira a dona. É o comportamento decidido no roadmap (decisão 1), não um descuido.
- Quem está vinculado a outra conta ainda **vê** o andamento (a leitura continua por token). A **avaliação** é bloqueada também no banco (seção seguinte); a garantia ainda depende só da interface e da policy própria de `solicitacoes_garantia`.

## Quem pode avaliar: somente o dono do projeto

A avaliação em `/avaliar/[token]` só é aceita da conta **dona do projeto** (`portfolio_projetos.cliente_user_id`, ver a seção anterior). Isso é garantido no banco, não só na interface: `handleFinalizarAvaliacao` (`hooks/useAvaliacao.ts`) chama `avaliarProjeto` (`lib/services/avaliacao.service.ts`), que executa a função `avaliar_projeto(p_projeto_id, p_nota, p_comentario, p_indica)`. Ela grava a avaliação (com `cliente_id` = conta logada) e finaliza o projeto numa única transação.

| Resultado | Quando | Mensagem na tela |
|---|---|---|
| `avaliado` | Dono, projeto `em_execucao` com conclusão registrada, ainda sem avaliação | Vai para `/sucesso` |
| `nao_e_dono` | A conta logada não é a dona | Aviso de projeto vinculado a outra conta |
| `sem_vinculo` | O projeto ainda não tem dono | Pede para abrir o link de novo |
| `projeto_nao_concluido` | Status diferente de `em_execucao`, ou sem foto da etapa 3 (ou, em `sem_fotos`, sem `marcado_concluido_at`) | Serviço ainda não concluído |
| `ja_avaliado` | Já existe avaliação finalizada | Serviço já avaliado |
| `nota_invalida` / `nao_autenticado` / `nao_encontrado` | Nota fora de 1 a 5, sem sessão, projeto inexistente | Mensagens próprias |

Além disso, como a avaliação agora grava `cliente_id`, o trigger `check_auto_avaliacao` passa a barrar de fato o prestador avaliando a si mesmo (antes `cliente_id` ia nulo e o trigger nunca disparava).

**Migrations e ordem de aplicação** (nenhuma foi aplicada automaticamente):
1. `20261103230000_reivindicar_projeto_por_token.sql`: vínculo do dono pelo token.
2. `20261104190000_avaliar_projeto_somente_dono.sql`: cria `avaliar_projeto` (aditiva, segura a qualquer momento).
3. **Deploy do app** com `avaliarProjeto`.
4. `20261104190100_fecha_escrita_aberta_avaliacao.sql`: só **depois** do deploy. Remove as policies que deixavam qualquer conta logada inserir avaliação (`"Clientes logados podem avaliar"`, `"Clientes podem avaliar"`) e qualquer visitante finalizar projeto (`"Clientes podem finalizar projetos via token"`). Se for aplicada antes do deploy, o fluxo de avaliar atual para de gravar. O arquivo traz o SQL de rollback.

`inserirAvaliacao`, `finalizarProjeto` e `marcarProjetoEmDisputa` ficaram marcadas como `@deprecated`: após a migration 4 o banco recusa essas escritas diretas. Só o legado `FormularioAvaliacao`/`useSubmitAvaliacao` (hoje sem uso na aplicação) ainda as chama.

**Limite conhecido:** "dono" só é confiável se o token do projeto for secreto. Hoje as policies de leitura de `portfolio_projetos` expõem `avaliacao_token` (e `cliente_whatsapp`) a qualquer pessoa com a chave pública, então um projeto **ainda sem dono** pode ser reivindicado por qualquer conta logada que leia o token. Fechar isso exige tirar o token da leitura pública (ver `13-roadmap.md`).

## Reivindicação de Perfil

**Rota:** `app/reivindicar/page.tsx` — puramente apresentacional, sem I/O. Redireciona para `/cadastro?reivindicar=<id>`, toda lógica real vive no Cadastro (`05-cadastro-prestador.md`).

## Página de Sucesso

**Rota:** `app/sucesso/page.tsx` — estática. Botão "Compartilhar Resultado" usa `navigator.share`/fallback de clipboard com texto genérico (a página não recebe dados do projeto/prestador avaliado — pendência de personalização, ver `13-roadmap.md`).

## Denúncia

**Rota:** `app/denunciar/[id]/page.tsx` + `lib/services/denuncia.service.ts` (`criarDenuncia`). Formulário → tabela `denuncias` (`status: 'aberta'`). Aviso de "banimento por denúncia falsa" é só texto informativo. Revisão/moderação de denúncias vive em `12-admin.md`.

## Exclusão de Conta

**Rota:** `app/confirmar-exclusao/page.tsx` — ver `04-autenticacao.md`.

## Chat em tempo real

**Decisão de produto: não implementado.** WhatsApp já cumpre esse papel. Nenhum código ativo referencia `projeto_mensagens`. Comentários pontuais por foto (`portfolio_comentarios`, via `ModalDiscussao`/`WizardZoomModal`) são o mecanismo de feedback assíncrono do produto.
