# Banco de Dados — PQF

Banco Postgres via Supabase, com Row Level Security (RLS) habilitado nas tabelas de domínio sensível (avaliações, fotos, comentários).

## Diagrama de relacionamento (visão simplificada)

```
auth.users
   │
   ├─── prestadores (user_id) ──┬── portfolio_projetos ──┬── portfolio_fotos ── portfolio_comentarios
   │                            │                         ├── avaliacoes
   │                            │                         ├── portfolio_curtidas
   │                            │                         ├── contestacoes
   │                            │                         └── projeto_logs
   │                            ├── denuncias
   │                            └── categoria_id / grupo_id / cidade_id / regiao_id
   │
   ├─── perfis (id)
   ├─── profiles (id)
   └─── perfis_admin (user_id)

categorias_grupos ── categorias
estados ── regioes ── cidades

auth.users ── anunciantes ── anuncios ── anuncios_metricas_diarias
                                 │
                                 └── (segmentado por cidade_id, categoria_id, grupo_id, estado_sigla)
```

## Tabelas por domínio

### Identidade e perfil

| Tabela | Propósito |
|---|---|
| `prestadores` | Perfil de prestador de serviço — dados profissionais, status, ativação |
| `perfis` | Dados complementares de perfil — **provável legado, ver observação abaixo** |
| `profiles` | Dados complementares de perfil, **incluindo `role`** (`cliente`/`prestador`) — confirmada como tabela ativa |
| `perfis_admin` | Controle de acesso administrativo (`owner`, `moderator`, `editor`) |

> ✅ **Resolvido: `profiles` é a tabela ativa.** Confirmado ao revisar o fluxo de onboarding (`app/auth/callback/route.ts`, `hooks/useLoginForm.ts`) — ambos leem/escrevem em `profiles.role` ativamente, campo que não existe em `perfis`. `perfis` não apareceu em nenhum fluxo de código revisado até agora. **Ação recomendada:** confirmar no Supabase se `perfis` tem alguma linha de dado real ou uso residual antes de descontinuar; se estiver vazia/não referenciada, remover do schema evita confusão futura sobre qual tabela usar para novos campos de perfil.

### `prestadores`

Tabela central do domínio profissional.

**Campos-chave:**
- `status` (`pendente` | `ativo` | outros) — controla se o prestador aparece publicamente e se é redirecionado para completar cadastro
- `ativacao_status` — funil de ativação via WhatsApp: `nao_enviado` → `enviado` → `respondeu_positivo`/`respondeu_negativo`/`sem_whatsapp` → `perfil_completo` → `avaliacao_recebida`
- `origem_tipo` — `registro_direto` (auto-cadastro), `curadoria_publica` (curadoria manual inicial), `reivindicado`, e **`vitrine`** (ver nota abaixo — valor de prioridade máxima na busca, ainda a documentar formalmente)
- `slug` — usado na URL pública (`/[slug]`)
- `bloqueado` + `motivo_bloqueio` — moderação
- `verificado` — selo de confiança

> ⚠️ **`origem_tipo: 'vitrine'`** — encontrado em uso real no hook `usePrestadores` (prestadores com esse valor aparecem sempre no topo da busca, sem passar pelo filtro de termo). Não havia constraint/check visível para esta coluna no schema levantado, então não há validação de banco impedindo outros valores livres. Significado exato de negócio (destaque pago? curadoria editorial?) ainda não confirmado — ver `07-roadmap.md`.

**Índices:** `slug` (unique), `user_id` (unique — um prestador por usuário), `ativacao_status`.

### Localização geográfica

| Tabela | Propósito |
|---|---|
| `estados` | UF (sigla + nome) |
| `regioes` | Região dentro de um estado |
| `cidades` | Cidade, vinculada a região e estado, com flag `ativa` |

Prestadores referenciam `cidade_id` e `regiao_id`; também têm `cidades_atendidas` (array de texto) para atendimento em múltiplas cidades sem relação normalizada.

### Categorização

