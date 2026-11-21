# Área Administrativa — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Layout:** `app/(admin)/layout.tsx` — sidebar (`components/admin/AdminSidebar.tsx`) + header (`components/admin/AdminHeader.tsx`), dados de usuário via `hooks/useAdminAuth.ts` (só leitura para exibição; acesso já validado pelo middleware antes da página renderizar).

**Proteção:** `middleware.ts`, Regra C — qualquer `/admin/*` exige sessão + `perfis_admin`, exceto `/admin/login` (liberada explicitamente, com redirect automático para `/admin` se já houver sessão de admin válida).

## Menu e nomes das telas (20/11/2026)

O menu (`AdminSidebar.tsx`) é organizado por tarefa. As URLs não mudaram (links de e-mail e favoritos continuam valendo); mudou o nome na tela.

| Grupo | Item no menu | Rota |
|---|---|---|
| Hoje | Visão geral | `/admin` |
| Confiança e segurança | Denúncias | `/admin/moderacao` |
| | Selos | `/admin/verificacoes` |
| | Pedidos do titular | `/admin/titular` |
| Pessoas | Prestadores | `/admin/prestadores` |
| Crescimento | Convites | `/admin/ativacao` |
| | Análises | `/admin/analises` (abas Resumo, Cliques, Atividade) |
| Plataforma | Catálogo de serviços | `/admin/habilidades` |
| | Geografia | `/admin/geografia` |

- **Convites** (antes "Ativação") é a **única porta de contato** com prestador, pelo fluxo com link pessoal. A tela **Prestadores** é um diretório: não tem mais painel de WhatsApp nem e-mail (`getMensagem` e `buildEmail` foram removidos). No detalhe, perfil sem conta mostra "Convidar em Convites" e perfil no ar mostra "Abrir perfil público".
- **Adicionar prestador** (antes "Povoar base") saiu do menu: é o botão no topo de Prestadores e leva a `/admin/povoar`.
- **Anúncios** saiu do menu e da visão geral (sem anunciante nem receita). A rota `/admin/anuncios` e o código seguem, acessíveis só por URL; se após 60 dias continuar sem anunciante, apagar.
- **Visual padronizado (20/11/2026):** Denúncias, Selos (CNPJ e Seguro/CND) e Pedidos do titular usam o kit `components/admin/ui` (PageHeader, Segmented, Badge, Button, Field, EmptyState). Só mudou a aparência: regras, textos de ação e `data-testid` ficaram iguais. `components/admin/padraoVisual.test.ts` impede essas telas de voltarem ao estilo antigo (`font-black`, `uppercase italic`, `zinc-`, `indigo-`, textos de 9 a 11px). Anúncios segue no estilo antigo (oculto do menu; será apagado se continuar sem uso).
- **Bloqueio direto em Prestadores (20/11/2026):** no painel do prestador, "Bloquear perfil" abre um campo de motivo (obrigatório) e pede confirmação; não depende de denúncia. Usa as mesmas funções do banco das Denúncias (`admin_bloquear_prestador` e `admin_desbloquear_prestador`; o motivo fica em `prestador_bloqueio`). Perfil bloqueado sai das buscas e listas públicas e mostra a etiqueta "Bloqueado" na lista. Código: `hooks/admin/useBloqueioPrestador.ts` e `components/admin/prestadores/BloqueioPrestador.tsx`. Atenção: `admin_desbloquear_prestador` também força `status = 'ativo'`; desbloquear um perfil que ainda estava com cadastro pendente o coloca no ar.
- **Metas do mês (20/11/2026):** card na visão geral com duas metas do plano de 30 dias (`lib/admin/metas.ts`): 10 profissionais com conta (perfil com usuário, sem os de exemplo) e 3 trabalhos aceitos no feed (`portfolio_projetos` com `feed_aceito_em`, sem `feed_oculto` nem `feed_revogado_em`). Os números vêm de `getMetasDoMes()` em `adminDashboard.service.ts`. O depoimento real do plano é manual e não entra no card.
- **Convites — "Para fazer hoje" (20/11/2026):** `components/admin/ativacao/FilaDeHoje.tsx` com as regras em `lib/ativacao/fila.ts`. Meta de 5 convites por dia (dia contado no horário de Brasília), fila com quem convidar agora (sem conta, nunca contatado, com endereço e WhatsApp; Londrina primeiro; respeita o filtro de local), e lista de quem foi contatado há 3 dias ou mais sem responder, com "Abrir conversa" (WhatsApp sem texto pronto) e "Respondeu". Enviar convite usa o mesmo fluxo do botão da linha (link pessoal) e marca como enviado.
## Feed (passo 7)

