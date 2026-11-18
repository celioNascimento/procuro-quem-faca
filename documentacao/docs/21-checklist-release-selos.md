# 21 — Checklist de release: selos de confiança (Etapa 2)

Preparado em 17/11/2026. Escopo: PR `homologacao` -> `main` com a Etapa 2 inteira (Parte A: CNPJ; Parte B: selos calculados e nível Prata). A `main` está no merge do PR #223 (13:46 de 17/11); a diferença é de 12 commits e 80 arquivos, todos desta etapa.

Regra: nada daqui vai para produção antes de o dono conferir os itens marcados **DECISÃO** e **CONFERIR**. Quem executa os passos no banco de produção é o dono (ou quem ele autorizar): a sessão de desenvolvimento não tem acesso de leitura nem de escrita a ele.

## 0. Estado atual

- (Atualizado em 18/11: a lista de migrações abaixo está incompleta; a ordem completa de produção está no doc 20, "Resumo do estado em 18/11", e inclui 20261118120000 a 190000 (a 190000 é a de segurança, a última), exceto 160000, que é só de teste.)
- Branch `homologacao` no commit `e4a62de` (historico de 17/11). CI verde; E2E de homologação: 105 passaram, 1 instável (fila do admin, revogar selo; passa na repetição), 0 falhas.
- Banco de teste (`qvrkmaavbrtjnwcaocax`) já tem todas as migrações abaixo, aplicadas nesta ordem.
- Produção (`skhqvcluiacwujeeqefg`): a última migração registrada é `20261115210740_rls_denuncias_comentarios_geografia`. Nenhuma migração da Etapa 2 foi aplicada.

## 1. Bloqueios a resolver antes de abrir o PR

1. **Crons na Vercel (sem bloqueio, só conferir).** `vercel.json` passa de 2 para 3 crons (`resumo-pendencias`, `garantia-prazos` e o novo `cnpj-reverificacao`, às 10:00 UTC). Segundo a documentação atual da Vercel (conferida em 17/11/2026), o limite é de 100 crons por projeto em todos os planos; o antigo teto de 2 no plano Hobby deixou de valer em janeiro de 2026. O que ainda vale no Hobby é a frequência mínima de 1 execução por dia, e o horário pode variar dentro da hora marcada. O novo cron roda uma vez por dia, então atende. Se o deploy recusar o `vercel.json`, a mensagem de erro indica o motivo; nesse caso a saída é juntar a reconsulta do CNPJ a uma das rotas de cron existentes.
2. **Mapeamento CNAE -> categoria (DECISÃO).** A semente de `20261118000000` (46 linhas) foi escrita de memória e precisa de revisão linha a linha. Ela entra em produção junto com a migração. Quatro categorias ficam sem mapeamento (Massoterapia, Calheiro, Vidraceiro Automotivo, Ar Condicionado Automotivo): não ganham o selo de atividade, sem punição. A migração casa por `categorias.nome`; nomes diferentes em produção ficam silenciosamente sem mapeamento (ver consulta 2.3).
3. **Variável `CRON_SECRET` na Vercel de produção (CONFERIR).** Já usada pelos outros dois crons; confirmar que existe no ambiente Production. Sem ela, a rota recusa tudo e o job não roda.
4. **Pendências anteriores no banco de produção (CONFERIR).** A lista de migrações de produção não traz estas quatro, que existem no repositório e já estão na `main`: `20261113090000_cadastro_no_ar_sem_aprovacao_manual`, `20261113120000_dados_do_cliente_parte1_funcoes`, `20261113120100_dados_do_cliente_parte2_fecha_leitura`, `20261113150000_exemplo_de_descricao_por_categoria` e `20261115232000_regiao_grande_cascavel`. Podem ter sido aplicadas sem registro, ou nunca aplicadas. Conferir pelos efeitos (consultas 2.1 e 2.2). Se faltarem, **não** fazem parte deste release: tratar à parte e antes, porque o código da `main` já depende delas.

## 2. Consultas só de leitura para rodar em produção (SQL Editor)

