# Anúncios — MVP Admin-Only (Lojista/Fornecedor)

> Complementa `02-arquitetura.md`, `03-banco-de-dados.md` e `11-anuncios.md`. Ver `00-glossario.md` para a distinção entre os dois sistemas de anúncio (lojista/fornecedor vs. destaque de perfil do prestador).

## Status

**Implementado:** cadastro admin-only de anúncios de lojista/fornecedor, com criação automática de conta mínima para o lojista, verificação de inventário de vagas e agendamento futuro. Sem self-service, sem pagamento, sem leilão CPC — tudo isso fica para as próximas fases (ver seção Roadmap ao final).

## Decisão de escopo (por que admin-only, não self-service)

O desenho original considerou self-service completo (lojista cria conta, cadastra anúncio, paga via Asaas com assinatura recorrente, e futuramente compete em leilão com raio geográfico e realocação de slots). Esse modelo completo foi **desenhado mas não implementado** — fica registrado como visão de longo prazo (ver Roadmap). Para o primeiro teste real, o escopo foi reduzido a: você (admin) cadastra manualmente cada lojista, sem cobrança neste momento.

## Por que reaproveita `anuncios`/`anunciantes` em vez de tabelas novas

O schema já existente no banco (`03-banco-de-dados.md`) foi desenhado para o modelo de leilão CPC completo. Em vez de criar tabelas paralelas simplificadas — o que geraria uma migração de dados dolorosa quando o leilão for implementado de verdade — o MVP admin usa as tabelas reais, só preenchendo um subconjunto das colunas:

**Usado neste MVP:** `titulo`, `link_destino`, `imagem_url`, `posicao`, `status` (boolean ativo/rascunho), `status_aprovacao` (fixado em `'aprovado'`, já que quem cadastra é o admin), `categoria_id`, `cidade_id`, `anunciante_id`.

**Existe no schema mas não usado ainda:** `lance_maximo_cpc`, `orcamento_diario`/`orcamento_gasto`, `anuncios_metricas_diarias` inteira, `score_relevancia` de `anunciantes`. Ficam com os valores default até o leilão ser implementado.

## Schema real (referência)

Ver `03-banco-de-dados.md` para o `CREATE TABLE` completo de `anunciantes`, `anuncios` e `anuncios_metricas_diarias`. Pontos que mudaram decisões de design deste MVP, especificamente:

- `anunciantes.user_id` é **obrigatório** e único, com FK para `auth.users` — não é possível criar um anunciante sem uma conta Auth associada. Resolvido criando essa conta automaticamente no cadastro (ver seção API abaixo).
- `anuncios.posicao` é **um valor de texto único**, não uma lista — se o lojista quiser o mesmo banner em mais de um local (topo da busca, entre cards, topo do perfil), é necessário criar uma linha de anúncio por posição.
- `anuncios.titulo` não tem colunas de subtítulo/CTA — o texto do banner precisa estar embutido na própria imagem (consistente com a decisão de "banner completo", ver seção Imagem abaixo).

## Regras de Negócio de Inventário e Agendamento (MVP)

A gestão de vagas para anúncios na posição `entre_cards` (e outras escaláveis) segue regras estritas para garantir previsibilidade comercial e contornar limitações do banco:

1. **Matemática de Vagas (Mínimo Garantido):** A proporção padrão é de 1 vaga a cada 4 prestadores ativos na praça (`Math.floor(prestadores / 4)`). No entanto, **se houver pelo menos 1 prestador**, o sistema garante **no mínimo 1 vaga** para comercialização. (Se a praça tiver 0 prestadores, as vagas são 0).
2. **Fila de Espera (Agendamento Futuro):** O bloqueio de inventário só se aplica a anúncios que entram em vigência *hoje*. Se a praça estiver lotada, o admin ainda pode cadastrar um novo anúncio, desde que a `data_inicio` seja agendada para o futuro (reconhecendo que a vaga atual irá expirar).
3. **Consulta Invertida (Workaround PostgREST):** Devido a um bug conhecido no PostgREST ao cruzar filtros `.or` (para checar datas de vigência) em tabelas estrangeiras, a query de contagem de vagas foi invertida. Em vez de buscar em `anuncios_segmentacoes` filtrando anúncios, o sistema busca na tabela raiz `anuncios` fazendo um `!inner join` com as segmentações.

## Spec de imagem do banner

Definida a partir da análise do `AdCard.tsx`/`AdCardFallback.tsx` reais (container `min-h-[100px] w-full`, sem altura fixa, formato responsivo largo).

| Propriedade | Valor |
|---|---|
| Formato visual | Banner de fundo completo (a imagem é o card inteiro — substitui o layout ícone+texto+CTA do fallback atual) |
| Proporção | 21:9 |
| Dimensão de referência | 1200×514px |
| Peso máximo | 500KB |
| Formatos aceitos | JPG, WebP (PNG se precisar de transparência) |
| Área de segurança | ~64px livres nos 4 cantos, reservados para o selo "Publicidade" renderizado pelo sistema sobre a imagem |

**Nota de conformidade:** o selo "Publicidade" sobreposto à imagem existe para atender ao princípio de identificação da publicidade do CDC (art. 36) — conteúdo patrocinado precisa ser identificável como tal para quem visita o site. É renderizado pelo componente, não faz parte da arte enviada pelo lojista.

## Por que conta mínima do lojista, não cadastro 100% anônimo

Como `anunciantes.user_id` é obrigatório, não há como criar um anunciante sem uma conta Auth. Em vez de contornar isso com um usuário fake/placeholder, a decisão foi criar uma conta real e mínima (email + senha temporária) para cada lojista no momento do cadastro — isso também deixa o caminho pavimentado para o próximo passo natural: um painel do lojista para acompanhar cliques/impressões do próprio anúncio (colunas `cliques`, `impressoes`, `orcamento_gasto` já existem em `anuncios`), o que dá ao lojista um motivo real para ter login, não implementado ainda.

## Arquivos gerados

