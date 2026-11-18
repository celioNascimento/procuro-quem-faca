# 20. Passagem de conversa: Etapa 2 (selos, CNPJ) e ambiente de teste

Atualizado em 18/11/2026 (noite). **Leia primeiro o "Resumo do estado em 18/11" logo abaixo**; as seções seguintes são o histórico (do mais antigo ao mais novo) e a de 17/11 ("Onde estamos", "O que falta") está superada por ele.

## Resumo do estado em 18/11 (noite)

- Branch `homologacao` (repo `celioNascimento/procuro-quem-faca`): tudo desta etapa validado no banco de teste (`qvrkmaavbrtjnwcaocax`). Último push com E2E verde: `efd7e95`. Depois dele há **ajustes locais ainda sem push**: cabeçalho do painel em uma linha no celular e seta da faixa "Últimos 7 dias" igual em todas as abas.
- Funcionalidades prontas: selo CNPJ (35 dias) com todos os CNAEs, tempo de CNPJ, atividade compatível, experiência (Prata), nível Bronze/Prata com borda colorida (busca, perfil e painel), tag "N% não indicam", ajuda por aba, reverificação agendada (3 por minuto), admin sem editar perfis de outras pessoas. Detalhes nas seções abaixo.
- Falta antes da produção (só com o "pode seguir" do dono): (1) testar o CNPJ 47.403.170/0001-80 com o Jorge (seed abaixo) e ver o Prata; (2) conferir as migrações ausentes na lista de produção (`cadastro_no_ar_sem_aprovacao_manual`, `dados_do_cliente` partes 1 e 2, `exemplo_de_descricao_por_categoria`, `regiao_grande_cascavel`); (3) decidir o cache de 24h dos nomes do QSA; (4) trocar o `CRON_SECRET` de produção e redeploy; (5) confirmar que a URL de produção não redireciona para `www`; (6) rodar `supabase/ops/agendar_reverificacao_cnpj.sql` em produção (nunca commitar com segredo); (7) PR `homologacao` -> `main`.
- Ordem das migrações em produção: 20261117150000, 190000, 210000, 230000, 20261118000000, 120000, 130000, 140000, 150000, 160000 (só teste: não vai), 170000, 180000; depois o script do agendador. Ver doc 21.
- Seed do Jorge no banco de teste (o reset do E2E apaga a cada push): `select public.e2e_semear_experiencia(2, 9, 5);` depois marcar 7 avaliações com `indica=true`, apagar `prestador_verificacoes`/`prestador_cnpj` do prestador 2 e `update prestadores set nome='Jorge Paulo de Lima' where id=2`.
- Cuidados: as ferramentas do Supabase podem estourar o tempo esperando confirmação do dono; não repetir na mesma resposta. Push só quando o dono pedir.
- Ideias futuras: atualizar CNAEs na reverificação; nível em mais lugares; formulário no painel para sugerir CNAE (hoje WhatsApp); e-mail ao admin da fila; remover `prestadores.verificado`; categorias sem mapeamento (Massoterapia, Calheiro, Vidraceiro Automotivo); E2E da seta de CNAEs; testes E2E instáveis.

Este documento deixa a próxima conversa seguir do mesmo ponto. Leia junto com `19 - PQF plano de confiança e conformidade.md` (plano e decisões) e `16-homologacao-e2e.md` (ambiente de teste).

## Onde estamos

- A produção está estável. Os consertos de `/meus-dados` (visitante sem login) e da mensagem de senha errada já foram mergeados na `main`.
- A branch `homologacao` agora é a **branch dos selos**: **não volta para a `main` até a validação completa** das Partes A e B. Correção urgente sai de uma branch curta a partir da `main`.
- Já feito na Etapa 2: migração `supabase/migrations/20261117150000_verificacoes_e_cnpj.sql` (tabelas `prestador_verificacoes` e `prestador_cnpj`, acesso restrito, funções `selos_publicos()` e `nivel_do_prestador()`), aplicada **somente no banco de teste**. E2E da homologação: 52 testes verdes.

## Decisões já tomadas (resumo; detalhe no doc 19, "Decisões de 17/11/2026")

- Fontes gratuitas em cascata: BrasilAPI, minhareceita, ReceitaWS, atrás de uma função única, com cache.
- Aprovação automática: situação ativa **e** nome do prestador igual à razão social do MEI, ao nome fantasia ou a um sócio do QSA. O resto vai para a fila do admin. Selo diz só "CNPJ ativo, consultado em dd/mm".
- Remover dígitos de CPF da razão social de MEI antes de guardar ou exibir (confirmar com consulta real).
- `prestadores.verificado` (boolean) é substituído pelo nível calculado; remover em migração posterior.
- Níveis: Bronze = CNPJ ativo aprovado; Prata = Bronze + (formação comprovada, conselho **ou** experiência no PQF); Ouro = + seguro; Diamante = + camada corporativa. Só o Bronze existe agora.
- Selo "Experiência no PQF": 10 serviços concluídos e avaliados por 10 clientes diferentes (Parte B). Também na Parte B: tempo de CNPJ e atividade compatível (CNAE x categoria).
- Interface: abas dentro de "Dados Profissionais", uma por conquista, com barra de evolução. Texto em termos de conquistas, nunca "perfil incompleto". Etapas futuras aparecem como "Em breve" e não contam. A barra é só visual e não altera a ordem na busca.
- Entrega única: Partes A e B validadas em teste, depois uma ida só para produção.
- Desvio do doc 19: a consulta de CNPJ fica numa **rota do app** (`/api/...`, com `getAdminClient()` em `lib/supabase/admin`, como `app/api/delete-account/route.ts`) e não numa Edge Function. Se o dono preferir Edge Function, trocar.