| Tabela | Propósito |
|---|---|
| `categorias_grupos` | Agrupamento de alto nível (ex: "Casa", "Tecnologia"), com ícone e ordem de exibição |
| `categorias` | Categoria específica de serviço, vinculada a um grupo, com flag `destaque` |

### Portfólio e execução de serviço

| Tabela | Propósito |
|---|---|
| `portfolio_projetos` | Um projeto/serviço contratado — status, cliente, token de avaliação |
| `portfolio_fotos` | As 3 fotos (antes/durante/depois) de um projeto, com legenda |
| `portfolio_comentarios` | Comentários no projeto, de cliente ou prestador (`autor_tipo`) |
| `portfolio_curtidas` | Curtidas de usuários autenticados em projetos (portfólio público) |
| `projeto_logs` | Log de ações realizadas em um projeto (auditoria) |

**`portfolio_projetos.status`** — valores confirmados em uso real no código: `em_registro` → `pendente` → `em_execucao` → `finalizado`. **`'concluido'` NÃO é um valor válido** — foi encontrado como bug em múltiplos pontos do frontend (ver `05-modulos.md`, seção Painel do Cliente) comparando contra esse valor inexistente; o valor correto gravado no banco é sempre `finalizado`.

**`avaliacao_token`** — UUID único por projeto, usado para o cliente acessar a página de avaliação sem precisar de login.

### Avaliação e confiança

| Tabela | Propósito |
|---|---|
| `avaliacoes` | Avaliação do cliente sobre o prestador, vinculada a um projeto |
| `contestacoes` | Contestação de uma avaliação, com evidência fotográfica |
| `denuncias` | Denúncia de um prestador (fora do contexto de avaliação) |

**`avaliacoes` — campos-chave:**
- `nota` (1–5, com check constraint)
- `indica` (boolean) — se o cliente recomendaria o prestador
- `visivel` — controla exibição pública (permite moderação antes de publicar)
- `status` (`pendente` e outros) — fluxo de moderação
- `em_disputa` — sinaliza avaliação contestada
- `resposta_prestador` — direito de resposta do prestador
- Trigger `trigger_bloquear_auto_avaliacao` — impede que o próprio prestador se autoavalie

**Fluxo de contestação confirmado em código** (`FormularioAvaliacao.tsx`, ativo): ao marcar "Reportar problema / Solicitar Garantia", a avaliação é gravada com `em_disputa: true`, `visivel: false` (nota forçada a mínima), e uma linha correspondente é criada em `contestacoes` com a descrição e fotos de evidência (via `FotosEvidenciaPicker`, upload múltiplo limitado por `MAX_ARQUIVOS`). Contestações ficam ocultas do público até mediação/resposta.

> 💡 **Nota para o roadmap de avaliação bidirecional:** a estrutura atual de `avaliacoes` é unidirecional (cliente → prestador). Implementar "prestador avalia cliente" exigirá uma nova tabela (ex: `avaliacoes_clientes`) ou um campo `tipo_avaliacao` nesta mesma tabela invertendo `cliente_id`/`prestador_id` como avaliador/avaliado — a decidir em `07-roadmap.md`.

### View: `prestadores_ranqueados`

View que agrega `prestadores` + média de `avaliacoes.nota` (`media_interna`) + contagem de projetos (`total_projetos`), filtrando apenas `status = 'ativo'` e ordenando por nota e volume de projetos. Base provável do algoritmo de ranking/busca — **porém o frontend (`usePrestadores`) não usa essa view hoje**, recalculando médias em JS a partir de dados brutos (ver `05-modulos.md`).

### Anúncios

O PQF tem um sistema de anúncios com **leilão de lance (CPC) e segmentação geográfica/categórica** — mais sofisticado do que um simples banner estático.

| Tabela | Propósito |
|---|---|
| `anunciantes` | Conta do anunciante (pessoa física/jurídica que paga por anúncios) |
| `anuncios` | Anúncio individual — próprio ou do Google AdSense, com segmentação e leilão |
| `anuncios_metricas_diarias` | Impressões, cliques e custo por anúncio, por dia (`unique (anuncio_id, data_referencia)`) |

