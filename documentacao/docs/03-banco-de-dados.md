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
| `perfis` | Dados complementares de perfil (nome, whatsapp, bio, localização) |
| `profiles` | Dados complementares de perfil — **ver observação de duplicação abaixo** |
| `perfis_admin` | Controle de acesso administrativo (`owner`, `moderator`, `editor`) |

> ⚠️ **Duplicação a investigar:** `perfis` e `profiles` parecem cobrir o mesmo propósito (dados de perfil vinculados a `auth.users`), com nomenclatura PT/EN. Provável resquício de refatoração incompleta. Antes de criar novos campos de perfil, confirmar qual tabela está ativa em produção — só uma deve ser a fonte de verdade.

### `prestadores`

Tabela central do domínio profissional.

**Campos-chave:**
- `status` (`pendente` | `ativo` | outros) — controla se o prestador aparece publicamente e se é redirecionado para completar cadastro
- `ativacao_status` — funil de ativação via WhatsApp: `nao_enviado` → `enviado` → `respondeu_positivo`/`respondeu_negativo`/`sem_whatsapp` → `perfil_completo` → `avaliacao_recebida`
- `origem_tipo` — `registro_direto` (auto-cadastro) vs. curadoria manual inicial
- `slug` — usado na URL pública (`/p/[slug]`)
- `bloqueado` + `motivo_bloqueio` — moderação
- `verificado` — selo de confiança

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

**`portfolio_projetos.status`** (inferido do código): `em_registro` → `pendente` → `em_execucao` → `finalizado`.

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

> 💡 **Nota para o roadmap de avaliação bidirecional:** a estrutura atual de `avaliacoes` é unidirecional (cliente → prestador). Implementar "prestador avalia cliente" exigirá uma nova tabela (ex: `avaliacoes_clientes`) ou um campo `tipo_avaliacao` nesta mesma tabela invertendo `cliente_id`/`prestador_id` como avaliador/avaliado — a decidir em `07-roadmap.md`.

### View: `prestadores_ranqueados`

View que agrega `prestadores` + média de `avaliacoes.nota` (`media_interna`) + contagem de projetos (`total_projetos`), filtrando apenas `status = 'ativo'` e ordenando por nota e volume de projetos. Base provável do algoritmo de ranking/busca.

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

> 💡 Este sistema de anúncios é uma funcionalidade de monetização relevante o suficiente para merecer sua própria seção detalhada — considerar um `08-sistema-anuncios.md` dedicado se a complexidade crescer (lógica de leilão, fallback quando não há anúncio pago elegível, integração AdSense).

### Infraestrutura / cross-cutting

| Tabela | Propósito |
|---|---|
| `logs_atividades` | Log genérico de atividades do sistema (ação, entidade, IP, usuário) |

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