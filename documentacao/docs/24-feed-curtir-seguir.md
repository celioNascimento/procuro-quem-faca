# Feed de projetos, curtir e seguir (rede social de portfólios) — PQF

Última atualização: 19/11/2026. Complementa a Etapa 6 do doc 19 e o doc 08 (portfólio público).

## O que é (MVP)
Um feed público de projetos concluídos, para o cliente descobrir ideias antes de buscar um profissional. Quem está logado pode **curtir** um trabalho e **seguir** prestadores (aba "Quem eu sigo"). Sem comentários e sem posts livres: só trabalho concluído, aceito pelo cliente.

## Decisões (dono, 19/11/2026)
- **Escopo:** feed + curtir + seguir. Comentários e posts livres ficam fora.
- **Acesso:** o visitante vê o feed sem login. Curtir e seguir exigem login. O prestador que é seguido vê **só o total**, nunca quem.
- **Aceite do cliente:** não há caixa extra. O botão "Aceitar trabalho" passa a trazer um aviso claro ("as fotos aparecem no perfil e no feed do prestador; você pode tirar a qualquer momento em Meus serviços"). O aceite grava a versão do texto (`feed_aceito_versao`). **Texto do aviso precisa de revisão jurídica antes da produção.**
- **Só trabalhos novos:** trabalho aceito antes do aviso (`feed_aceito_em` nulo) nunca entra no feed.
- **Sem fila de revisão:** o aceite do cliente e a confirmação de terceiros do prestador já são a revisão (muda o doc 19, que previa revisão manual de fotos com pessoas). Continuam: denúncia, remoção pelo admin e o banco só aceita foto com pessoas com consentimento de terceiros confirmado.
- **Ordem:** mais recentes primeiro, com **rodízio** entre prestadores (1º trabalho mais novo de cada prestador, depois o 2º, e assim por diante). Nada é vendido e selo não muda a posição.
- **Só trabalho "finalizado"** entra no feed (em execução não).

## Regras do banco (migração `20261119100000_feed_curtir_seguir.sql`)
Um trabalho aparece no feed quando: `status = finalizado`, `feed_aceito_em` preenchido, `feed_revogado_em` nulo, `feed_oculto = false`, prestador ativo, não bloqueado e não é perfil de exemplo, e ao menos uma foto liberada (sem pessoas, ou com consentimento de terceiros).
- `aceitar_projeto(p_projeto_id, p_nome, p_feed_versao)`: registra o aceite do feed quando a versão do aviso é enviada.
- `feed_ocultar_projeto(projeto, ocultar)`: só o prestador dono. Não apaga nada.
- `revogar_feed_projeto(projeto)`: só o cliente dono. É permanente para aquele trabalho.
- `seguir_prestador`, `deixar_de_seguir`, `total_seguidores` (público, só o número). Tabela `seguidores` só é lida pelo próprio usuário (RLS); sem limite de perfis seguidos (removido em `20261119190000_feed_seguir_sem_limite`, depois de `20261119100000`); ninguém segue o próprio perfil.
- `alternar_curtida(projeto)`: só logado, só trabalho público, não curte o próprio.
- `feed_projetos(categoria, cidade, somente_seguidos, limite, pagina)`: público. **Nunca devolve nome de cliente, WhatsApp nem endereço.** Devolve título, descrição (280 caracteres), até 5 fotos, prestador (nome, slug, categoria, cidade), total de curtidas, se eu curti e se eu sigo.

## Trabalho do próprio prestador no feed (19/11/2026)
O feed não mostra Seguir nem Curtir no trabalho do usuário logado. No lugar do Seguir aparece a etiqueta "Seu trabalho"; no lugar do coração, o total de curtidas só para leitura ("Nenhuma curtida ainda" quando zero). O trabalho continua aparecendo no feed para ele. O campo `meu` vem de `feed_projetos` (migração `20261119160000_feed_marca_meu`, depois de `20261119150000`), no mesmo espírito do `meu_perfil` de `perfil_social`. As travas do banco (`proprio_perfil`, `proprio_projeto`) continuam como rede de segurança. O perfil público já escondia os botões no perfil próprio.

