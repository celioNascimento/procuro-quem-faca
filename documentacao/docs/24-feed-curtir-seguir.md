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
- `seguir_prestador`, `deixar_de_seguir`, `total_seguidores` (público, só o número). Tabela `seguidores` só é lida pelo próprio usuário (RLS); limite de 500 seguidos por conta; ninguém segue o próprio perfil.
- `alternar_curtida(projeto)`: só logado, só trabalho público, não curte o próprio.
- `feed_projetos(categoria, cidade, somente_seguidos, limite, pagina)`: público. **Nunca devolve nome de cliente, WhatsApp nem endereço.** Devolve título, descrição (280 caracteres), até 5 fotos, prestador (nome, slug, categoria, cidade), total de curtidas, se eu curti e se eu sigo.

## Trabalho do próprio prestador no feed (19/11/2026)
O feed não mostra Seguir nem Curtir no trabalho do usuário logado. No lugar do Seguir aparece a etiqueta "Seu trabalho"; no lugar do coração, o total de curtidas só para leitura ("Nenhuma curtida ainda" quando zero). O trabalho continua aparecendo no feed para ele. O campo `meu` vem de `feed_projetos` (migração `20261119160000_feed_marca_meu`, depois de `20261119150000`), no mesmo espírito do `meu_perfil` de `perfil_social`. As travas do banco (`proprio_perfil`, `proprio_projeto`) continuam como rede de segurança. O perfil público já escondia os botões no perfil próprio.

## Validação feita no banco de teste (com rollback)
Sem aceite não entra; com aceite entra e sem dado pessoal; curtir/descurtir e total; anônimo recusado ao curtir e ao ler `seguidores`; prestador não curte nem segue o próprio; seguir repetido é inofensivo e o feed "só seguidos" mostra o trabalho; cliente não oculta trabalho alheio, prestador oculta e mostra; cliente retira e some; trabalho em execução não entra.

## Reset do E2E
A base do reset precisa conhecer as colunas e a tabela novas: rode `supabase/homologacao/baseline_feed.sql` no banco de teste (já rodado em 19/11). Não recapture a base inteira.

## Falta (ver tarefas)
Aviso no "Aceitar trabalho"; controle "Mostrar no feed" no painel do prestador; "Retirar do feed" em Meus serviços; curtir e seguir na interface; página `/feed` com filtros e aba "Quem eu sigo"; Termos e Privacidade; exportação dos dados (`exportar_meus_dados` deve incluir quem o usuário segue); produção.