## O que falta (ordem sugerida)

Parte A:
1. `lib/cnpj`: validação com letras (módulo 11), normalização e máscara, com testes unitários (há runner no projeto; ver `app/cadastro/page.test.tsx`). Testar com o simulador da Receita.
2. Serviço de consulta (cascata BrasilAPI, minhareceita, ReceitaWS), cache, retirada do CPF da razão social de MEI e regra de comparação de nomes (sem acento nem maiúsculas). Código separado da tela e do banco (serviço, hook, componente).
3. Rota do app que valida, consulta, decide (aprova na hora ou envia para a fila) e grava com a chave de serviço em `prestador_cnpj` e `prestador_verificacoes`.
4. Fila de revisão no painel admin (ver `12-admin.md`): lista pendentes, aprova ou rejeita (o admin só altera `status`, `verificado_por`, `verificado_em`). Rejeitar ou revogar deve liberar o CNPJ (apagar a linha em `prestador_cnpj`).
5. Abas em "Dados Profissionais" (aba CNPJ primeiro) e barra de evolução.
6. Selo no card e no perfil público, lendo `selos_publicos()`; mostrar o nível por `nivel_do_prestador()`.
7. Testes E2E: semente com prestador e fila; **simular as APIs externas** no teste (não depender de BrasilAPI no CI); cobrir aprovação automática, envio à fila, rejeição e a barra.
8. Job de reconsulta do CNPJ: FEITO em 17/11 (cron da Vercel, não pg_cron; ver seção abaixo).

Parte B: FEITA em 17/11 no ambiente de teste (ver seção abaixo): selos de experiência, tempo de CNPJ e atividade compatível, e o nível Prata.

Liberação: abrir PR `homologacao` para `main` só com tudo validado; aplicar as migrações na produção na mesma ordem em que rodaram no teste.

## Ambiente de teste (como funciona)

- Projeto Supabase de teste: `qvrkmaavbrtjnwcaocax` ("procuro-quem-faca-teste"). Produção: `skhqvcluiacwujeeqefg`. **Nunca aplicar SQL de teste na produção.**
- Vercel: projeto `prj_qnjJJN1yAs2y4Teu7ypNsALd8wY7`, time `team_5MQfFYMMY5SedOolmHit6k75`. Previews usam o banco de teste (variáveis só de preview); produção usa o de produção. URL fixa da homologação: `https://procuro-quem-faca-git-homologacao-celionascimentos-projects.vercel.app`.
- E2E: `.github/workflows/e2e-homologacao.yml` roda em push na `homologacao` (imagem do Playwright; só `tests/e2e/homologacao`). O sandbox de desenvolvimento **não alcança** Vercel nem Supabase: o E2E só roda no GitHub Actions; ler o resultado com `gh run view <id> --log`. `gh pr create` não funciona (usar `gh api repos/.../pulls`). Criar branch por API retorna 403; usar clone e push.
- Contas fictícias (senha `Teste@1234`): `admin@`, `prestador@`, `cliente@pqf-teste.invalid`. Perfil público "Pedro Pedreiro Teste" (id 2, slug `pedro-pedreiro-teste-pedreiro-londrina`), projetos `1111…` (em execução), `2222…` (finalizado) e `3333…` (pronto para avaliar), perfis sem dono 4 a 9 com link pessoal. Identificadores em `tests/e2e/support/fixtures.ts`.
- Reset: `e2e_resetar_fixtures()` (chamado nos testes que gravam) devolve o banco à semente. SQL em `supabase/homologacao/reset_fixtures.sql` (**fora de** `supabase/migrations`). **Depois de qualquer migração nova ou mudança de semente: `select public.e2e_resetar_fixtures(); select public.e2e_capturar_baseline();` no banco de teste**, senão o reset não cobre o que mudou. O reset não recria contas de login apagadas; para teste com conta nova usar `e2e_criar_conta(email, senha)` (só `e2e-*@pqf-teste.invalid`).
- O banco de teste foi configurado com a confirmação de e-mail **desligada** (a produção não mudou). O app trata os dois modos.
- A tela de login às vezes não envia no celular com o clique; o helper reenvia com Enter. Vale investigar no código da tela.
- Aviso de cookies e aceite de Termos bloqueiam cliques em teste: helpers `dispensarAvisoDeCookies` e `aceitarDocumentosSeAparecer` em `tests/e2e/support/entrar.ts`.

## Cuidados com as ferramentas do Supabase (MCP)

- `apply_migration` pode demorar ou parar se o servidor pedir uma confirmação sem resposta; nesse caso parar e avisar o dono, que costuma resolver pedindo para tentar de novo. Nunca rodar duas migrações em paralelo.
- `execute_sql` com várias instruções devolve só o resultado da última.
- O Supabase barra `DELETE` sem `WHERE` e `DELETE` direto em `storage.objects`.

## Pendências fora dos selos

