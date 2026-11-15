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

**Estado vazio:** sem avaliações, o componente renderiza a caixa tracejada "Nenhuma avaliação ainda" (mesmo estilo e padding do estado vazio de `PortfolioGrid`). Antes retornava `null`, o que esvaziava a aba, encurtava a página e fazia a tela "pular" ao alternar de Portfólio para Avaliações.


### Fluxo antigo de avaliação com contestação (removido em 14/11/2026)

`FormularioAvaliacao`, `useSubmitAvaliacao` e `FotosEvidenciaPicker` (checkbox "Reportar problema" gravando em `contestacoes`) não eram usados por nenhuma tela e foram apagados, junto com as funções `inserirAvaliacao`, `finalizarProjeto` e `marcarProjetoEmDisputa` de `avaliacao.service.ts`. A tabela `contestacoes` está desativada; novos casos usam a máquina de estados de garantia/reclamação documentada em `03-banco-de-dados.md`, sem sobrescrever a nota original.

A solicitação de garantia/reclamação deve ser tratada pelo fluxo `solicitacoes_garantia` (`garantia.service.ts`/`garantiaWizard.service.ts`), distinto do fluxo linear pós-serviço (`useAvaliar`). O legado de `contestacoes` permanece desativado.

### Avaliações no perfil público

`PerfilAvaliacoes` (em produção) mostra o estado vazio "Nenhuma avaliação ainda" quando não há avaliações. `calcularStats` (`lib/utils/avaliacao.utils.ts`) só marca `exibir: true` com 10+ avaliações — decisão de produto para não expor distribuição com baixo volume. Os componentes `AvaliacoesTab`, `AvaliacaoCard` e `AvaliacoesResumo` (distribuição por nota no perfil público, nunca ligados a uma tela) foram removidos em 14/11/2026; quando houver volume, recriar sobre o visual atual.

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

Os links `/acompanhamento/[token]` e `/avaliar/[token]` exigem login (o `proxy.ts` manda para `/login?next=...`). Ao carregar o projeto, `useAcompanhamento` e `useAvaliacao` chamam `reivindicarProjetoPorToken(token)` **antes** de ler o trabalho (desde 13/11/2026): as fotos de um trabalho com aceite pendente só são legíveis pelo cliente dono (ver regra em doc 03), e na primeira abertura ele ainda não é dono até a reivindicação rodar (`lib/services/avaliacao.service.ts`), que executa a função `reivindicar_projeto_por_token` do banco: **a primeira conta logada que abre o link vira a dona do vínculo** (`portfolio_projetos.cliente_user_id`).

| Resultado | Significado | Efeito na tela |
|---|---|---|
| `vinculado` | Esta conta acabou de virar a dona | `projeto.cliente_user_id` é atualizado em memória (garantia já funciona na mesma visita) |
| `ja_vinculado` | Esta conta já era a dona | Nada muda |
| `vinculado_outra_conta` | Outra conta chegou antes | `AvisoProjetoOutraConta`; sem botão de avaliar, sem garantia, e `handleFinalizarAvaliacao` não envia |
| `prestador_dono` | O próprio prestador abriu o link | Não vira cliente; vê a página normalmente |
| `nao_encontrado` / `nao_autenticado` | Token inexistente / sem sessão | Nada muda |

Detalhes que importam:
- A chamada é **não-bloqueante**: se falhar, o service devolve `null`. O vínculo por WhatsApp do perfil foi removido (forjável: `profiles.whatsapp` é editável); o aceite no painel `/meus-servicos` também deixou de pedir confirmação de WhatsApp — só o dono aceita (`aceitar_projeto`).
- O token não é lido pela API: `fetchProjetoPorToken` resolve token → id por `projeto_id_por_token` e lê o resto por id; listas de projetos recebem o token por `tokens_projetos` (`lib/services/projetoToken.service.ts`).
- O token funciona como segredo de portador: se o link for repassado, a primeira pessoa que entrar com uma conta vira a dona. É o comportamento decidido no roadmap (decisão 1), não um descuido.
- Quem está vinculado a outra conta ainda **vê** o andamento (a leitura continua por token). A **avaliação** é bloqueada também no banco (seção seguinte); a garantia também é validada no banco (seção "Garantia e reclamação" abaixo).

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