## Compartilhar e atalho do feed no menu (19/11/2026)
- **Compartilhar no card:** botão (ícone) em todo card, inclusive no trabalho do próprio prestador. No celular abre o menu nativo de compartilhar (WhatsApp, Telegram etc.); no computador copia o link e mostra "Link copiado". O link abre o perfil do prestador com o trabalho aberto; a mensagem cita o trabalho e o prestador. Registra o compartilhamento com `origem: 'feed'`. Código: `hooks/useCompartilharTrabalho.ts`, `textoCompartilharTrabalho` em `lib/feed/feed.ts`.
- **Botões estilo Instagram no card (19/11/2026):**
  - **Carrossel:** o card mostra todas as fotos (até 5): desliza, pontinhos e contador "1/5" (`components/feed/FotosDoTrabalho.tsx`). A foto não é mais um link; ir ao perfil é pelos botões.
  - **Toque duplo na foto curte** (só curte, nunca descurte; não vale para trabalho meu; visitante vê o aviso de login).
  - **"Falar com o profissional":** abre o perfil já com o trabalho aberto (`/slug?projeto=<id>`), onde está o "Chamar no WhatsApp" com contagem de cliques. **O feed continua sem devolver WhatsApp** (decisão do dono). Não aparece no trabalho meu.
  - **Menu ⋯** (`MenuDoCard`, não aparece no trabalho meu): "Copiar link" e "Denunciar". A denúncia usa a página que já existe (`/denunciar/<prestador>?trabalho=<id>&titulo=…`); o título e o id do trabalho vão no início do motivo (sem mudar tabela), e a página mostra "Você está denunciando o trabalho: …". Id que não é UUID é ignorado (`lib/feed/denuncia.ts`).
  - **Compartilhar** e **Copiar link** agora levam ao perfil com o trabalho aberto (`?projeto=`), não só ao perfil.
  - **Fora desta etapa:** Salvar (marcador) e comentários. Salvar fica para depois (tabela nova, lista "Salvos", Termos e exportação de dados); comentários não recomendados (moderação e LGPD).
- **Cabeçalho sem "pulo":** no celular o ícone do feed saiu do cabeçalho; "Feed de trabalhos" entrou no menu da conta (avatar), junto de Área do cliente e Área do profissional. No computador o link "Feed" fica em todas as telas, inclusive no `/feed` (marcado como página atual). A prop `semLinkFeed` do Header virou `feedAtivo`. Visitante no celular vê só o Entrar; o caminho dele é o link da home.
- **Imagem quebrada no feed de teste:** as fotos do trabalho de teste apontam para `example.invalid` (dado de teste, não é erro do app).

## Salvar trabalho (19/11/2026)
- **O que é:** marcador como no Instagram. Guarda o **trabalho** como referência. É **privado**: só quem salvou vê; o prestador não sabe quem salvou nem quantos. Limite de **500** por conta ("Você chegou ao limite de 500 trabalhos salvos. Remova algum para continuar."). Não salva o próprio trabalho.
- **Onde:** ícone de marcador no card do feed; ícone no rodapé do modal do trabalho no perfil público (ao lado de Curtir, WhatsApp e Compartilhar); terceira aba **"Salvos"** em `/feed` ("Todos | Quem eu sigo | Salvos"), mais recente primeiro, com os mesmos filtros. Trabalho salvo que sair do feed (retirado pelo cliente ou ocultado pelo prestador) some da aba, mas a marca fica no banco e volta se o trabalho reaparecer. Remover dos salvos dentro da aba tira o trabalho da lista na hora.
- **Banco** (`20261119170000_feed_salvar`, depois de `20261119160000`): tabela `portfolio_salvos (projeto_id, user_id, created_at)` com RLS (cada um lê só os seus; escrita só pela função); `alternar_salvo(projeto)` devolve `{salvo}` ou `{erro}` (`nao_autenticado`, `nao_encontrado`, `proprio_projeto`, `limite_salvos`); `feed_projetos` ganha o parâmetro `p_somente_salvos` e o campo `salvo_por_mim` (a versão de 6 parâmetros é apagada); `perfil_social` devolve `salvo_por_mim` por trabalho; `exportar_meus_dados` inclui `trabalhos_salvos`. Apagar a conta apaga os salvos (on delete cascade).
- **Reset do E2E (teste):** a base do reset precisa conhecer a tabela nova: rode `supabase/homologacao/baseline_feed.sql` (já rodado em 19/11). Não recapture a base inteira.
- **Termos §10 e Privacidade §12:** rascunho atualizado para o advogado (Salvar, dado guardado, privacidade, exportação e exclusão). `VERSAO_DOCUMENTOS` **não** foi alterada: sobe uma vez só depois da revisão jurídica.
- **Fora desta etapa:** salvar prestador; coleções; comentários (não recomendados).

## Validação feita no banco de teste (com rollback)
Sem aceite não entra; com aceite entra e sem dado pessoal; curtir/descurtir e total; anônimo recusado ao curtir e ao ler `seguidores`; prestador não curte nem segue o próprio; seguir repetido é inofensivo e o feed "só seguidos" mostra o trabalho; cliente não oculta trabalho alheio, prestador oculta e mostra; cliente retira e some; trabalho em execução não entra.

## Reset do E2E
A base do reset precisa conhecer as colunas e a tabela novas: rode `supabase/homologacao/baseline_feed.sql` no banco de teste (já rodado em 19/11). Não recapture a base inteira.