- Retomar contato com prestadores (mensagens prontas; cerca de 760 não-Londrina e 1 de Londrina com `nao_enviado`; tamanho do lote indefinido). Antes de ampliar o volume: revisão da Política e dos Termos pelo advogado.
- Preencher razão social e CNPJ em `config/controlador.ts` quando a empresa abrir.
- Consolidar as 28 regras de acesso de `prestadores` e as 6 de `cidades`; corrigir a política admin de `logs_atividades` (e-mail provisório).
- Registro de migrações e migração-base do banco (Etapa 6 do plano antigo de organização).
- Achado aberto: `controls.spec.ts` (suíte antiga, fora da homologação) é lento e pode ter falhas reais de acessibilidade.
- Atualizar o doc 19 com o ambiente de teste e a proteção contra senhas vazadas (indisponível no plano Free).

## Atualização (17/11, tarde)

**Feito no branch `homologacao` (último commit `b59e29a`, E2E verde com 62 testes):**
- Validação do CNPJ alfanumérico (módulo 11, valor = ASCII - 48). Sete exemplos do simulador (`XX.MVW.CSZ`) passam como casos de teste.
- Consulta em cascata (BrasilAPI, minhareceita, ReceitaWS), comparação de nomes, aprovação automática ou fila, e rota `POST /api/cnpj`.
- Cache das consultas em tabela `cnpj_consultas_cache` (24h), migration `20261117190000_cache_consulta_cnpj.sql`. Aplicada **só no banco de teste**; depois rodei `e2e_resetar_fixtures()` e `e2e_capturar_baseline()`.
- Testes E2E de CNPJ em `tests/e2e/homologacao/cnpj.spec.ts`: sem login (401), inválido (400), sem cadastro (422 ou 503, nunca aprovação), CNPJ real (200 com aprovada ou pendente) e repetição sem conflito.

**Achados:**
- A BrasilAPI respondia **403 à Vercel** com o User-Agent padrão do Node. Corrigido com User-Agent próprio (`ProcuroQuemFaca/1.0`), com teste automatizado. Depois da correção, não apareceram mais 403 nos logs de runtime, mas a amostra é pequena: continuar acompanhando.
- O cache em memória não é compartilhado entre instâncias serverless. Por isso a tabela no banco.
- O CNPJ `41.236.325/0001-55` responde 200 "pendente" porque o nome do prestador de teste ("Pedro Pedreiro Teste") não confere com a empresa. O caminho "aprovada" ainda não foi testado.

**Decisão a confirmar:** o cache guarda os nomes do QSA (sócios) por 24 horas, porque a conferência de nome precisa deles. São dados públicos, mas é dado pessoal. Se não for aceitável, a alternativa é guardar só o resultado da conferência.

**Pendências, em ordem:**
1. Caminho "aprovada": preciso de um nome que confira com a razão social, o fantasia ou um sócio do CNPJ real, para o prestador de teste.
2. Fila de revisão no painel admin (item 4).
3. Abas e barra em "Dados Profissionais" (item 5).
4. Selo no card e no perfil público (item 6).
5. Job de reconsulta: feito (item 8). Falta só validar em ambiente com CRON_SECRET (ver seção abaixo).
6. Parte B: selos de experiência, tempo de CNPJ e atividade compatível.

**Merge na `main`:** não feito. Só depois de tudo validado em teste.

Atualização (17/11, noite)

Caminho "aprovada": criada na semente do banco de teste a conta e2e-jorge@pqf-teste.invalid (senha Teste@1234) com o prestador "Jorge Paulo de Lima" (id 104; só o nome, sem telefone nem e-mail reais) para o CNPJ 47.403.170/0001-80 (MEI real, dado público). Baseline recapturado. Papel 'prestadorMei' em tests/e2e/support/ambiente.ts. Dois testes novos em cnpj.spec.ts: aprovação na hora e conflito de CNPJ já vinculado a outro prestador.
Achado (consulta real): a razão social do MEI vem como "47.403.170 JORGE PAULO DE LIMA", com os 8 dígitos-base do CNPJ no INÍCIO (não o CPF no fim, como o doc 19 supunha), e o QSA vem vazio. Por isso a conferência de nome dava "pendente". Corrigido em lib/cnpj/nomes.ts (remove o prefixo e o CPF no fim), com testes unitários.
Atenção ao recapturar o baseline: com a semente já certa, rodar só e2e_capturar_baseline(). Rodar e2e_resetar_fixtures() antes apaga o que ainda não está no baseline.
Risco aceito pelo dono: o teste consulta a Receita de verdade (se as fontes caírem, é pulado). O E2E com APIs simuladas continua pendente.

Atualização (17/11, noite, fila do admin)

Fila de revisão feita: migração 20261117210000_fila_revisao_cnpj.sql (só no banco de teste) com admin_fila_verificacoes(filtro) e admin_decidir_verificacao(id, decisao, motivo). Rejeitar/revogar apaga a linha de prestador_cnpj (libera o CNPJ); aprovar exige situação ATIVA e grava validade de 35 dias. Tela em /admin/verificacoes (abas Aguardando, Aprovadas, Rejeitadas; item "Selos (CNPJ)" no menu). Camadas: types/verificacoesAdmin.ts, lib/services/adminVerificacoes.service.ts, hooks/useAdminVerificacoes.ts, components/admin/verificacoes/VerificacaoCard.tsx.
Semente do banco de teste ganhou duas verificações pendentes (Pedro e Maria, CNPJs fictícios TESTE000000100 e TESTE000000200); baseline recapturado sem reset prévio. E2E: tests/e2e/homologacao/admin-verificacoes.spec.ts (login do admin via entrarComoAdmin).
Decisões tomadas por padrão (confirmar): (1) rejeitada não reabre; o prestador reenvia o CNPJ e a verificação volta a pendente; (2) o prestador ainda NÃO é avisado da decisão (aparece na aba CNPJ de "Dados Profissionais", item 5); (3) sem contador no menu e sem entrar no resumo diário de pendências por e-mail (a seguir).