**Migrations e ordem de aplicação.** Status em produção (banco `procuro-quem-faca-DB`), conferido em 05/11/2026: **as quatro estão aplicadas**, na ordem abaixo (a 1 pelo console, a 2 e a 4 pelo MCP do Supabase após o deploy do app). Verificado no banco: `avaliar_projeto` existe (`SECURITY DEFINER`, `anon` sem execução); `avaliacoes` não tem mais policy de INSERT; `portfolio_projetos` não tem mais UPDATE anônimo; um INSERT direto em `avaliacoes` por conta logada e um UPDATE anônimo de status foram recusados.
1. `20261103230000_reivindicar_projeto_por_token.sql`: vínculo do dono pelo token.
2. `20261104190000_avaliar_projeto_somente_dono.sql`: cria `avaliar_projeto` (aditiva, segura a qualquer momento).
3. **Deploy do app** com `avaliarProjeto`.
4. `20261104190100_fecha_escrita_aberta_avaliacao.sql`: só **depois** do deploy. Remove as policies que deixavam qualquer conta logada inserir avaliação (`"Clientes logados podem avaliar"`, `"Clientes podem avaliar"`) e qualquer visitante finalizar projeto (`"Clientes podem finalizar projetos via token"`). Se for aplicada antes do deploy, o fluxo de avaliar atual para de gravar. O arquivo traz o SQL de rollback.

`inserirAvaliacao`, `finalizarProjeto` e `marcarProjetoEmDisputa` foram removidas em 14/11/2026: após a migration 4 o banco recusa essas escritas diretas e só o fluxo antigo (também removido) as chamava.

**Token secreto:** "dono" só é confiável se o token não vazar. As migrations `20261105190000` (funções, aditiva) e `20261105190100` (revoga leitura pública do token, remove vínculo por WhatsApp, trava `cliente_user_id`) fecham isso; aplicar na ordem: aditiva → deploy → restritiva. Limite residual: o modelo é de portador — quem recebe o link primeiro e loga vira dono (inclusive uma segunda conta do próprio prestador).

## Garantia e reclamação

Casos ficam em `solicitacoes_garantia`. O cliente abre um caso depois do trabalho concluído; o prestador responde; o cliente confirma a resolução ou reabre.

**Estados:** `aberta` → `respondida` → `resolvida` (ou volta a `aberta` se o cliente reabrir); `aberta` → `sem_resposta` (prazo estourado). Oferta de reparo do prestador: `aguardando_aceite_cliente` → `aberta` (cliente aceita) ou `recusada`.

**Tipo e prazo:** `garantia` quando o prestador configurou `garantia_dias` > 0 (janela = esses dias a partir de `data_conclusao`); senão `reclamacao`, janela fixa de 15 dias. O prazo de resposta do prestador é de **5 dias úteis** (seg–sex, horário de São Paulo, `garantia_prazo_uteis`; feriados não contam como folga).

### Segurança: quem decide é o banco (migração `20261115195534_garantia_funcoes_seguras`)

A tabela **não aceita INSERT/UPDATE/DELETE do navegador**; só leitura. Toda mudança passa por funções que conferem quem chama, o estado do caso e o tamanho dos textos:

| Função | Quem pode | Regra principal |
|---|---|---|
| `garantia_abrir_caso` | cliente dono do projeto | projeto finalizado, dentro da janela, descrição de 20 a 2000 caracteres, sem outro caso em andamento |
| `garantia_oferecer_reparo` | prestador dono da avaliação | exige garantia configurada; só avaliação negativa (nota ≤ 3 ou não indica); 1 oferta por avaliação |
| `garantia_aceitar_oferta` / `garantia_recusar_oferta` | cliente do caso | só em `aguardando_aceite_cliente` |
| `garantia_responder` | prestador dono do caso | só em `aberta`; texto de até 2000 caracteres |
| `garantia_confirmar_resolucao` | cliente do caso | só em `respondida`; grava caso e avaliação **na mesma operação**; reparo oferecido pelo prestador vale sempre nota 3 |
| `garantia_reabrir` | cliente do caso | só em `respondida`; novo prazo de 5 dias úteis; apaga a resposta anterior |
| `garantia_processar_vencidos` | **só o servidor** (`service_role`) | rotina diária de prazos |