- Tela `/admin/feed` (grupo Pessoas): lista os 100 trabalhos mais recentes aceitos pelo cliente com o aviso do feed e o total aceito por dia nos últimos 14 dias.
- Situações: No feed, Aceito em andamento, Oculto pelo prestador, Retirado pelo cliente, Removido pela equipe.
- "Remover do feed" exige motivo (fica registrado em `feed_moderacao`). Depois de removido, nem cliente nem prestador recolocam; só "Devolver ao feed" na tela da equipe.
- Retirada feita pelo cliente não pode ser desfeita pelo admin.
- Banco: migration `20261121100000_feed_moderacao_admin.sql` (`admin_feed_resumo`, `admin_remover_do_feed`, `admin_devolver_ao_feed`). Aplicar primeiro na homologação.
- Perfis de exemplo (`prestadores.exemplo`) são demonstração: aparecem com a etiqueta "Demonstração", escondidos por padrão na tela Feed, fora do total por dia e fora da meta "3 trabalhos no feed" (migration `20261121110000_feed_admin_exemplos.sql`).
- Código: `lib/feed/adminFeed.ts`, `lib/services/adminFeed.service.ts`, `hooks/admin/useAdminFeed.ts`, `components/admin/feed/FeedAdmin.tsx`.

## Verificação em duas etapas (passo 8)

- Tela `/admin/seguranca` (menu Plataforma, "Segurança da conta"): liga o código do aplicativo autenticador (QR code + chave manual, confirmação com 6 números) e desativa.
- Login (`useAdminLogin`): depois da senha, se a conta tem aplicativo cadastrado, pede o código ("Confirme que é você"). Se não der para saber o nível de acesso, sai da conta e não entra.
- `proxy.ts`: admin com aplicativo cadastrado que ainda não digitou o código é mandado ao `/admin/login` (erro ao consultar também bloqueia). No próprio login fica na tela, sem laço.
- Regras puras em `lib/auth/adminMfa.ts`; Supabase em `lib/services/adminMfa.service.ts`.
- **Ainda não exigido no banco:** quem não cadastrou o aplicativo entra só com senha. Exigir o segundo fator também nas funções do banco (`is_admin()`) é um passo à parte, depois que o dono cadastrar o aplicativo.
- **Senhas vazadas:** a proteção do Supabase (HaveIBeenPwned) só existe no plano Pro; o projeto está no Free, então o aviso do verificador continua.
- Perda do celular: com um único admin, a recuperação é remover o fator direto no Supabase (`auth.mfa_factors`). Considerar uma segunda conta de admin.

- Teste do menu: `components/admin/AdminSidebar.test.tsx`; do diretório: `components/admin/prestadores/PrestadoresCentral.test.tsx`.

## `/admin` — Dashboard

**Classificação dos prestadores (tela Prestadores, `types/adminPrestadores.ts`, revisada em 13/11/2026).** A etapa de cada prestador vem da origem (`origem_tipo`), do status e da conta, nesta ordem: sem conta → *Perfil público* (ou *Cadastro iniciado* se for rascunho); com conta e `status = 'pendente'` → *Cadastro iniciado*; com conta e funil de ativação completo (`perfil_completo`/`avaliacao_recebida`) → *Ativo*; origem `reivindicado` (ou o formato antigo, `curadoria_publica` com conta) → *Reivindicado*; origem `registro_direto` → *Cadastro direto*. Antes, qualquer perfil com conta era chamado de *Reivindicado*, inclusive quem criou o próprio cadastro, e a mensagem de WhatsApp sugerida dizia "seu perfil já está reivindicado" para quem nunca assumiu nada. A origem tem três nomes: *Curadoria pública*, *Perfil assumido* e *Cadastro direto*.