Atualização (17/11, noite, abas e barra)

"Dados Profissionais" agora tem a barra de evolução no topo e duas abas: Meu perfil (o formulário de sempre, abre por padrão) e CNPJ. Atalho: /dashboard?aba=perfil&sub=cnpj. As próximas conquistas (Experiência no PQF, Tempo de CNPJ, Atividade compatível) aparecem na barra como "Em breve" e não contam no total. Texto da barra: "N de M selos conquistados"; nunca "incompleto".
Camadas: lib/selos/cnpjEstado.ts (fase do selo) e lib/selos/evolucao.ts (barra), lib/services/seloCnpj.service.ts, hooks/useSeloCnpj.ts, components/dashboard/dados-profissionais/ (DadosProfissionaisTabs, BarraEvolucao, AbaCnpj). A página do painel usa DadosProfissionaisTabs no lugar de EditarPerfilTab (que não mudou).
Fases da aba CNPJ: sem CNPJ (formulário), em conferência, conquistado ("CNPJ ativo, consultado em dd/mm/aaaa"), rejeitado e vencido (voltam ao formulário). O campo aceita letras e números com máscara e confere os dígitos antes de enviar.
Rota nova: DELETE /api/cnpj (botão "Remover meu CNPJ"): apaga prestador_cnpj e a verificação do próprio prestador; tira o selo e libera o número.
E2E: tests/e2e/homologacao/selo-cnpj-prestador.spec.ts. Decisão do dono: cada conteúdo em sua aba (Meu perfil, CNPJ, e as próximas).

Atualização (17/11, noite, selo para o cliente)

Selo no card e no perfil público feito, só no ambiente de teste. Decisões do dono: (1) o selo NÃO muda a ordem da busca (a regra antiga de `verificado` saiu de lib/ordenacao.ts); (2) card mostra "CNPJ ativo"; perfil mostra "Nível Bronze · CNPJ ativo, consultado em dd/mm" (nível vem de nivel_do_prestador(), data de selos_publicos()); (3) adesivos e cartão de visita não levam mais a palavra "Verificado".
Camadas: lib/selos/publico.ts (textos e agrupamento), lib/services/selosPublicos.service.ts (RPCs selos_publicos e nivel_do_prestador, cliente público), hooks/useSelosPublicos.ts (lote dos cards visíveis; useSeloDoPerfil), PrestadorCard (prop seloCnpj), ResultadosPaginados, PerfilHero (ícone no avatar), PerfilConfianca (item com nível e data). Falha na consulta de selos nunca quebra a lista nem o perfil.
E2E: tests/e2e/homologacao/selos-publicos.spec.ts (sem selo, aprovado, revogado) e ajudante tests/e2e/support/admin.ts (decide CNPJ como admin pelo banco de teste).
Pendente de limpeza: coluna prestadores.verificado (e o campo no tipo/queries) sai na migração posterior, junto com o fim da fase de teste.

Atualização (17/11, noite, reconsulta do CNPJ)

Decisões do dono: roda como cron da Vercel (não pg_cron: a cascata da Receita está em TypeScript e o projeto já usa cron da Vercel); CNPJ que deixou de estar ATIVO derruba o selo na hora e vai para a fila do admin (motivo situacao_nao_ativa); fontes fora do ar mantêm o selo e tentam de novo no dia seguinte; CNPJ ainda ATIVO só renova +35 dias, sem reconferir o nome.
Como funciona: rota /api/cron/cnpj-reverificacao (vercel.json, todo dia 10:00 UTC, protegida por CRON_SECRET). Seleciona selos que vencem em até 5 dias (20 por execução, os mais próximos primeiro), reconsulta com a mesma cascata e cache de 24h, e grava via função do banco. Depois marca como 'expirada' o que venceu sem renovar e apaga o cache vencido. Por rodar todo dia, "mensal" na prática: cada selo é reconsultado por volta do dia 30 e, se falhar, volta a tentar até vencer.
Banco (migração 20261117230000_reverificacao_cnpj.sql, só no banco de teste): cnpj_reverificacao_pendentes, cnpj_registrar_reverificacao (renovada | enviada_para_fila | ignorada; não mexe em selo que o admin já revogou), cnpj_expirar_vencidos, cnpj_limpar_cache. Todas só para service_role. Verificado no banco de teste numa transação descartada: renova (+35 dias), derruba para pendente, ignora o que não está aprovado e expira vencidos.
Código: lib/cnpj/reverificar.ts (lógica pura, com testes), app/api/cron/cnpj-reverificacao/route.ts (com testes). Aviso ao prestador: não existe sistema de notificações para ele; o aviso aparece na aba CNPJ ("A Receita não mostra o seu CNPJ como ativo. Por isso o selo foi pausado..."), com teste em AbaCnpj.test.tsx.
Pendente: não há E2E da rota (precisa de CRON_SECRET no ambiente de homologação e da Receita real). Antes do release: criar CRON_SECRET na Vercel de produção (já existe para os outros crons) e aplicar a migração 20261117230000 após as anteriores.