## Falta (ver tarefas)
Aviso no "Aceitar trabalho"; controle "Mostrar no feed" no painel do prestador; "Retirar do feed" em Meus serviços; curtir e seguir na interface; página `/feed` com filtros e aba "Quem eu sigo"; Termos e Privacidade; exportação dos dados (`exportar_meus_dados` deve incluir quem o usuário segue); produção.

## Nome do feed e filtros em painel (19/11)

- **Nome:** "Trabalhos concluídos" era vago. Agora é **Feed de trabalhos** no título da página, na aba do navegador, no menu da conta (celular), no texto do interruptor do prestador ("Aparece no Feed de trabalhos."). No computador o link do cabeçalho mostra só "Feed".
- **Filtros:** as três caixas (tipo de serviço, estado, cidade) saíram da tela. Na **linha das abas**, ao lado de "Salvos", ficou um botão só com o ícone de ajustes (`feed-filtrar`; não usamos hambúrguer para não confundir com o menu da conta). O número em cima do ícone (`feed-filtros-contador`) diz quantos filtros estão ligados, mesmo fechado e mesmo vindo de link compartilhado.
- **Folha do rodapé:** tocar no botão sobe uma folha (`feed-filtros-painel`, `role="dialog"`) com os 3 campos, "Limpar filtros" (`feed-filtros-limpar`) e "Pronto" (`feed-filtros-fechar`). Escolher uma opção filtra na hora. Toque fora (`feed-filtros-fundo`), Esc e "Pronto" fecham; o feed não rola por trás. A folha é desenhada no `<body>` (portal) porque a barra se move com `transform`, o que prenderia um `fixed` dentro dela.
- **Barra fixa que some:** abas + filtro ficam fixas logo abaixo do cabeçalho (`feed-barra`, `top-16 md:top-18` = altura do `HeaderBase`; se mudar lá, mudar aqui). Somem ao rolar para baixo e voltam ao rolar para cima, ou perto do topo (hook `hooks/useBarraQueSome.ts`, folga de 8px contra tremida). Foco por teclado dentro da barra a mostra de novo.
- Componente: `components/feed/FiltrosDoFeed.tsx`; contagem em `lib/feed/filtros.ts` (`contarFiltrosAtivos`). Nada mudou no banco nem na URL.

## Ajustes de 19/11 à tarde (card, controle do prestador, limites)
- **Sem título na tela:** o `/feed` não mostra mais "Feed de trabalhos" nem o subtítulo; fica um `h1` `sr-only` (leitores de tela e testes). A barra de abas + filtro é centralizada (`-mx-4 px-4`, abas esticadas) e o **primeiro card fica colado nela**.
- **Card mais compacto:** foto 16:10 (era 4:3), menos preenchimento no cabeçalho e no rodapé, botões de 44 px (`min-h-11`). Nos trabalhos do próprio prestador, "Ver perfil" fica na linha de curtidas/compartilhar (antes ficava sozinho numa linha vazia).
- **"Mostrar no feed" mudou de lugar:** agora em **Divulgação > Feed de trabalhos** (ver doc 06), não mais dentro do card de Meus Trabalhos.
- **Dashboard no celular:** a lista de trabalhos alargava a tela (título com `truncate` num item de grid sem `min-w-0`). Correção: `min-w-0` no card e `grid-cols-1` abaixo de `xl` (teste de regressão em `ProjetoCard.test.tsx`).
- **Limite de seguidos removido** (migração `20261119190000_feed_seguir_sem_limite`, depois de `20261119100000`): a pessoa segue quantos perfis quiser; prestador nunca teve limite de seguidores. **Salvos continuam com 500** (decisão do dono: manter).
- **Segurança:** ver doc 25.

## Produção — decisão de 19/11
O dono decidiu **aguardar a revisão jurídica** (a plataforma ainda não tem receita) antes de levar o feed para a produção. Nada disso foi aplicado na produção. Quando chegar a hora, nesta ordem: (1) backup; (2) conferir `select slug from prestadores where slug !~ '^[a-z0-9_-]+$'` (a migração `20261119200000` falha inteira se houver); (3) aplicar as migrações `20261119100000` a `20261119200000` e as pendentes de selos/tráfego **antes** do merge (o perfil público lê `prestadores.instagram`: código sem a coluna derruba todo perfil); (4) merge; (5) rotacionar `CRON_SECRET`, conferir `RESEND_API_KEY` e o cron `/api/cron/verificacoes-vencimento`; (6) testar o feed e um perfil; (7) subir `VERSAO_DOCUMENTOS` (e `VERSAO_AVISO_FEED` se o aviso mudar) depois do texto aprovado. `e2e_auditar_seguranca` e as funções `e2e_*` não vão para a produção.
