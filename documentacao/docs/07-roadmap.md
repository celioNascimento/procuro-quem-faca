# Roadmap — PQF

Funcionalidades planejadas ou em avaliação. Não é um compromisso de prazo — é um registro de direção.

## Em avaliação

### Avaliação bidirecional (prestador avalia cliente)

**Problema que resolve:** hoje a confiança é assimétrica — só o prestador é avaliado. Prestadores relatam dificuldades reais com alguns clientes (demora no pagamento, dificuldade de comunicação, ambiente desorganizado no local do serviço).

**Proposta de MVP:**
- Nota (1–5) + tags rápidas (ex: "Pagamento em dia", "Comunicação clara", "Ambiente organizado") em vez de texto livre
- **Não público** — visível apenas como resumo agregado para o *próximo* prestador que for atender aquele cliente, nunca para outros clientes
- Sem comentário de texto livre na v1, para reduzir risco de retaliação e questões jurídicas

**Riscos a mitigar:**
- Retaliação (prestador dar nota baixa só por ter recebido nota baixa) → considerar liberar a avaliação do prestador só depois que o cliente já avaliou, ou ocultar simultaneamente até ambos avaliarem
- Não assustar clientes novos — a existência dessa avaliação não deve ser um ponto de atrito na primeira experiência de uso

**Fase 2 (se validado):** comentário livre com moderação.

## Estacionamento de ideias

Ideias registradas para avaliar depois — sem compromisso de prazo, só para não perder o contexto.

### Página "Como funciona"

Explicar o diferencial do PQF (registro fotográfico + avaliação vinculada a projeto) para os dois públicos:

**Cliente:**
1. Encontre o prestador certo para o serviço
2. Acompanhe com fotos em tempo real (antes/durante/depois)
3. Avalie ao final — ajuda outros clientes

**Prestador:**
1. Cadastre-se e monte seu portfólio
2. Registre cada serviço com fotos — vira prova de qualidade
3. Construa reputação real, não só indicação boca-a-boca

**Observação de UX:** hoje o botão "Como funciona" tem o mesmo peso visual de "Sugerir categoria" na home — mas explicar o produto tem mais impacto de conversão. Vale considerar dar mais destaque, especialmente próximo ao banner "Sou profissional" (onde a dúvida "como funciona pra mim como prestador?" é mais forte).

## Planejado

- [ ] **Confirmação de e-mail — hoje desligada, mecanismo já preparado para religar.** Se ativada no Supabase, o fluxo de `signUp` em `useLoginForm.handleLogin` passa a criar a conta sem sessão imediata (usuário precisa clicar no link do e-mail). O código já cobre esse caso: `garantirRoleInicial` não é chamado nesse momento (RLS de `profiles` exige sessão ativa), mas `redirecionarUsuario` chama `garantirRoleInicial` como parte do fluxo normal na próxima vez que o usuário logar de verdade — cobrindo o caso residual sem necessidade de mudança de código. Ativar a confirmação não deveria quebrar nada; testar mesmo assim antes de ligar em produção.

- [ ] Confirmar se `avaliacoes` tem constraint de unicidade por `projeto_id` (parece ser 1 avaliação por projeto pela UI, mas o schema não mostrou constraint explícita)

- [ ] Documentar `origem_tipo: 'vitrine'` em `03-banco-de-dados.md` — valor usado em `usePrestadores` (prioridade máxima, sem filtro de busca) mas não estava no schema/valores conhecidos até agora
- [ ] Padronizar nome do parâmetro de URL de "retorno" — `?from=` (usado em `PrestadorCard`/perfil público) vs. `?origem=` (usado no dashboard) fazem a mesma coisa com nomes diferentes
- [ ] Avaliar se `usePrestadores` deveria usar a view `prestadores_ranqueados` em vez de recalcular médias de avaliação no frontend — duplica lógica que já existe no banco
- [ ] Deletar `components/dashboard/UploadWizard.tsx` (confirmado legado — `PortfolioDashboardTab.tsx` já usa `UploadWizardContainer`)
- [ ] Deletar `components/dashboard/PortfolioTab.js` (confirmado mock/protótipo com imagens do Picsum, não conectado a dados reais — nome quase idêntico ao `PortfolioDashboardTab.tsx` real é risco de confusão)
- [ ] Deletar `ProjetoTimeline.jsx` — chat em tempo real descartado, ver decisão abaixo
- [ ] Opcional: finalizar refatoração do wizard — trocar hero inline de `UploadWizardContainer.tsx` por `<PrestadorCardHorizontal />` + `<WizardForm hookData={hookData} />`, já preparados para esse uso (comentário no próprio `PrestadorCardHorizontal.tsx` documenta a intenção)
- [ ] `AnunciosTab.js` em `components/dashboard/` — ainda não confirmado se está em uso ou é legado
- [ ] Página `/sucesso`: botão "Compartilhar Resultado" sem `onClick` implementado — decidir se implementa `navigator.share` ou remove o botão
- [ ] Página `/sucesso`: não recebe nem exibe dados do projeto/prestador avaliado — avaliar se vale personalizar (ex: "Sua avaliação para [nome] foi registrada")