`hooks/useAdminDashboard.ts` + `lib/services/adminDashboard.service.ts`. Métricas gerais (contadores de cidades/anúncios/prestadores/logs), origem de prestadores (curadoria/registrados/reivindicados), funil de ativação, radar de eventos recentes (clique WhatsApp, busca sem sucesso, denúncia), subscription Realtime em `logs_atividades` com notificação visual para denúncias.

**Removido em 20/11/2026:** o card "Categorias mais buscadas" (e `getRankingCategorias`). Dependia de logs `acao='FILTRO_CATEGORIA'` que nunca foram gravados (nenhum registro em produção), então o card ficava sempre vazio. Só deve voltar quando o app gravar esse log ao filtrar por categoria.

## `/admin/login`

Tela com o logo do PQF, título "Painel administrativo" e visual do kit `components/admin/ui`. Estado e ações em `hooks/useAdminLogin.ts`; consultas em `lib/services/adminAuth.service.ts`; textos e regra de e-mail em `lib/auth/adminLogin.ts`.

- **E-mail e senha** com `autocomplete` correto, foco no e-mail e botão de mostrar/ocultar senha.
- **Erro único** para e-mail ou senha errados ("E-mail ou senha incorretos"), sem revelar se a conta existe.
- **Conta que não é admin** (`perfis_admin`): `loginAdmin` confere o perfil logo após entrar; sem perfil, desconecta e mostra "Esta conta não tem acesso ao painel."
- **Esqueci minha senha:** envia o link pelo Supabase com retorno em `/recuperar-senha` (mesma página do site) e responde igual para e-mail cadastrado ou não. Depois de criar a senha, a pessoa cai no `/login` do site e segue para `/admin`.
- **Testes:** `app/(admin)/admin/login/page.test.tsx`, `lib/services/adminAuth.service.test.ts`, `lib/auth/adminLogin.test.ts`; o login dos testes e2e (`entrarComoAdmin`) usa os rótulos "E-mail", "Senha" e o botão "Entrar".
- A rota `/admin/auditoria` (verificador de URL de indexação, sem consulta a dados) foi removida em 20/11/2026.

## Contador de pendências (menu, visão geral e e-mail diário)

Fonte única: a função `contar_pendencias()` no banco (só `service_role`; o painel usa `admin_pendencias()`, que confere `is_admin()`). Regras de texto e soma em `lib/notificacoes/mensagens.ts` (`normalizarPendencias`, `totalPendencias`, `totalSelos`).

| Chave | O que conta | Onde aparece |
|---|---|---|
| `titular_abertas` / `titular_atrasadas` | Pedidos do titular `recebida` ou `em_analise` (e os com prazo vencido) | Menu "Pedidos LGPD" (vermelho se houver atraso), visão geral, e-mail |
| `denuncias_abertas` | Denúncias `aberta` | Menu "Denúncias", visão geral, e-mail |
| `selos_cnpj_abertos` | Verificações de CNPJ `pendente` ou `em_analise` (a lista da aba CNPJ) | Menu "Selos" (somado), visão geral, e-mail |
| `selos_documentos_abertos` | Pedidos de Seguro ou CND em análise (`dados ? 'pedido'`, a lista da aba Seguro e CND) | Menu "Selos" (somado), visão geral, e-mail |

- **Garantias e contestações saíram do contador em 20/11/2026:** o admin não tem tela para tratá-las (garantia corre entre cliente e prestador; `contestacoes` está vazia e sem uso no código).
- O e-mail diário (`app/api/cron/resumo-pendencias`) lista cada tipo com pendência e os links do painel; sem pendência, não envia.
- O app trata chave ausente como zero: a ordem entre migration (`20261120210000_pendencias_selos_sem_garantias.sql`) e deploy não importa.
- Testes: `lib/notificacoes/mensagens.test.ts`, `components/admin/AdminSidebar.test.tsx`, `app/api/cron/resumo-pendencias/route.test.ts`.

## `/admin/analises` (Análises)