Atualização (17/11, noite, Parte B: selos calculados e nível Prata)

Decisões do dono: Experiência no PQF conta avaliação finalizada, visível, sem disputa, não oculta por garantia, nota efetiva >= 3 e de conta diferente da do prestador (10 serviços e 10 clientes diferentes); Tempo de CNPJ em faixas de 1, 3 e 5 anos (abaixo de 1 ano não há selo); Atividade compatível por tabela CNAE -> categoria; só a Experiência abre o Prata (Prata = Bronze + Experiência; Tempo e Atividade são informativos); selos não mudam a ordem da busca; o card continua mostrando só "CNPJ ativo".
Banco (migração 20261118000000_selos_experiencia_tempo_atividade.sql, só no banco de teste): tabela cnae_categorias (sem acesso pelo navegador) com semente de 46 mapeamentos; experiencia_no_pqf(bigint[]) devolve serviços, clientes e se atingiu; nivel_do_prestador() agora devolve prata; selos_publicos() ganhou os tipos experiencia, tempo_cnpj e atividade_compativel (mesma assinatura). Tudo é calculado na hora, nada é gravado: se uma garantia anular uma avaliação, o selo acompanha. Tempo e Atividade só aparecem com CNPJ aprovado e vigente; Experiência não depende do CNPJ. Já existe um gatilho no banco que impede o prestador de se auto-avaliar; a função ainda exclui a conta dele por garantia.
Verificado no banco de teste (transação descartada): 9 clientes não atinge, 10 atinge e dá Prata, nota efetiva 2 ou avaliação oculta por garantia derrubam para 9.
Código: config/selos.ts (metas e faixas, espelhando o banco), lib/selos/tempoCnpj.ts, publico.ts e evolucao.ts estendidos, services/selosPublicos.service.ts (buscarProgressoExperiencia), hooks/useExtrasEvolucao.ts, useSeloDoPerfil com complementares, PerfilConfianca (3 itens novos), BarraEvolucao (andamento "N de 10 clientes", estados Depende do CNPJ / Não se aplica / Em andamento). Barra agora conta 4 selos (CNPJ, Experiência, Tempo, Atividade); "Em breve" e "Não se aplica" ficam fora da conta.
PENDENTE DE REVISÃO DO DONO antes de produção: o mapeamento CNAE -> categoria (semente na migração) foi escrito de memória a partir da tabela CNAE e precisa ser conferido linha a linha. Categorias sem mapeamento: Massoterapia, Calheiro, Vidraceiro Automotivo, Ar Condicionado Automotivo (não ganham o selo de atividade, sem punição). Hoje só o CNAE principal é guardado; CNAEs secundários ficam para depois, se fizer falta (MEI costuma ter vários).
E2E: tests/e2e/homologacao/selos-calculados.spec.ts (8 testes) e support/selos.ts. Funções só do banco de teste, em supabase/homologacao/reset_fixtures.sql: e2e_semear_experiencia e e2e_ajustar_cnpj; o reset agora apaga primeiro as avaliações de contas criadas pelos testes (a FK com o Auth não tem cascata). Testes antigos da barra passaram de "0 de 1" para "0 de 4".
Liberação: aplicar em produção, na ordem, ...20261117230000 e depois 20261118000000 (e NUNCA as funções de supabase/homologacao/).

Checklist de release (ordem das migrações, verificações e plano de volta): ver `21-checklist-release-selos.md`.

Atualização (18/11, aceite dos termos na homologação)

Quem testava à mão na homologação via a tela "Antes de continuar" de novo a cada atualização: o reset do E2E (e2e_resetar_fixtures) devolvia a tabela consentimentos à semente (vazia) a cada teste, apagando o aceite. Correção só no banco de teste (supabase/homologacao/reset_fixtures.sql): consentimentos saiu do reset, então o aceite das contas fixas (admin, prestador, cliente, Jorge) é mantido; o das contas criadas pelos testes (e2e-*) é apagado no reset (a FK zera o user_id e o reset remove os órfãos), e essas contas novas continuam passando pela tela de aceite. Produção não tem reset e não foi afetada por isso.

## Atualização (18/11) — Ajuda e motivos do CNPJ

- Central de ajuda ganhou 3 artigos de selos (2 para prestador, 1 para cliente no perfil público). Ver `02-arquitetura.md`, seção Central de ajuda.
- A aba CNPJ do painel mostra, antes do campo, o bloco "Por que informar o CNPJ?" (só para quem ainda não informou) com link para o artigo. Motivos centralizados em `lib/selos/motivosCnpj.ts`.
- Testes: `lib/help/help-content.test.ts` (artigos, contextos, busca, e que o texto não promete ranking nem expõe o CNPJ) e `AbaCnpj.test.tsx`.

## Atualização (18/11) — Transparência das não indicações

