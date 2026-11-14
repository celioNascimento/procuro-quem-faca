# Dashboard do Prestador — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Route group:** `app/(dashboard)/dashboard/`

```
layout.tsx    → DashboardLayout, header com botão voltar dinâmico via ?origem=
page.tsx      → Dashboard raiz, abas "Meus Trabalhos"/"Desempenho"/"Divulgação"/"Dados Profissionais"
perfil/page.tsx → redireciona para /dashboard?aba=perfil (ver nota abaixo)
```

**`usePerfilStatus`** — gatekeeper: `cadastroCompleto = !!(nome && whatsapp && categoria_id)` (3 campos mínimos, mais permissivo que o form de cadastro completo). Usa `buscarPrestadorPorUserId` (`cadastroPrestador.service.ts`).

**Abas** (em `page.tsx`): "Meus Trabalhos" (`PortfolioDashboardTab`, bloqueada se `!cadastroCompleto`) / "Desempenho" (`DesempenhoDashboardTab`, bloqueada se `!cadastroCompleto`) / "Divulgação" (`CentralDivulgacaoTab`, bloqueada se `!cadastroCompleto` ou perfil bloqueado) / "Dados Profissionais" (`EditarPerfilTab`, nunca bloqueada). Aba inicial controlável via `?aba=perfil` ou `?aba=desempenho` (com `&sub=avaliacoes` para abrir direto nas avaliações). `?aba=avaliacoes` é o nome antigo da aba e continua funcionando: abre Desempenho > Avaliações. "Ver meu perfil" (link `/${slug}`) só aparece com slug.

**Faixa resumo** (`ResumoDesempenhoStrip`): entre o card de anúncio e a barra de abas, mostra visitas e pedidos de orçamento dos últimos 7 dias e leva à aba Desempenho. Só aparece com cadastro completo, perfil não bloqueado e fora da própria aba Desempenho. Usa `useMinhasVisitas` e `useMeusCliques`; sem contagem de cliques ativa mostra "—", nunca "0".

**Selo "Novo"** na aba Desempenho: some na primeira vez que o prestador abre a aba. Estado em `localStorage` (`pqf:dashboard:desempenho-visto`), sempre dentro de `try/catch`; sem armazenamento disponível, o selo não aparece.

**`perfil/page.tsx`** não renderiza mais UI própria — é um redirecionamento client-side para `/dashboard?aba=perfil` (preservando `?origem=` se presente). Existe só por compatibilidade com links antigos (ex: "Minha Conta" em `HeaderAuthButton`); antes duplicava UI/gatekeeping de forma inconsistente com `/dashboard`.

### `EditarPerfilTab.tsx`

Reaproveita hooks/seções do Cadastro. Promove `ativacao_status` automaticamente para `perfil_completo` quando os campos obrigatórios ficam completos e o status atual é `nao_enviado`/ausente (não sobrescreve estados vindos de outro fluxo).

**Exclusão de conta:** `handleExcluirContaTotal` própria — remove foto, deleta `prestadores`, chama `/api/delete-account`, `signOut`. Funcionalmente equivalente ao fluxo único (`/confirmar-exclusao`) mas não migrada para ele (pendência registrada em `13-roadmap.md`).

### `PortfolioDashboardTab.tsx`

Orquestra `usePortfolioDashboard` (usa `portfolioDashboard.service.ts`). Alterna entre visão lista (`PrestadorSideCard` + `DashboardHeader` + grid de `ProjetoCard`/`EstadoVazio`) e visão wizard (`UploadWizardContainer`, `key` por projeto para reset de estado).

**`ProjetoCard.getStatusConfig`** — mapeia `status` + presença de avaliação em 5 rótulos: Rascunho, Aguard. cliente, Em progresso, Concluído, Aguard. avaliação. Derivação de UI, não status de banco.

### `components/dashboard/wizard/`

- **`UploadWizardContainer.tsx`** — tela guiada de criar e acompanhar um trabalho com cliente (ver "Tela de novo trabalho" abaixo). Usa `PassosDoTrabalho`, `DadosDoClienteCard`, `CartaoDeFoto` e `EnvioAoCliente`.
- **`WizardCompleted.tsx`** — exibido quando `isProjetoConcluido`, mostra fotos + comentários do cliente + compartilhar
- **`WizardZoomModal.tsx`** — foto ampliada com a descrição e os comentários do cliente. Só para olhar: a descrição se edita no cartão da foto e o modal sempre pode ser fechado. Usa `ModalFotoBase` (`components/shared/`)
- **`WizardForm.tsx`, `WizardTimeline.tsx`** — peças de refatoração antigas, não usadas pelo `UploadWizardContainer`