**`anunciantes` — campos-chave:**
- `saldo_atual` / `total_investido` — controle financeiro do anunciante
- `score_relevancia` (default 10.00) — provável fator de ranqueamento no leilão, além do lance
- `status_conta`: `pendente_aprovacao` → `ativo` / `inativo` / `bloqueado`

**`anuncios` — campos-chave:**
- `tipo`: `proprio` (anunciante do PQF) ou `google` (AdSense, via `codigo_google`)
- `status_aprovacao`: `pendente` → `aprovado` / `rejeitado` / `pausado_pelo_anunciante` / `saldo_esgotado` — moderação + controle de budget
- `lance_maximo_cpc` + `orcamento_diario` / `orcamento_gasto` — mecânica de leilão por CPC (custo por clique) com teto diário
- `publico_alvo`, `estado_sigla`, `regiao_id`, `cidade_id`, `grupo_id`, `categoria_id` — segmentação geográfica e por categoria de serviço
- `posicao` (default `topo`) — slot de exibição na página
- `prioridade` — desempate/ordenação manual além do lance

**Índices otimizados para as duas queries centrais do sistema:**
- `idx_anuncios_segmentacao` — busca de qual anúncio exibir para um usuário/página específica (`status`, `publico_alvo`, `cidade_id`, `categoria_id`, `posicao`)
- `idx_anuncios_leilao` — resolução do leilão entre anúncios elegíveis, ordenando por `lance_maximo_cpc desc`

**`anuncios_metricas_diarias`** agrega `impressoes`, `cliques` e `custo_total` por `anuncio_id` + `data_referencia`, permitindo relatório histórico diário sem recalcular a partir de eventos brutos.

**Status atual de uso:** o frontend (`AdCard.tsx`) sempre recebe `anuncio={null}` nos pontos de chamada revisados — a infraestrutura de leilão existe e está pronta, mas o "encanamento" de popular esse campo a partir de uma query real ainda não foi implementado. Decisão de produto documentada em `05-modulos.md`: por ora, o espaço de anúncio funciona como CTA de contato direto via WhatsApp.

### Infraestrutura / cross-cutting

| Tabela | Propósito |
|---|---|
| `logs_atividades` | Log genérico de atividades do sistema (ação, entidade, IP, usuário) |

**⚠️ `projeto_mensagens`** — tabela referenciada por múltiplas versões de um componente de chat em tempo real (`ProjetoTimeline`, em pelo menos 3 pontos do código revisados) que **não será implementado** (decisão de produto — WhatsApp já cobre essa necessidade). Se essa tabela existir de fato no banco, é candidata a remoção junto com o código — ver `07-roadmap.md`. Uma verificação (`grep`) no código-fonte não encontrou mais nenhuma referência ativa a `projeto_mensagens`, sugerindo que os componentes que a usavam já não fazem parte do projeto atual.

## Row Level Security (RLS) — padrão observado

Os módulos de portfólio seguem um padrão consistente de policies:

```sql
-- Padrão de policy de UPDATE/DELETE em tabelas vinculadas a prestador
EXISTS (
  SELECT 1 FROM portfolio_projetos
  JOIN prestadores ON prestadores.id = portfolio_projetos.prestador_id
  WHERE portfolio_projetos.id = <tabela>.projeto_id
    AND prestadores.user_id = auth.uid()
)
```

Isso garante que um prestador só possa modificar dados de projetos que lhe pertencem, verificado através da cadeia `auth.uid() → prestadores.user_id → prestadores.id → portfolio_projetos.prestador_id`.

**Leitura pública:** fotos de portfólio têm policy `SELECT` com `qual: true` — visibilidade pública total, correto para um portfólio que serve como vitrine.

**Ponto de atenção operacional:** como o RLS depende inteiramente de `auth.uid()`, qualquer falha de sessão no client (cookie expirado, client sem `createBrowserClient`) resulta em erro silencioso de permissão negada — não em erro de "não encontrado". Ao debugar erros de update/insert que "não fazem sentido", checar sessão antes de suspeitar de lógica de negócio.

## Migrations

Localizadas em `supabase/`. Ver esse diretório para o histórico incremental de mudanças de schema.