- Pedido do Célio: o cliente precisa ser avisado quando o profissional tem muitas "não indico" em relação às indicações.
- Regras (decididas com o Célio): o perfil mostra sempre o placar completo (indicam x não indicam, totais reais e não só as 10 últimas avaliações); aviso neutro quando há 3 ou mais avaliações e 30% ou mais são "não indico": "Neste perfil, X de Y clientes não indicam. Leia as avaliações antes de contratar."
- Os selos continuam aparecendo junto do placar (selo confirma só o que foi conferido). Nada muda na ordem da busca.
- Código: `lib/avaliacoes/transparencia.ts` (regra pura + testes), `usePerfilPrestador` (conta `indica = false`), `PerfilConfianca` (placar e aviso), `PerfilAvaliacoes`/`PerfilTabs` (cabeçalho com totais reais).
- Fora desta entrega (não escolhido): placar no card da busca e lembrete antes do WhatsApp.

## Atualização (18/11) — Admin não edita perfil de outras pessoas

- Auditoria de RLS: a policy de UPDATE amplo do admin em `prestadores` foi removida (migration `20261118120000`, aplicada só no teste). Admin continua moderando por tabelas e funções próprias. Detalhes no doc 21.

## Atualização (18/11) — CNPJ não ativo e nome completo da conta

- Decidido com o Célio: CNPJ que não está ATIVO não vai mais para a fila do admin. No envio, o prestador recebe na hora "A Receita Federal mostra este CNPJ como [situação]. Regularize a situação do CNPJ e tente novamente." e nada é gravado (`lib/cnpj/verificar.ts`, `lib/cnpj/situacao.ts`).
- Na reverificação diária, CNPJ aprovado que deixa de ser ATIVO tem o selo pausado (status 'expirada', motivo `situacao_nao_ativa`, sem fila) e a aba CNPJ mostra "Seu selo está pausado" pedindo para regularizar e informar de novo. Migration `20261118130000_cnpj_inativo_sem_fila.sql` (retorno da função passa de `enviada_para_fila` para `selo_pausado`; resumo do cron: `selosPausados`).
- Aprovação automática agora compara razão social, fantasia e sócios com o nome do perfil OU o nome completo da conta (`profiles.full_name`), para quem usa nome de trabalho. Decidimos NÃO criar campo livre "nome no CNPJ", porque razão social e sócios são dados públicos e qualquer pessoa poderia copiá-los.
- Casos antigos já na fila com motivo `situacao_nao_ativa` continuam sendo mostrados; podem ser rejeitados pelo admin.

## Atualização (18/11) — Reverificação em ritmo das fontes (3 por minuto)

- Como era: 1 chamada por dia (cron da Vercel), até 20 CNPJs em sequência, sem pausa. Um limite (HTTP 429) era tratado como falha comum: tentava a próxima fonte e seguia para o próximo CNPJ, gastando até 60 chamadas nas mesmas fontes limitadas.
- Como ficou (decidido com o Célio): cada chamada faz no máximo 3 consultas. Ao receber 429, o lote PARA na hora, sem insistir e sem marcar o que sobrou como falha; a próxima chamada (1 minuto depois) continua pelos que vencem primeiro. Também para de começar consultas depois de 40 s (a função vive 60 s).
- Agendador: `supabase/ops/agendar_reverificacao_cnpj.sql` (pg_cron + pg_net + Vault), a rodar uma vez em cada ambiente. O banco só chama o app quando há selo a reconsultar, então sem trabalho não há chamada externa nem invocação. Expiração de selos vencidos e limpeza do cache rodam direto no banco, uma vez por dia.
- O cron diário da Vercel continua em `vercel.json` como rede de segurança (3 por dia, idempotente).
- Ainda falta no ambiente de teste/produção: rodar o script (precisa da URL do app e do CRON_SECRET) e conferir em `cron.job_run_details`.

## Atualização (18/11) — Revisão do mapeamento CNAE e "ainda não sabemos"

- Revisão com o Célio: Manicure corrigida de 9602502 para 9602501 (manicure e pedicure ficam junto com cabeleireiros; 9602502 é estética). Corrigido na seed da migration `20261118000000` (ainda não foi para produção) e no banco de teste. Insulfilm e Som/Alarme Automotivo seguem compartilhando 4520007 (decidido: tudo bem).
- Categorias sem CNAE cadastrado (Massoterapia, Calheiro, Vidraceiro Automotivo, Ar Condicionado Automotivo): em vez de dizer que a atividade "não combina", o painel diz "Ainda não sabemos qual atividade de CNPJ combina com a sua categoria" e oferece o botão "Contar qual CNAE eu uso" (WhatsApp do PQF com mensagem pronta). Novo estado `nao_sabemos` (não entra na conta dos selos). Só aparece no painel do prestador, nunca para o cliente.
- Banco: migration `20261118140000_categoria_sem_mapeamento_cnae.sql` (função `categoria_sem_mapeamento_cnae`, devolve só verdadeiro/falso; falso para quem não tem categoria). Aplicada só no teste.
- Aguardando: CNAE principal do CNPJ 29.867.943/0001-06 (cunhado do Célio; Insulfilm e ar condicionado) para conferir qual selo de atividade ele recebe.
- O selo compara só o CNAE principal; quem tem a atividade como secundária não ganha o selo (item futuro: CNAEs secundários).
- Erro achado na revisão (print do cnpj.biz de um CNPJ real): 4520003 é manutenção ELÉTRICA e 4520002 é lanternagem/funilaria e pintura. A seed tinha os dois trocados; corrigido na migration `20261118000000` e no banco de teste (Auto Elétrica = 4520003; Funilaria e Pintura = 4520002).