Mensagens de erro das funções (código `P0001`) já são em português e vão direto para a tela; qualquer outro erro vira "Não foi possível concluir agora."

**Leitura pública** (perfil do prestador, visitante sem login): só 9 colunas — `id, projeto_id, origem, tipo, status, descricao_problema, resposta_prestador_garantia, resolucao_descricao, nota_resultante` — e só de casos já encerrados (`resolvida`, `sem_resposta`, `recusada`). Não expõe `cliente_user_id`, `prestador_id`, `avaliacao_id` nem fotos privadas. **Atenção:** o texto que o cliente escreve como problema e a resposta do prestador aparecem no perfil público desses casos.

**Rotas de API:** `/api/garantia/responder` foi **removida** (não conferia quem chamava; a resposta agora vai direto à função do banco). `/api/garantia/promover-fotos` exige login, ser o cliente do caso, caso `resolvida` e arquivos da pasta do próprio caso.

### Prazos automáticos

`/api/cron/garantia-prazos` (cron da Vercel, 09:00 UTC = 06:00 em São Paulo; exige `CRON_SECRET`) executa `garantia_processar_vencidos`: caso `aberta` com prazo vencido → `sem_resposta` (nota 1 na avaliação); oferta sem aceite há 15 dias → `recusada`. É seguro rodar mais de uma vez por dia.

**Ainda não coberto:** caso `respondida` que o cliente nunca confirma nem reabre fica parado — decisão de 15/11/2026: **não encerrar sozinho** (isso mudaria nota e perfil sem o cliente confirmar). O lembrete é o aviso permanente da Área do cliente.

### Avisos (só dentro do app)

Não há e-mail ao cliente nem ao prestador sobre garantia (decisão de 15/11/2026; o e-mail do projeto só chega ao administrador). As regras ficam em `lib/garantia/avisos.ts`:

| Quem precisa agir | Estado do caso | Onde aparece |
|---|---|---|
| Prestador | `aberta` | `AvisoGarantiaPrestador`, no topo de Meus Trabalhos: "N casos esperando sua resposta", prazo do mais urgente, toque abre esse trabalho |
| Cliente | `respondida`, `aguardando_aceite_cliente` | Cartão laranja da Área do cliente: "Falta a sua resposta. Toque para decidir" (senão "Aguardando o prestador") |

Prazos usam o horário de São Paulo (`hojeEmSaoPaulo`), o mesmo do banco.

### Oferta de reparo (prestador)

No modal de um trabalho concluído, sem caso aberto, `GarantiaOferecerReparo` aparece quando a avaliação é negativa (não indica **ou** nota ≤ 3), o prestador tem `garantia_dias` > 0 e a avaliação ainda não foi resolvida (`lib/garantia/oferta.ts` espelha o banco; quem decide é `garantia_oferecer_reparo`). 1 oferta por avaliação. O cliente aceita ou recusa; se confirmar a resolução, a nota passa a valer 3 em `nota_efetiva` (usada no ranking). A avaliação **não** é escondida do perfil: `oculta_por_garantia` é gravado, mas nenhuma tela usa esse campo hoje.

### Formulário do cliente

`GarantiaFormAbertura` avisa que o texto do problema e a resposta do prestador podem aparecer no perfil público depois que o caso encerrar, e pede para não escrever telefone nem endereço.

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

### Tom das telas de garantia do prestador

`components/dashboard/wizard/garantia/*` (aguardando aceite, aberta, respondida, finalizada, comentários, carrossel e seção do wizard) seguem a mesma regra da Área do cliente: texto ≥12px, sem itálico nem caixa-alta, contraste ≥4,5:1 (sem opacidade em cima de texto colorido).