```sql
-- 2.1 Pendências anteriores: coluna de exemplo por categoria e região Grande Cascavel
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='categorias' and column_name='exemplo_descricao') as coluna_exemplo_descricao,
  (select count(*) from public.regioes where nome ilike '%cascavel%') as regiao_cascavel;

-- 2.2 Funções do cliente (dados_do_cliente) existem?
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and proname ilike '%cliente%' order by 1;

-- 2.3 Pré-requisitos desta etapa
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='is_admin') as is_admin,
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='avaliacoes'
      and column_name in ('oculta_por_garantia','nota_efetiva','em_disputa')) as colunas_avaliacoes_esperado_3,
  (select string_agg(nome, ' | ' order by nome) from public.categorias) as categorias_de_producao;
```

Comparar `categorias_de_producao` com os nomes usados na semente de `20261118000000` (mesmas 39 categorias do banco de teste: Alinhamento e Balanceamento, Ar Condicionado, ..., Vidraceiro Automotivo). Categoria com nome diferente não recebe mapeamento.

## 3. Ordem de execução

1. **Backup.** Confirmar que existe backup/ponto de restauração recente do projeto de produção (Supabase > Database > Backups).
2. **Aplicar as migrações em produção, nesta ordem exata** (SQL Editor ou `apply_migration`, uma de cada vez, conferindo "success" antes da próxima):
   1. `20261117150000_verificacoes_e_cnpj.sql`
   2. `20261117190000_cache_consulta_cnpj.sql`
   3. `20261117210000_fila_revisao_cnpj.sql`
   4. `20261117230000_reverificacao_cnpj.sql`
   5. `20261118000000_selos_experiencia_tempo_atividade.sql`

   **Nunca** aplicar nada de `supabase/homologacao/` (funções `e2e_*`, `reset_fixtures.sql`): são só do banco de teste e se recusam a rodar sem o marcador de homologação.
3. **Aplicar as migrações ANTES do deploy do código.** O código novo chama funções que só existem depois delas; o código antigo não as usa, então a ordem "banco primeiro, código depois" nunca quebra o site no meio.
4. Abrir o PR `homologacao` -> `main`, esperar CI verde, fazer o merge. O deploy da Vercel de produção sai do merge.
5. Conferir o deploy (seção 4).

## 4. Verificação depois do release

No banco (leitura):
```sql
select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and proname in
  ('selos_publicos','nivel_do_prestador','experiencia_no_pqf','admin_fila_verificacoes','admin_decidir_verificacao',
   'cnpj_reverificacao_pendentes','cnpj_registrar_reverificacao','cnpj_expirar_vencidos','cnpj_limpar_cache')
 order by 1;                                  -- esperado: 9 linhas
select count(*) from public.cnae_categorias;  -- esperado: 46 (ou o que sobrar da revisão)
select has_function_privilege('anon', 'public.cnpj_limpar_cache()', 'execute');  -- esperado: false
```

No site (sem criar dados falsos em produção):
- Perfil público de qualquer prestador carrega normalmente (sem selo, e sem erro).
- Busca lista os cards normalmente; só aparece "CNPJ ativo" para quem tiver o selo.
- `/admin/verificacoes` abre para o admin e mostra a fila vazia.
- Dashboard do prestador > Dados Profissionais abre as duas abas (Meu perfil | CNPJ) e a barra de evolução.
- O primeiro cron real roda às 10:00 UTC do dia seguinte: conferir em Vercel > Logs que `/api/cron/cnpj-reverificacao` respondeu 200 com `{ ok: true, analisados: 0, ... }` (ainda não há selos para renovar).
- Teste real com um prestador de verdade (ex.: Jorge Paulo de Lima, CNPJ 47.403.170/0001-80): informar o CNPJ na aba CNPJ e conferir a aprovação automática e o selo no perfil. É dado real e público; fazer só com autorização do prestador.

## 5. Plano de volta (se algo der errado)