#### Tela de novo trabalho (repaginada em 13/11/2026)

Mesmas regras de negócio, outro jeito de conduzir. O telefone do cliente continua obrigatório; o aceite e a avaliação vão por link; as fotos Durante e Depois só liberam depois que o aceite é gerado.

- **Passos e "Agora:"** (`lib/trabalho/passos.ts`): com fotos são 5 passos (Cliente e serviço, Foto do antes, Aceite do cliente, Durante e depois, Avaliação) e sem fotos são 4 (Cliente e serviço, Aceite do cliente, Concluir, Avaliação). Uma frase diz o que fazer agora.
- **Descrição de cada foto é opcional** (decisão de 13/11/2026). Fica no cartão da foto e é salva ao sair do campo; nada trava. Não há mais modal que prende nem "Legenda obrigatória". O "Enviar aceite" libera depois da foto do antes e o "Pedir avaliação" depois da foto do depois, com ou sem descrição. A dica do campo "Depois" vem da categoria do prestador (`categorias.exemplo_descricao`, ver `12-admin.md`); "Antes" e "Durante" usam convites neutros (`lib/trabalho/descricaoFotos.ts`).
- **Foto sem descrição** aparece como "Antes do serviço", "Durante o serviço" ou "Depois do serviço" no perfil público, no acompanhamento do cliente e no resumo do trabalho (`descricaoOuPadrao`).
- **Pessoas na foto**: cada foto pergunta "Aparece o rosto de alguma pessoa?" e, se sim, "Tenho a autorização dessa pessoa". Grava `portfolio_fotos.contem_pessoas`, `consentimento_terceiros_confirmado` e `consentimento_terceiros_em`. Foto com pessoa sem autorização bloqueia o envio do aceite e da avaliação ao cliente. Trocar a foto zera a declaração.
- **Envio ao cliente** (`EnvioAoCliente`, `useWizardWhatsappLinks`): a janela do WhatsApp é aberta no clique, antes de consultar o banco, porque o navegador do celular bloqueia janelas abertas depois de uma espera. Há "Copiar mensagem" para quem prefere outro aplicativo e a prévia do texto que o cliente recebe (`lib/trabalho/mensagens.ts`).
- **Status em palavras simples** (`lib/trabalho/statusTrabalho.ts`): "Rascunho: ainda não enviado ao cliente", "Aguardando o cliente aceitar", "Em andamento", "Aguardando a avaliação do cliente", "Concluído e avaliado", mais "Garantia acionada" e "Reclamação recebida". O status do banco não aparece na tela.
- Clientes que já têm trabalho com o prestador aparecem como botões "Continuar" ao digitar o telefone.

Todo o módulo é orquestrado por **`hooks/useUploadWizard.ts`** + **`lib/services/uploadWizard.service.ts`**. Pontos de atenção do hook:
- `fotosCarrossel` estabilizado via `useMemo` (evita loop de re-render)
- Sincronização de status usa `useRef` para status atual, evitando incluí-lo nas deps do `useEffect` (evitaria loop infinito de requisições)
- `gerarLinkAceite`/`gerarLinkConclusao` montam link `wa.me` com mensagem pré-formatada; `gerarLinkConclusao` usa o `token` de avaliação no path (`/avaliar/${token}`), não o `projetoId`

### Primeira tela do prestador: Primeiros passos e Vitrine (13/11/2026)

A aba **Meus Trabalhos** abre, nesta ordem: botão "Ver meu perfil público", cartão **Primeiros passos**, **Vitrine de fotos** e o resumo dos trabalhos.

- **Trabalho** é o ciclo com cliente (telefone e nome do cliente obrigatórios, aceite e avaliação por link). Só o trabalho conta como confirmado pelo cliente. É o único nome usado na tela para esse conceito ("projeto" e "portfólio" saíram dos textos do painel).
- **Vitrine de fotos** (`VitrineDeFotos.tsx`, `useVitrine.ts`, `vitrine.service.ts`, regras em `lib/vitrine/vitrine.ts`): galeria de até 5 fotos, sem cliente, gravada na hora em `prestadores.sessao_fotos_titulo/urls`. No perfil público aparece com a linha "Fotos enviadas pelo profissional" (título padrão: "Fotos do profissional"), para não ser confundida com trabalho confirmado. O editor antigo ("sessão de fotos") saiu da aba Dados Profissionais.
- **Primeiros passos** (`PrimeirosPassos.tsx`, regras em `lib/dashboard/primeirosPassos.ts`): 1) perfil no ar (sempre concluído; copiar link), 2) fotos na vitrine, 3) primeiro trabalho com cliente. Some sozinho quando os três terminam e pode ser dispensado ("Agora não", guardado em `localStorage`, dentro de `try/catch`).
- O botão do banner do painel leva a `/dashboard?novo=1`, que abre a tela de novo trabalho uma vez e limpa o endereço.
- A faixa de 7 dias (`ResumoDesempenhoStrip`) não aparece enquanto visitas e orçamentos estiverem zerados.