Tela única com três abas (links, cada uma com URL própria, layout em `app/(admin)/admin/analises/layout.tsx`). Os endereços antigos `/admin/cliques` e `/admin/logs` redirecionam para as abas novas.

- **Resumo** (`/admin/analises`): `TrafegoCard` com `useAdminTrafego` (equipe, anônimos e sinais de robô; 7 ou 30 dias).
- **Cliques** (`/admin/analises/cliques`): `useAdminCliques` (rota `/api/admin/cliques`), período de 7, 30 ou 90 dias.
- **Atividade** (`/admin/analises/atividade`): `hooks/useAdminLogs.ts` + `lib/services/adminLogs.service.ts`. Período de 7, 30 ou 90 dias (padrão 30), teto de 1000 registros por carga com aviso quando o período tem mais do que isso; filtros (e-mail/termo, data, tipo), gráfico por dia/mês (Recharts), exportação CSV e Realtime via `subscribeLogsAtividades` (`lib/db/logs.ts`). Trocar o período recarrega a lista.
- O item de menu "Análises" fica ativo nas três abas (`SidebarLink` com `prefixo`).

## `/admin/moderacao` (tela "Denúncias")

O nome na tela e no menu é **Denúncias** (desde 20/11/2026); a URL continua `/admin/moderacao` para não quebrar os links dos e-mails de aviso. Garantias e contestações não passam por aqui (ver "Contador de pendências").

`hooks/useModeracao.ts` + `lib/services/denuncia.service.ts` (estendido com `fetchDenuncias`, `atualizarStatusDenuncia`, `bloquearPrestadorDenunciado`). Lista denúncias filtráveis por status (aberta/resolvida/arquivada), com ações de resolver, arquivar, ou bloquear o prestador denunciado diretamente (usa `prestadores.bloqueado`/`motivo_bloqueio`).

**Nota:** esta é uma reconstrução completa da rota — o arquivo anterior sob `/admin/moderacao` era, por engano, uma cópia do formulário de cadastro de prestador, sem nenhuma relação com moderação de denúncias.

**Pendência:** validar em homologação — valores de status e ação de bloqueio implementados por suposição a partir do schema documentado, sem confirmação de colunas adicionais que possam existir na tabela `denuncias`.

## `/admin/povoar` (tela "Adicionar prestador")

`hooks/usePovoar.ts` + `lib/services/povoar.service.ts`. Formulário de curadoria manual — insere um novo prestador diretamente com `origem_tipo: 'curadoria_publica'`, verificação de WhatsApp duplicado com debounce, geração de slug, avatar placeholder via `ui-avatars.com`.

**Bug corrigido:** o insert incluía um campo `categoria` (texto) inexistente na tabela `prestadores` — a tela nunca funcionou até a correção. Removido, mantendo só `categoria_id` (relação real via FK).

## `/admin/habilidades` (tela "Catálogo de serviços")

`app/(admin)/admin/habilidades/page.tsx` + `hooks/useHabilidades.ts` + `lib/services/categorias.service.ts`. Gerencia o catálogo de serviços: **grupos** (nome, ícone, ordem) e **categorias** (nome, grupo, destaque e **exemplo de descrição**). A tabela antiga `habilidades` (5 linhas) não tem mais tela nem serviço no admin (o arquivo `habilidades.service.ts` foi apagado em 20/11/2026, sem uso), mas **ainda é lida** por `fetchHabilidades` em `categorias.service.ts` (`useCategorias`, no cadastro e na edição do perfil): não apagar a tabela antes de migrar esse uso.

### Regra do catálogo: toda categoria nova precisa de exemplo de descrição (13/11/2026)

Na tela de novo trabalho, o campo de descrição da foto do "Depois" mostra uma sugestão no tom do ofício de cada prestador (`categorias.exemplo_descricao`). Um eletricista vê um exemplo de eletricista; quem faz doces vê um exemplo de doces. Um exemplo de outro ofício passa a impressão de que a plataforma não foi feita para aquela pessoa, por isso **toda categoria nova precisa do seu exemplo**.