## Decisões de escopo

**Chat em tempo real (`ProjetoTimeline.jsx` + tabela `projeto_mensagens`) — não será implementado.** O WhatsApp já cumpre o papel de comunicação direta entre cliente e prestador; replicar isso no app duplicaria esforço (Realtime, moderação, notificações) sem necessidade real. O componente e, se existir em produção, a tabela `projeto_mensagens`, devem ser removidos do código. Comentários pontuais por foto (`portfolio_comentarios`, via `ModalDiscussao`/`WizardZoomModal`) continuam sendo o mecanismo de feedback assíncrono dentro do app.

- [ ] Conversão gradual de arquivos `.js`/`.jsx` restantes para `.ts`/`.tsx` (ex: `app/recuperar-senha` / `NovaSenha`, `HeaderMobile.js`, `Footer.js`, `FooterWrapper.js`, `not-found.js`, `sitemap.js`) — feito arquivo por arquivo para não quebrar nada
- [ ] Reorganizar `components/perfil/` vs `components/profile/` — provável duplicação PT/EN
- [ ] Confirmar se tabela `perfis` tem dados/uso residual em produção; se não, remover do schema (ver `03-banco-de-dados.md` — `profiles` confirmada como ativa)
- [ ] Unificar `useAuth().role` (derivado da existência em `prestadores`) com `profiles.role` (armazenado, gravado automaticamente por `garantirRoleInicial` na criação da conta) — divergência hoje é de escopo bem menor (só durante o intervalo entre criar a conta e completar `/cadastro`), mas ainda existem duas fontes de papel em paralelo. Ver `04-autenticacao.md`, seção de Papéis.

- [ ] Documentação estruturada do repositório (`README.md` + `/docs`) — em andamento
- [ ] Refino do fluxo de rotas para prestadores com status pendente
- [ ] Testes automatizados (Vitest) cobrindo fluxos críticos (upload, legenda, autenticação)

## Concluído recentemente

- [x] Removida `/auth/escolha` (tela "Como você quer usar o PQF?") — cada ponto de entrada que pode criar conta nova já sabe qual `role` atribuir pelo próprio contexto (tela "Área do Profissional" → `useGoogleAuth`/`garantirRoleInicial` gravam `prestador` automaticamente); botão "Área do cliente" usa `?next=` direto. Consolidado como `03-autenticacao.md`
- [x] Corrigido bug: conta nova via e-mail/senha ou Google na tela "Área do Profissional" não caía em `/cadastro` — `handleLogin` (`useLoginForm.ts`) ganhou fallback de `signUp` quando `signInWithPassword` falha, e `garantirRoleInicial` passou a gravar `role` na criação, evitando o atraso de propagação (escrita + leitura em requests separadas) que causava o destino incorreto
- [x] `lib/services/auth.service.ts` criado como única camada de I/O para onboarding: `getStatusOnboarding`, `garantirRoleInicial`, `getPrestadorResumo`
- [x] `hooks/useGoogleAuth.ts` criado — extrai a lógica de OAuth do `GoogleButton.tsx` (agora puramente apresentacional), com suporte a `roleDesejado` opcional

- [x] Consolidado `resolverDestinoPosLogin` (`lib/auth/resolverDestinoPosLogin.ts`) como fonte única de verdade para destino pós-login — eliminou divergência de critério de "prestador completo" entre `auth/callback/route.ts` (checava categoria_id + nome) e `auth/escolha/page.tsx` (checava só categoria_id)
- [x] Descoberto e documentado `profiles.role` como terceira dimensão de papel (onboarding), distinta do `role` derivado de `useAuth`

- [x] Fix: `AdCard` no perfil público usava `page={"perfil" as AdPage}` (valor inválido mascarado por cast) — corrigido para `page="perfil_prestador"`
- [x] Fix: `getPerfilHref` em `lib/prestadorUtils.ts` não aceitava `id: number` (bigint do banco) — assinatura corrigida para `string | number`

- [x] Proteção real da área `(admin)` via middleware + `perfis_admin` (antes, qualquer usuário autenticado acessava `/admin` sem checagem)
- [x] Centralização do client Supabase em `lib/supabase/{client,server}.ts`, com `lib/supabase.ts` mantido como re-export de compatibilidade
- [x] Roteamento condicional: prestador com cadastro pendente é direcionado para completar cadastro em vez do dashboard
- [x] Fix de scroll/altura no modal de zoom de fotos (`ModalFotoBase`)
- [x] Correção de stale closure no `WizardZoomModal` / `handleSalvarLegenda`

---

*Este documento deve ser revisado e atualizado conforme decisões de produto avançam.*