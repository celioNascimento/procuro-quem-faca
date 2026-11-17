# 20. Passagem de conversa: Etapa 2 (selos, CNPJ) e ambiente de teste

Atualizado em 17/11/2026. Este documento deixa a próxima conversa seguir do mesmo ponto. Leia junto com `19 - PQF plano de confiança e conformidade.md` (plano e decisões) e `16-homologacao-e2e.md` (ambiente de teste).

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
8. Job mensal (pg_cron, já instalado no banco de teste) para reconsultar e expirar o selo de CNPJ suspenso.

Parte B: selos de experiência (10 serviços, 10 clientes), tempo de CNPJ e atividade compatível, mais o cálculo do nível Prata.

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