Checklist ao criar uma categoria:
1. Criar o grupo, se ele ainda não existir.
2. Criar a categoria em `/admin/habilidades` preenchendo **Exemplo de descrição do trabalho**. O campo é obrigatório, com 15 a 140 letras (`lib/catalogo/exemploCategoria.ts`). Escreva uma frase do que foi feito, como alguém da área escreveria. Ex.: para Eletricista, "Troca da fiação do quadro e instalação de disjuntor novo."
3. Conferir na lista se a categoria não aparece com o selo "Sem exemplo" (o cabeçalho da lista mostra quantas faltam). O exemplo pode ser corrigido a qualquer momento em "Editar exemplo".
4. Se a categoria for criada por SQL (migração), incluir `exemplo_descricao` no `insert`. O formulário do admin é quem exige o campo; o banco aceita nulo.

Uma categoria sem exemplo não quebra nada: a tela mostra a frase neutra "Conte em uma frase o que foi feito.". Só administradores editam categorias (política `admins podem atualizar categorias`).

## `/admin/geografia`

`app/(admin)/admin/geografia/hooks/useGeografia.ts` + `lib/db/geografia.ts`. Três formulários em cascata (`FormEstado`, `FormRegiao`, `FormCidade`) + `TabelaCidades` com filtro estado/região e vínculo de região por cidade inline. Módulo já seguia o padrão correto integralmente antes da revisão.

### `/admin/anuncios`

### Decisão: componentização por responsabilidade única

O fluxo de lojista foi escrito em componentes separados:

- **`AnuncioLojistaForm`** — só captura e valida os dados de um anúncio (cadastro ou edição), integrando o bloqueio de inventário e datas.
- **`SegmentacaoFields`** — gerencia a adição e remoção de múltiplas segmentações geográficas (cidade + categoria) para o mesmo anúncio.
- **`AnuncioLojistaLista`** — só exibe os anúncios já cadastrados, com toggle ativo/rascunho, editar e excluir (com confirmação). Não sabe nada sobre formulário.
- **`page.tsx`** — orquestração pura: liga o hook aos componentes acima, sem regra de negócio própria.

Essa separação permite retomar o fallback Google AdSense (`tipo: 'google'`) depois, como um componente irmão (`AnuncioGoogleForm.tsx`), reaproveitando a mesma listagem.

### `app/api/admin/anunciantes/route.ts` — primeira API route do projeto

Até este ponto, todo o PQF opera client-side. Criar uma conta Auth em nome de outra pessoa exige a **service role key**, que nunca pode ser exposta ao client — por isso essa é a primeira operação do projeto que precisa de uma API route server-side.

**O que faz:**
1. Recebe `email`, `razaoSocial`, `cnpjCpf`, `whatsapp`
2. Verifica se já existe um usuário Auth com esse e-mail
3. Se não existir, cria via `supabase.auth.admin.createUser()` com senha temporária gerada
4. Faz `upsert` em `anunciantes` vinculado ao `user_id`
5. Retorna a senha temporária **apenas na criação** (null se o usuário já existia).

### `lib/services/adminAnuncios.service.ts`

Segue o padrão de service já usado no projeto — uma função por operação Supabase. Contém a validação do formulário contra o inventário (`validarSegmentacoesContraInventario`). O cálculo de vagas (`verificarInventarioSegmento`), a lista de anúncios no ar por praça e o registro de métricas moram em `lib/services/anunciosPublicos.service.ts` (usados também pelas páginas públicas) e são reexportados daqui.

### `hooks/useAdminAnuncios.ts`

Estado do painel: `anuncios`, `loading`, `enviando` (mantidos **separados** para evitar bugs visuais de skeleton), `erro`. `toggleAtivo` usa atualização otimista (muda o estado local antes da resposta do banco) para resposta instantânea na UI.

### `supabase/setup_anuncios_storage.sql`

Cria:
- Bucket `anuncios-banners`, **separado** do bucket de fotos de projeto.
- Policy de leitura pública e escrita restrita ao admin.
- Policies de RLS em `anuncios` e `anunciantes` (admin gerencia tudo).

## Integração pendente (fora deste MVP)

O `AdCard.tsx`/`useAdContext.ts` ainda **não foram alterados** — hoje continuam sempre em modo fallback (WhatsApp institucional). Para o anúncio cadastrado aqui realmente aparecer no site, falta:

