# Área Administrativa — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Layout:** `app/(admin)/layout.tsx` — sidebar (`components/admin/AdminSidebar.tsx`) + header (`components/admin/AdminHeader.tsx`), dados de usuário via `hooks/useAdminAuth.ts` (só leitura para exibição; acesso já validado pelo middleware antes da página renderizar).

**Proteção:** `middleware.ts`, Regra C — qualquer `/admin/*` exige sessão + `perfis_admin`, exceto `/admin/login` (liberada explicitamente, com redirect automático para `/admin` se já houver sessão de admin válida).

## `/admin` — Dashboard

`hooks/useAdminDashboard.ts` + `lib/services/adminDashboard.service.ts`. Métricas gerais (contadores de cidades/anúncios/prestadores/logs), origem de prestadores (curadoria/registrados/reivindicados), funil de ativação, ranking de categorias mais buscadas, radar de eventos recentes (clique WhatsApp, busca sem sucesso, denúncia), subscription Realtime em `logs_atividades` com notificação visual para denúncias.

**Pendência:** o ranking de "categorias mais buscadas" depende de logs com `acao='FILTRO_CATEGORIA'` — nenhum ponto do frontend revisado até agora grava esse log explicitamente. Se essa gravação não existir de fato em algum lugar não revisado, o ranking fica sempre vazio (tratado com fallback "Sem dados ainda", não é erro visível, mas a métrica não reflete a realidade).

## `/admin/login`

`lib/services/adminAuth.service.ts` (`loginAdmin`). Tela simples de email/senha, sem hook dedicado (estado local só do componente).

## `/admin/logs`

`hooks/useAdminLogs.ts` + `lib/services/adminLogs.service.ts`. Busca até 1000 logs recentes, filtros (email/termo, data, tipo de evento), gráfico de atividade por dia/mês (Recharts), exportação CSV, subscription Realtime via `subscribeLogsAtividades` (`lib/db/logs.ts`, compartilhada com o dashboard admin, cada consumidor com seu próprio nome de canal).

## `/admin/moderacao`

`hooks/useModeracao.ts` + `lib/services/denuncia.service.ts` (estendido com `fetchDenuncias`, `atualizarStatusDenuncia`, `bloquearPrestadorDenunciado`). Lista denúncias filtráveis por status (aberta/resolvida/arquivada), com ações de resolver, arquivar, ou bloquear o prestador denunciado diretamente (usa `prestadores.bloqueado`/`motivo_bloqueio`).

**Nota:** esta é uma reconstrução completa da rota — o arquivo anterior sob `/admin/moderacao` era, por engano, uma cópia do formulário de cadastro de prestador, sem nenhuma relação com moderação de denúncias.

**Pendência:** validar em homologação — valores de status e ação de bloqueio implementados por suposição a partir do schema documentado, sem confirmação de colunas adicionais que possam existir na tabela `denuncias`.

## `/admin/povoar`

`hooks/usePovoar.ts` + `lib/services/povoar.service.ts`. Formulário de curadoria manual — insere um novo prestador diretamente com `origem_tipo: 'curadoria_publica'`, verificação de WhatsApp duplicado com debounce, geração de slug, avatar placeholder via `ui-avatars.com`.

**Bug corrigido:** o insert incluía um campo `categoria` (texto) inexistente na tabela `prestadores` — a tela nunca funcionou até a correção. Removido, mantendo só `categoria_id` (relação real via FK).

## `/admin/habilidades`

`hooks/useHabilidades.ts` + `lib/services/habilidades.service.ts`. CRUD simples de habilidades (nome + categoria), log de criação via `insertLog` (`lib/db/logs.ts`).

**Bug corrigido:** o insert de log gravava `usuario_email: 'admin@teste.com'` hardcoded, independente de quem estivesse logado — corrigido usando `insertLog`, que captura a sessão real automaticamente.

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

Segue o padrão de service já usado no projeto — uma função por operação Supabase. Contém também o cálculo lógico de vagas disponíveis e a validação do formulário contra o inventário (`verificarInventarioSegmento`, `validarSegmentacoesContraInventario`).

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

## `/admin/ativacao`

Não revisados ainda.
