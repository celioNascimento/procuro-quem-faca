# Anúncios — MVP Admin-Only (Lojista/Fornecedor)

> Complementa `02-arquitetura.md`, `03-banco-de-dados.md` e `11-anuncios.md`. Ver `14-glossario.md` para a distinção entre os dois sistemas de anúncio (lojista/fornecedor vs. destaque de perfil do prestador).

## Status

**Implementado (pronto para integrar):** cadastro admin-only de anúncios de lojista/fornecedor, com criação automática de conta mínima para o lojista. Sem self-service, sem pagamento, sem leilão CPC — tudo isso fica para as próximas fases (ver seção Roadmap ao final).

**Ainda não plugado no projeto real:** os arquivos abaixo foram gerados e revisados contra o schema real do Supabase, mas ainda precisam ser colados no repositório e ter os imports/mocks ajustados (marcado explicitamente em cada arquivo).

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

```
app/api/admin/anunciantes/route.ts                       # API route nova — primeira do projeto com service role
lib/services/adminAnuncios.service.ts                     # Service — CRUD de anuncios + upload de banner
hooks/useAdminAnuncios.ts                                 # Hook — estado, loading/enviando separados
components/admin/anuncios/AnuncioLojistaForm.tsx           # UI — só o formulário de cadastro/edição
components/admin/anuncios/AnuncioLojistaLista.tsx          # UI — só a listagem com toggle/excluir
app/(admin)/admin/anuncios/page.tsx                       # Orquestração pura — sem lógica própria
supabase/setup_anuncios_storage.sql                       # Bucket de storage + policies de RLS
```

### Decisão: componentização por responsabilidade única

Havia um rascunho anterior (`page.js`, não finalizado, sem vínculo com `anunciante_id`) que misturava formulário e listagem em um único componente, e não passava pela criação de conta/anunciante decidida neste MVP. Ele foi mantido no repositório como referência — não foi apagado — mas o fluxo de lojista foi reescrito do zero em três componentes separados:

- **`AnuncioLojistaForm`** — só captura e valida os dados de um anúncio (cadastro ou edição). Não sabe nada sobre listagem, Supabase, ou o fallback Google.
- **`AnuncioLojistaLista`** — só exibe os anúncios já cadastrados, com toggle ativo/rascunho, editar e excluir (com confirmação). Não sabe nada sobre formulário ou criação de conta.
- **`page.tsx`** — orquestração pura: liga o hook aos dois componentes acima, sem regra de negócio própria.

Essa separação foi decidida propositalmente para permitir retomar o fallback Google AdSense (`tipo: 'google'`, `codigo_google`, sem `anunciante_id`) depois, como um componente irmão (`AnuncioGoogleForm.tsx`, por exemplo), reaproveitando a mesma listagem sem precisar reescrever o que já funciona para o lojista.

**Funcionalidades do rascunho anterior que valem ser resgatadas quando o fallback Google for retomado:** segmentação completa em cascata (estado → região → cidade → categoria, hoje o MVP do lojista usa só cidade + categoria), suporte ao tipo `google` com campo de script/slot do AdSense, e fluxo de aprovar/rejeitar inline cobrindo os 4 valores reais de `status_aprovacao` (o MVP do lojista usa só um toggle ativo/rascunho, já que a aprovação de conteúdo acontece no próprio ato do cadastro pelo admin).

### `app/api/admin/anunciantes/route.ts` — primeira API route do projeto

Até este ponto, todo o PQF opera client-side, com hooks chamando o Supabase diretamente e RLS garantindo a segurança (ver `02-arquitetura.md`, padrão Hook→Service→Supabase). Criar uma conta Auth em nome de outra pessoa exige a **service role key**, que nunca pode ser exposta ao client — por isso essa é a primeira operação do projeto que precisa de uma API route server-side.

**O que faz:**
1. Recebe `email`, `razaoSocial`, `cnpjCpf`, `whatsapp`
2. Verifica se já existe um usuário Auth com esse e-mail (evita duplicar em re-tentativa/edição)
3. Se não existir, cria via `supabase.auth.admin.createUser()` com senha temporária gerada e `email_confirm: true` (pula confirmação por e-mail, já que o admin validou o contato manualmente)
4. Faz `upsert` em `anunciantes` vinculado ao `user_id` (usa `onConflict: 'user_id'`, já que a coluna é `UNIQUE`)
5. Retorna a senha temporária **apenas na criação** (null se o usuário já existia) — ela não fica salva em nenhum lugar além dessa resposta única

**Pendências antes de rodar:**
- `SUPABASE_SERVICE_ROLE_KEY` precisa estar configurada nas env vars do servidor (Vercel → Settings → Environment Variables), nunca prefixada com `NEXT_PUBLIC_`

### `lib/services/adminAnuncios.service.ts`

Segue o padrão de service já usado no projeto — uma função por operação Supabase. Funções: `criarAnuncio`, `atualizarAnuncio`, `alternarStatusAnuncio`, `excluirAnuncio`, `listarAnuncios` (com join em `anunciantes`), `criarOuBuscarAnunciante` (chama a API route acima), `uploadBannerAnuncio`.

**Pendência antes de rodar:** o import `@/lib/supabase/client` no topo do arquivo é um placeholder — precisa ser trocado pelo client Supabase real já usado em outros services do projeto.