- `useAdContext` passar a consultar `anuncios` filtrando por `status = true`, `status_aprovacao = 'aprovado'`, e segmento resolvido.
- `AdCard.tsx` ganhar um terceiro modo de exibição: anúncio próprio do lojista, renderizando `imagem_url` com o selo "Publicidade".

## Roadmap — desenhado, não implementado

Registrado aqui para não se perder, mas fora do escopo atual:

- **Self-service do lojista:** lojista cria a própria conta e cadastra o próprio anúncio.
- **Pagamento via Asaas:** assinatura mensal fixa (R$50/mês), webhook liberando anúncio.
- **Painel do lojista:** tela própria para acompanhar cliques/impressões do anúncio.
- **Leilão com slots dinâmicos por segmento:** rebaixamento de posição quando superado por lance maior; número de slots escala com prestadores; cálculo real de raio geográfico.

## `/admin/ativacao` (tela "Convites")

`app/(admin)/admin/ativacao/page.tsx` (TypeScript, kit `components/admin/ui`). Funil dos perfis criados pela curadoria: cada linha abre um painel para enviar a mensagem pelo WhatsApp com o link pessoal do perfil (`gerarTokenReivindicacao` em `lib/services/ativacao.service.ts`), copiar o link, avançar o status e anotar uma observação. Leitura e gravação passam por `lib/services/ativacaoAdmin.service.ts` (`listarPerfisParaAtivacao`, `salvarStatusAtivacao`, `salvarObsAtivacao`; campos `ativacao_status`, `ativacao_enviado_em`, `ativacao_respondeu_em`, `ativacao_obs`). Mensagens em `lib/ativacao/mensagem.ts`, filtros em `lib/ativacao/lista.ts` e a fila "Para fazer hoje" em `lib/ativacao/fila.ts` + `components/admin/ativacao/FilaDeHoje.tsx`. É a única porta de contato com prestador.

**Funil de ativação** (card no alto da tela, `components/admin/ativacao/FunilDeAtivacao.tsx`, regras em `lib/ativacao/funil.ts`): entre os perfis já convidados, quantos responderam com interesse, criaram ou assumiram a conta, publicaram um trabalho e tiveram trabalho aceito e no ar no feed, com a leitura em uma frase de onde está o gargalo. Perfis de exemplo ficam de fora, quem recusou sai do funil (contado à parte) e contas que chegaram sem convite pela ferramenta aparecem em separado. Respeita o filtro de local da tela. Os trabalhos vêm de `listarTrabalhosDosPrestadores` (só colunas liberadas ao admin em `portfolio_projetos`); se essa leitura falhar, a lista continua e as duas últimas etapas mostram zero.

**Precisa de ajuda** (card abaixo do funil, `components/admin/ativacao/PrecisaDeAjuda.tsx`, regras em `lib/ativacao/ajuda.ts`): contas reais (com `user_id`, sem exemplo) que travaram antes do feed, em três situações: conta sem trabalho publicado, trabalho `pendente` esperando o cliente aceitar e trabalho `em_execucao` (aceito) esperando o prestador finalizar. Mostra há quantos dias; "parado" é 3 dias ou mais (`DIAS_PARADO`), e esses vêm primeiro. Cada item tem o botão "Chamar no WhatsApp" com mensagem pronta (primeiro nome, sem cobrança, sem promessa). O admin não lê o WhatsApp do cliente, então o contato é sempre com o prestador. Respeita o filtro de local.

## Estado da auditoria administrativa

As rotas `/admin/ativacao` e `/admin/anuncios` foram revisadas em setembro de 2026. Em 20/11/2026 o painel foi reavaliado e reorganizado (menu por tarefa, Selos no contador, visual padronizado, Feed, Análises, verificação em duas etapas). `/admin/anuncios` está fora do menu (acessível por URL) e possui implementação ativa com `useAdminAnuncios`, cadastro de anunciante via API server-side, segmentações, inventário, métricas e simuladores. A integração dos anúncios próprios na vitrine pública continua pendente e está descrita no bloco de integração abaixo.