- **Código:** reverter o merge no GitHub (Revert do PR) ou promover o deploy anterior na Vercel. O banco novo é compatível com o código antigo (só adiciona tabelas e funções; `selos_publicos` e `nivel_do_prestador` mantêm assinatura).
- **Banco:** não há migração destrutiva nesta etapa. Se for preciso desfazer, as tabelas novas (`prestador_verificacoes`, `prestador_cnpj`, `cnpj_consultas_cache`, `cnae_categorias`) podem ficar vazias sem efeito. As funções antigas `selos_publicos` e `nivel_do_prestador` não existiam antes; não há versão anterior para restaurar.
- **Selo errado para um prestador:** o admin revoga em `/admin/verificacoes` (aba Aprovadas); isso libera o CNPJ.

## 6. Itens abertos que NÃO bloqueiam o release

- **Nomes de sócios no cache por 24h (DECISÃO):** o cache de consultas guarda os nomes do quadro societário por 24h para conferir o nome do prestador. É dado pessoal; limpeza diária pelo cron já remove o vencido. Decidir se mantém assim ou se passa a guardar só o resultado da conferência.
- **CNAEs secundários:** só o principal é guardado. MEI costuma ter vários; se muitos prestadores legítimos ficarem sem o selo de atividade, incluir os secundários na consulta.
- **Aviso ao admin da fila de selos:** hoje o admin precisa abrir `/admin/verificacoes`. Sugestão: incluir a contagem no resumo diário por e-mail.
- **Aviso ao prestador:** não existe sistema de notificações para o prestador; o aviso de selo pausado aparece só na aba CNPJ.
- **Coluna `prestadores.verificado`:** sem uso na tela; remover numa migração posterior, depois de confirmar que nada lê o campo.
- **Teste instável** `admin-verificacoes.spec.ts:62` (revogar selo): passou na repetição; vale investigar se voltar a oscilar.

## Adendo (18/11) — migration de segurança do admin

- `20261118120000_admin_nao_edita_prestador.sql`: remove a policy "Admin pode atualizar qualquer prestador" (admin podia alterar qualquer campo de qualquer prestador pelo navegador). Aplicar em produção DEPOIS das 5 migrations dos selos. Antes, conferir no painel de produção que ativação, bloqueio e decisão de CNPJ continuam funcionando (não dependem dessa policy). Teste automatizado: `tests/e2e/homologacao/admin-nao-edita-prestador.spec.ts`.
- Reaplicar nome do Pedro (id 2) para teste manual do CNPJ real: o reset do E2E devolve "Pedro Pedreiro Teste" a cada push.
- `20261118130000_cnpj_inativo_sem_fila.sql`: CNPJ não ativo na reverificação pausa o selo em vez de ir para a fila. Aplicar em produção logo depois de `20261117230000` (ordem final: 150000, 190000, 210000, 230000, 20261118000000, 20261118120000, 20261118130000).
- Agendador da reverificação: rodar `supabase/ops/agendar_reverificacao_cnpj.sql` em produção (troca URL e segredo; confirma `cron.job` e `cron.job_run_details`). Sem isso, só o cron diário da Vercel renova (3 por dia).
- `20261118180000_placar_indicacoes_dos_prestadores.sql`: contagem de indicam/não indicam em lote para a tag do card.
- `20261118170000_niveis_dos_prestadores.sql`: nível em lote para os cards da busca; `nivel_do_prestador` passa a usar a mesma regra.
- `20261118160000_cnaes_detalhe_e_ar_automotivo.sql`: mapeia Ar Condicionado Automotivo (4520007), guarda a descrição dos CNAEs secundários e cria `cnaes_compativeis_do_prestador`. NÃO mexe no e2e_baseline (só existe no teste).
- `20261118150000_cnaes_secundarios.sql`: coluna de CNAEs secundários e `selos_publicos` considerando todas as atividades do CNPJ.
- `20261118140000_categoria_sem_mapeamento_cnae.sql`: função para o aviso "ainda não sabemos" no painel. Ordem final das migrations em produção: 20261117150000, 190000, 210000, 230000, 20261118000000 (já com Manicure em 9602501), 120000, 130000, 140000, 150000 (`cnaes_secundarios`), 160000 (`cnaes_detalhe_e_ar_automotivo`), 170000 (`niveis_dos_prestadores`), 180000 (`placar_indicacoes_dos_prestadores`). Depois, o script do agendador.