## Atualização (18/11) — Todas as atividades do CNPJ e nível visível

- Decidido com o Célio: o selo "Atividade registrada no CNPJ compatível com a categoria do perfil" considera o CNAE principal E os secundários (como a Receita Federal considera). Texto antigo ("Atividade do CNPJ compatível...") substituído.
- Consulta: `DadosCnpj.cnaesSecundarios` (códigos de 7 dígitos, sem repetição, ignora "0000000"), lido de BrasilAPI/minhareceita (`cnaes_secundarios[].codigo`) e ReceitaWS (`atividades_secundarias[].code`). Consultas antigas do cache vêm sem o campo e valem como lista vazia.
- Banco: migration `20261118150000_cnaes_secundarios.sql` (coluna `prestador_cnpj.cnaes_secundarios text[]` + `selos_publicos` recriada). Só os códigos são guardados. Os CNAEs secundários só são gravados no envio do CNPJ; a reverificação ainda atualiza apenas a situação (item futuro).
- Ambiente de teste: o reset do E2E restaura `prestador_cnpj` a partir de `e2e_baseline`; a coluna nova precisa existir também lá (`alter table e2e_baseline.prestador_cnpj add column cnaes_secundarios ...`) e `e2e_ajustar_cnpj` ganhou o parâmetro `p_secundarios` (ver `supabase/homologacao/reset_fixtures.sql`).
- Nível visível: o painel (Dados Profissionais → "Seus selos de confiança") mostra "Seu nível: Bronze/Prata/Sem nível ainda" com cor própria e o que falta para o próximo. O perfil público mostra o mesmo selo colorido ("Nível Bronze/Prata"). Helper único em `lib/selos/nivel.ts` (Bronze cobre/âmbar, Prata cinza-azulado). O card da busca segue só com "CNPJ ativo".

## Atualização (18/11, tarde) — Ar condicionado automotivo e lista de CNAEs no painel

- Conferido pelo Célio no Google/IBGE: Ar Condicionado Automotivo = CNAE 4520-0/07 (acessórios para veículos automotores; mesmo código de Insulfilm e Som/Alarme). Mapeado na migration `20261118160000_cnaes_detalhe_e_ar_automotivo.sql`. Restam sem CNAE: Massoterapia, Calheiro, Vidraceiro Automotivo (seguem com "ainda não sabemos").
- Painel do prestador (aba CNPJ, abaixo dos dados do CNPJ aprovado): seta "Atividades registradas no CNPJ (N)" que abre e fecha. Mostra código formatado (4520-0/07), descrição, "Principal" e "Combina com o seu perfil". Componente `CnaesDoCnpj`, lista montada por `lib/cnpj/cnaes.ts`.
- Banco: coluna `prestador_cnpj.cnaes_detalhe jsonb` (códigos + descrição das secundárias, só para exibir) e função `cnaes_compativeis_do_prestador(prestador_id)` (só o dono do perfil recebe resposta). CNPJs aprovados antes desta versão só mostram as secundárias depois de informar o CNPJ de novo.
- Teste: o baseline do E2E (`e2e_baseline.prestador_cnpj`) recebeu as colunas `cnaes_secundarios` e `cnaes_detalhe`.

## Atualização (18/11, fim da tarde) — Borda da cor do nível (busca, perfil e painel)

- Decidido com o Célio: a caixa de selos do painel, a caixa de confiança do perfil público e a FOTO do card da busca ganham borda da cor do nível (Bronze cobre/âmbar, Prata cinza-prata). Sem nível: borda neutra de sempre (não parece penalização). Perfil com aviso de não indicações (30%+) mantém a cor do nível, com o aviso e o placar logo abaixo.
- Acessibilidade: o card da busca ganhou um selinho com o nome do nível ("Bronze"/"Prata") além da borda. No perfil e no painel o nome do nível já aparece em texto.
- Cores e nomes ficam em `lib/selos/nivel.ts` (`borda`, `bordaForte`, `classes`). A foto usa `bordaForte` (Tailwind `!`) porque o ícone da área já traz uma borda própria.
- Banco: migration `20261118170000_niveis_dos_prestadores.sql` cria `niveis_dos_prestadores(ids)` (nível de vários de uma vez) e `nivel_do_prestador(id)` passa a usá-la: a regra do nível agora existe num só lugar. O card da busca busca o nível junto com os selos, por lote de cards visíveis.
- Os selos continuam sem mudar a ordem da busca.

- Tag de não indicações (decidido com o Célio): tag âmbar suave "3 de 10 não indicam" no card da busca e no perfil público, pela MESMA regra do aviso (3 ou mais avaliações e 30% ou mais não indicam); fora dela o card não mostra nada de indicação. Regra em `lib/avaliacoes/transparencia.ts` (`textoTagNaoIndicam`, com teste de que tag e aviso sempre concordam). Banco: migration `20261118180000_placar_indicacoes_dos_prestadores.sql` (contagens em lote; só avaliações visíveis, como o perfil). Hook `usePlacarIndicacoes`.

## Atualização (18/11, noite) — Ajuda só onde é relevante (painel do prestador)