### `PrestadorSideCard.tsx`

Card de identidade + dados profissionais na sidebar. Link "Ver meu perfil" → `/${slug}` (rota raiz, não `/p/${slug}`).

### `AnunciosTab.tsx`

Card estático direcionando ao WhatsApp institucional (`lib/config/contato.ts`), com mensagem própria de prestador interessado em destaque de perfil — distinto do módulo de anúncios para lojistas (ver `11-anuncios.md`).

### Aba "Desempenho" — `DesempenhoDashboardTab.tsx`

Antes, visitas ao perfil e pedidos de orçamento ficavam fixos no topo do dashboard e as avaliações tinham aba própria. Agora tudo vive em "Desempenho", com um seletor segmentado (`role="tablist"`, setas esquerda/direita alternam) em duas sub-abas:

- **Análises** (padrão ao abrir) — `VisitasPerfilCard` (visitas 7d, 30d e total, com variação) e `CliquesWhatsappCard` (pedidos de orçamento pelo WhatsApp, com a nota de contagem única a cada 24 h). Com zero pedidos, o card orienta a completar o perfil e adicionar trabalhos.
- **Avaliações** — `AvaliacoesDashboardTab` (nota média, distribuição, evolução e comentários recentes), sem alteração de conteúdo.

"Análises" é o padrão porque avaliações são poucas e esporádicas, enquanto o prestador volta ao painel para ver se está recebendo contato.

### Aba "Divulgação" — `CentralDivulgacaoTab.tsx`

Kit de divulgação do prestador, com os mesmos dados do perfil público (`lib/services/divulgacao.service.ts` → `useKitDivulgacao`). Liberada quando o cadastro está completo e o perfil não está bloqueado. Três sub-abas:

- **Cartão digital & WhatsApp** — PNG em Quadrado 1:1 (1080²), 4:3 (1200×900) e Stories 9:16 (1080×1920). A **foto final ("Depois", maior `ordem`) do projeto concluído mais recente** é o destaque, mostrada inteira (sem corte; sobra esmaecida quando a proporção difere); abaixo, foto/inicial, nome, categoria • cidade; rodapé com chamada, link curto e QR. **Não leva dados voláteis** (indicações, concluídos, garantia, selo de verificação), porque a imagem circula por semanas. Botões "Baixar imagem" e "Copiar link do perfil".
- **Adesivos & QR Code** — adesivo de veículo/baú 30×15 cm (200 dpi) e cartão de visita 90×50 mm frente/verso (300 dpi). "{Categoria} Verificado" só aparece se `verificado = true`. Saída: PNG ou impressão/"Salvar como PDF" via iframe com `@page` no tamanho físico. Sem sangria.
- **Links & orçamentos** — link geral da vitrine e 4 mensagens prontas de WhatsApp (portfólio, orçamento, status, grupos), que citam apenas números existentes.

**Ajuda sobre Divulgação** (`lib/help/help-content.ts`, categoria "Divulgação", público `prestador`): 4 artigos — visão geral, cartão digital, adesivos e QR Code, links e mensagens prontas. A visão geral aparece no bloco de ajuda do painel (`dashboard-prestador`); os outros três aparecem num bloco `ContextualHelp` no fim da própria aba (contexto `divulgacao`), para não lotar os atalhos do painel. Ao mudar rótulos ou fluxos da aba, atualizar esses textos. `ContextualHelp` agora envia `publico=prestador` no link "Ver todas as respostas".

Detalhes técnicos: QR próprio em `lib/qr/qrcode.ts` (byte, EC M, versões 1–10, sem dependências); artes em canvas (`lib/divulgacao/canvas.ts`); todo material usa o domínio canônico `SITE_URL` (`lib/divulgacao/links.ts`), nunca o de preview. Imagens externas carregam com `crossOrigin='anonymous'`; se o CORS falhar, a arte sai sem a foto. Uso registrado em `logs_atividades` (`BAIXAR_MATERIAL_DIVULGACAO`, `COPIAR_LINK_DIVULGACAO`, `COPIAR_MENSAGEM_DIVULGACAO`).