### `hooks/useAdminAnuncios.ts`

Estado do painel: `anuncios`, `loading`, `enviando` (mantidos **separados**, mesma correção já aplicada no `CadastroSkeleton` do fluxo de prestador — evita o bug de skeleton reaparecendo durante submit), `erro`.

`toggleAtivo` usa atualização otimista (muda o estado local antes da resposta do banco) para o toggle responder instantaneamente; reverte para o estado real via `recarregar()` se a chamada falhar.

### `components/admin/PainelAnuncios.tsx`

Formulário com: e-mail do lojista (só na criação — não aparece ao editar, já que a conta já existe), razão social, WhatsApp, título interno, link de destino, categoria/cidade, posição (select único, não múltiplo), toggle ativo/rascunho, upload de imagem (arquivo ou URL) com preview em tempo real mostrando o selo "Publicidade".

Ao criar um lojista novo, exibe um modal com a senha temporária gerada — copiável, mostrado **uma única vez** (não fica recuperável depois; se perder, é necessário resetar a senha pelo Supabase Auth).

**Pendências antes de rodar:**
- `CATEGORIAS` e `CIDADES` estão mockadas no topo do arquivo — trocar pelas chamadas reais de `useCategorias`/`useLocalizacao` já existentes no projeto
- Precisa ser plugado em uma página — sugerido `app/(admin)/admin/anuncios/page.tsx` (rota que já existia como placeholder "não revisado", segundo `02-arquitetura.md`)

### `supabase/setup_anuncios_storage.sql`

Roda antes do resto. Cria:
- Bucket `anuncios-banners`, **separado** do bucket de fotos de projeto (motivo: policies e ciclo de vida diferentes — fotos de projeto crescem sem limite e têm RLS ligado a `prestador.user_id`; banners de anúncio são poucos, trocados com frequência, e geridos por admin, não pelo dono)
- Policy de leitura pública (o banner aparece para qualquer visitante)
- Policies de escrita/remoção restritas a quem tem registro em `perfis_admin`
- Policies de RLS em `anuncios` (leitura pública só para `status = true AND status_aprovacao = 'aprovado'`; admin gerencia tudo) e `anunciantes` (admin gerencia tudo)

**Atenção ao rodar:** conferir se já não existem policies equivalentes nessas tabelas antes de aplicar, para não duplicar.

## Passo a passo para colocar em funcionamento

1. Rodar `setup_anuncios_storage.sql` no SQL Editor do Supabase
2. Confirmar `SUPABASE_SERVICE_ROLE_KEY` nas env vars do servidor (Vercel)
3. Colar os 4 arquivos de código nos caminhos indicados
4. Ajustar o import do client Supabase em `adminAnuncios.service.ts`
5. Trocar `CATEGORIAS`/`CIDADES` mockadas em `PainelAnuncios.tsx` pelos hooks reais
6. Criar `app/(admin)/admin/anuncios/page.tsx` renderizando `<PainelAnuncios />`
7. Testar: cadastrar um lojista de teste, confirmar que a conta Auth foi criada, confirmar que o toggle ativo/rascunho funciona, confirmar exclusão

## Integração pendente (fora deste MVP)

O `AdCard.tsx`/`useAdContext.ts` ainda **não foram alterados** — hoje continuam sempre em modo fallback (WhatsApp institucional). Para o anúncio cadastrado aqui realmente aparecer no site, falta:

- `useAdContext` passar a consultar `anuncios` filtrando por `status = true`, `status_aprovacao = 'aprovado'`, e segmento (categoria/cidade) resolvido via `resolverSegmento`
- `AdCard.tsx` ganhar um terceiro modo de exibição (além de AdSense real e fallback): anúncio próprio do lojista, renderizando `imagem_url` como banner completo com o selo "Publicidade" sobreposto

Esse é o próximo passo depois que o cadastro admin estiver testado e funcionando ponta a ponta.

## Roadmap — desenhado, não implementado

Registrado aqui para não se perder, mas fora do escopo atual:

- **Self-service do lojista:** lojista cria a própria conta e cadastra o próprio anúncio, entrando em `status_aprovacao: 'pendente'` até revisão do admin
- **Pagamento via Asaas:** assinatura mensal fixa (R$50/mês definido), cartão + Pix, webhook em `PAYMENT_CONFIRMED` liberando o anúncio — desenhado com gate de `status_pagamento` separado de `status_aprovacao`, ainda não implementado
- **Painel do lojista:** tela própria para o lojista acompanhar cliques/impressões do seu anúncio — motivador natural para ele já ter conta desde o MVP admin atual
- **Leilão com slots dinâmicos por segmento:** modelo alternativo ao CPC tradicional — não reembolso, e sim rebaixamento de posição quando superado por lance maior; número de slots por segmento (categoria+cidade) escala com a quantidade de prestadores ali (ex: 4 prestadores = 1 slot, 8 = 2); notificação ao lojista alguns dias antes do vencimento informando o valor necessário para retomar o topo. Levanta questões ainda não resolvidas: recontagem de slots quando prestadores saem/entram no segmento, regra de desempate em caso de redução de vagas, cálculo de raio geográfico (exige `latitude`/`longitude` + extensão de distância no Postgres, hoje a localização é só por `cidade_id`/texto livre)