- Antes: um bloco único de ajuda (contexto `dashboard-prestador`) aparecia em quase todas as abas, com 11 atalhos misturados (divulgação aparecia até em CNPJ).
- Agora (`lib/help/ajuda-do-painel.ts`, com teste): Meus Trabalhos = portfólio + garantia; Desempenho = avaliações + garantia; Divulgação = os 4 artigos de divulgação; Dados Profissionais → Meu perfil = editar perfil + ativação/bloqueio; Dados Profissionais → CNPJ = só selos e CNPJ. A ajuda de Dados Profissionais é mostrada pela própria aba (`DadosProfissionaisTabs`), porque muda entre Meu perfil e CNPJ. Teste garante: divulgação só em Divulgação, selos só em CNPJ, no máximo 4 atalhos por bloco.
- Os contextos antigos (`dashboard-prestador`, `dados-profissionais`) continuam nos artigos, para links e o chat de ajuda existentes. Sem mudança de banco.

## Atualização (18/11, noite) — Tag em porcentagem e fim do aviso grande

- Decidido com o Célio: o texto grande "Neste perfil, X de Y clientes não indicam. Leia as avaliações antes de contratar." foi REMOVIDO do perfil (repetia o placar e a tag). A transparência fica no placar completo (7 indicações / 3 não indicam) e na tag âmbar, que agora mostra a porcentagem: "30% não indicam" (perfil e card da busca).
- Regra inalterada: 3 ou mais avaliações e 30% ou mais "não indico", calculada sobre os números reais (não sobre a porcentagem arredondada). `avisoNaoIndicacoes` deixou de existir; só `textoTagNaoIndicam` em `lib/avaliacoes/transparencia.ts`.

## Ajustes de interface do painel (lote após homologação)
- Faixa "Últimos 7 dias" aparece em **todas** as abas do painel; a faixa é idêntica em todas (mesma seta). Em Desempenho a seta rola até o conteúdo (`#conteudo-painel`); nas outras leva a Desempenho. Assim a barra de abas não "pula" ao trocar de aba.
- Botão "Ver meu perfil" agora é compacto (branco, borda cinza, ícone) na mesma linha do título "Meu painel" (também no celular), visível em todas as abas (`data-testid="ver-perfil-publico"`). Removidos o botão grande de Meus Trabalhos e o duplicado do cabeçalho de Editar Perfil.
- Vitrine de fotos: botão de remover é círculo branco com lixeira vermelha.
- Divulgação: sub-aba selecionada em azul (`bg-blue-600`), igual às abas principais.
- Perfil público, "Fotos do profissional": faixa de miniaturas centralizada (wrapper `justify-center` + faixa interna rolável, `data-testid="miniaturas-fotos"`).

## Auditoria de rotas e acesso (18/11, noite)
Feita sobre o código e o banco de TESTE (produção não é acessível daqui; repetir as consultas lá antes do release).
- **Corrigido:** `GET /api/anuncios/metricas` lia métricas de anúncios com a chave de serviço **sem exigir login** (qualquer pessoa na internet). Agora exige login e `perfis_admin` (401/403), com teste (`route.test.ts`). O `POST` (registrar impressão/clique) continua público de propósito; risco residual: inflar métricas.
- **OK:** todas as rotas `/api/admin/*`, `/api/cnpj`, `/api/delete-account`, `/api/prestadores/meus-cliques`, `/api/garantia/promover-fotos` checam usuário (e admin quando cabe); as rotas `/api/cron/*` exigem `Bearer CRON_SECRET`; as funções `admin_*`, `anonimizar_dados_titular` e `excluir_prestador_titular` checam admin por dentro e não são executáveis por `anon`. `/dashboard`, `/admin`, `/acompanhamento`, `/avaliar` e `/cadastro` são protegidos no `proxy.ts`.
- **Atenção (decidir/verificar):**
  1. `/painel/perfil`, `/meus-servicos`, `/meus-dados`, `/titular` e `/denunciar` **não passam pelo `proxy.ts`**: a proteção é só no cliente (tela de login / hook) e nas regras do banco. Os dados estão protegidos pelas regras do banco, mas quem está deslogado vê a "casca" da página em vez de ser redirecionado. Sugestão: incluir `/painel` e `/meus-servicos` no `proxy.ts`.
  2. Tabela `perfis` (legada, **sem uso no código**): legível por qualquer pessoa (nome, WhatsApp, cidade, bairro) e com INSERT/UPDATE/DELETE concedidos a `anon` (as regras de linha limitam, mas a superfície é desnecessária). No teste está vazia; **conferir em produção** (contagem e conteúdo) e, se sem uso, fechar a leitura pública.
  3. `prestadores` é legível por todos, inclusive linhas pendentes/bloqueadas e a coluna `user_id`; `portfolio_projetos` expõe `cliente_user_id`. Hoje a interface só lista aprovados, mas a API direta mostra tudo. Avaliar restringir por status e esconder `user_id`.
  4. `logs_atividades` tem 3 políticas de INSERT públicas e duplicadas (`with check true`): qualquer pessoa pode gravar logs (poluição/abuso). Consolidar numa só, com limite.
  5. Funções `e2e_*` aparecem como executáveis por `anon` **no banco de teste** (só existem lá e recusam rodar sem o marcador); confirmar que **não existem em produção**.
  6. Proteção contra senhas vazadas desligada (plano Free).
