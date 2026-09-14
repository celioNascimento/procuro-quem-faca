# Matriz de homologação E2E fora de `/admin`

> Documento da fase 2: define a configuração inicial e a matriz de homologação automatizada. A rota `/admin`, suas páginas, APIs, componentes e fluxos não fazem parte deste escopo.
>
> Status desta revisão: configuração Playwright criada em 14/09/2026. Os fluxos mutáveis continuam condicionados a fixtures e credenciais exclusivas de homologação; itens **PENDENTE** não são aprovação funcional.

## Como usar a matriz

- **Elemento / nome acessível**: texto, label, role ou destino usado para localizar o controle.
- **Pré-condição**: estado necessário para executar a ação sem misturar cenários.
- **Resultado esperado**: evidência observável na interface, URL, mensagem ou requisição.
- **Evidência**: o que o E2E deve registrar para comprovar o resultado.
- **Persistência**: se a ação apenas navega, altera estado local ou grava dados.
- **Prioridade**: `P0` bloqueia o fluxo principal; `P1` é funcionalidade importante; `P2` é apoio/edge case.

## Inventário de rotas não administrativas

| Domínio | Rotas incluídas | Observação |
|---|---|---|
| Entrada e autenticação | `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/auth/link-expirado`, `/auth/callback` | `/cadastro` também é área protegida e pode representar criação, edição ou reivindicação. |
| Busca e descoberta | `/prestadores`, `/<slug>`, `/denunciar/<id>`, `/reivindicar` | `/<slug>` é perfil público; `/reivindicar` encaminha para cadastro. |
| Área do prestador | `/dashboard`, `/dashboard/perfil` | `/dashboard/perfil` deve redirecionar para `/dashboard?aba=perfil`. |
| Área do cliente | `/painel/perfil`, `/meus-servicos` | Requer sessão de cliente para dados e ações privadas. |
| Projeto e pós-serviço | `/acompanhamento/<token>`, `/avaliar/<token>`, `/sucesso`, `/confirmar-exclusao` | Tokens e dados devem ser exclusivos do ambiente de homologação. |
| Institucional e suporte | `/quem-somos`, `/ajuda`, `/termos`, `/privacidade`, `/documentacao/docs/<slug>` | A documentação pública não deve depender de `/admin` para navegação. |
| Estados de aplicação | `/not-found`, `/error` | Homologar CTA de recuperação, sem provocar erro real destrutivo. |

**Fora do escopo:** `/admin/**`, `/api/admin/**` e qualquer componente ou fixture administrativo. APIs não administrativas só serão exercitadas indiretamente pelos fluxos de suas páginas.

## Matriz funcional

### Entrada, busca e páginas públicas

| Rota | Elemento / nome acessível | Pré-condição | Ação | Resultado esperado | Evidência | Persistência | Prioridade |
|---|---|---|---|---|---|---|---|
| `/` | Formulário de busca | Página carregada | Informar serviço e submeter | Navega para `/prestadores` com consulta preservada | URL e título/resultados | Não | P0 |
| `/` | Sugestão de busca | Sugestão visível | Clicar | Executa a mesma busca com o termo da sugestão | URL e termo exibido | Não | P1 |
| `/` | CTA de entrada/ação | Página carregada | Clicar | Navega para o destino configurado pelo CTA e registra o evento quando aplicável | URL e ausência de erro | Log analítico quando ativo | P1 |
| `/prestadores` | Formulário/filtros de busca | Resultados ou estado vazio | Alterar termo, cidade, grupo/categoria e aplicar | Lista reflete os filtros; consulta explícita `serviço em cidade` usa a cidade informada | URL, filtros e cards | Estado/URL | P0 |
| `/prestadores` | Limpar filtros | Filtro ativo | Clicar | Remove filtros e restaura listagem coerente | URL, campos e resultados | Não | P1 |
| `/prestadores` | Card/link do prestador | Card disponível | Clicar | Abre `/<slug>` | URL e nome do perfil | Não | P0 |
| `/prestadores` | Links de contato/anúncio | Link disponível | Clicar | Abre destino correto, externo em nova aba quando configurado | href, target e evento | Métrica quando aplicável | P1 |
| `/<slug>` | Abas Portfolio/Avaliações | Perfil com conteúdo | Alternar aba | Exibe somente a seção escolhida | Aba ativa e conteúdo | Query/estado se aplicável | P1 |
| `/<slug>` | Projeto/“ampliar foto” | Perfil com projeto | Clicar e navegar fotos | Abre modal, permite anterior/próxima/seleção e fechar | Modal, aria-labels e screenshot | Não | P1 |
| `/<slug>` | Compartilhar perfil | Perfil carregado | Clicar | Usa Web Share ou fallback de clipboard; não expõe token privado | Mensagem/clipboard ou share mockado | Não | P1 |
| `/<slug>` | Contato/WhatsApp | WhatsApp válido | Clicar | Abre `wa.me` com mensagem contextual | URL externa e target | Métrica quando aplicável | P0 |
| `/<slug>` | Denunciar | Perfil carregado | Clicar | Navega para `/denunciar/<id>` | URL | Não | P1 |
| `/denunciar/<id>` | Formulário de denúncia | ID válido e dados de homologação | Preencher e enviar | Mostra confirmação sem duplicar submissão | Mensagem, request e estado final | Sim: `denuncias` | P1 |
| `/reivindicar` | Reivindicar perfil | ID de curadoria válido | Clicar | Navega para `/cadastro?reivindicar=<id>` | URL e query | Não | P1 |
| `/quem-somos` | “Encontrar profissional” / “Quero me cadastrar” | Página carregada | Clicar | Navega para `/prestadores` e `/cadastro` respectivamente | URL | Não | P2 |
| `/termos`, `/privacidade` | Voltar | Histórico disponível | Clicar | Retorna à página anterior sem quebrar o histórico | URL anterior | Não | P2 |
| `/ajuda` | Links/CTAs de suporte | Página carregada | Clicar | Abre o destino documentado ou contato configurado | href/target | Não | P2 |

### Autenticação e onboarding

| Rota | Elemento / nome acessível | Pré-condição | Ação | Resultado esperado | Evidência | Persistência | Prioridade |
|---|---|---|---|---|---|---|---|
| `/login` | E-mail/senha + submit | Conta E2E existente ou nova | Submeter credenciais válidas | Usuário é autenticado e encaminhado por role/status | URL, sessão e heading | Sim: Auth/profile | P0 |
| `/login` | “Entrar com Google” | OAuth configurado no ambiente | Clicar | Inicia callback com role e retorna ao destino correto | URL/callback ou mock controlado | Sim: Auth/profile | P1 |
| `/login` | “Esqueci minha senha” | E-mail de homologação | Solicitar recuperação | Mostra feedback seguro e dispara recuperação | Mensagem e request | Sim: evento Auth | P0 |
| `/login` | Mostrar/ocultar senha | Página carregada | Clicar | Alterna `type` sem alterar valor | Atributo do input | Não | P2 |
| `/recuperar-senha` | Nova senha + submit | Link de recovery válido | Submeter senha válida | Atualiza senha e redireciona para `/login?msg=senha_alterada` | URL e mensagem | Sim: Auth | P0 |
| `/recuperar-senha` | Link de recovery expirado | Link inválido/expirado isolado | Abrir | Navega ou exibe estado de link expirado | URL, heading e log | Evento de auditoria | P1 |
| `/cadastro` | Campos, selects, termos e submit | Ambiente E2E; sem perfil ativo | Preencher dados válidos e enviar | Cria/atualiza conta e prestador e vai para `/dashboard` | URL, sessão, mensagem e registros | Sim: Auth/profile/prestador/Storage | P0 |
| `/cadastro` | Upload de foto | Arquivo sintético permitido | Selecionar/remover arquivo | Preview e upload/removal funcionam conforme estado | Preview, request e Storage | Sim: Storage | P1 |
| `/cadastro` | Verificação de slug | Nome/slug editável | Informar slug duplicado/disponível | Mostra disponibilidade correta e bloqueia duplicado | Mensagem e submit | Não até submit | P1 |
| `/cadastro` | Links Termos/Privacidade | Formulário visível | Clicar | Abre a página correspondente | URL | Não | P2 |
| `/cadastro` | Excluir perfil | Perfil próprio em edição | Confirmar em cenário isolado | Remove apenas o prestador, sem presumir exclusão da conta | Mensagem, request e registro | Sim: prestador | P1 |

### Área do prestador

| Rota | Elemento / nome acessível | Pré-condição | Ação | Resultado esperado | Evidência | Persistência | Prioridade |
|---|---|---|---|---|---|---|---|
| `/dashboard` | Aba “Meus Projetos” | Prestador completo | Clicar | Exibe projetos e ações disponíveis | Aba/heading | Não | P0 |
| `/dashboard` | Aba “Dados Profissionais” | Prestador autenticado | Clicar | Exibe edição do perfil | Aba/heading | Não | P0 |
| `/dashboard` | “Ver meu perfil” | Slug existente | Clicar | Abre `/<slug>` | URL | Não | P1 |
| `/dashboard` | Novo projeto/wizard | Prestador autenticado | Criar projeto, etapas, fotos e legendas | Salva o projeto e atualiza a visão sem duplicação | Requests, status e UI | Sim: projetos/fotos/Storage | P0 |
| `/dashboard` | Links de aceite/conclusão | Projeto em estado compatível | Clicar | Gera link WhatsApp correto; conclusão usa token de avaliação | href e mensagem | Não | P1 |
| `/dashboard` | Comentário/zoom de foto | Projeto com foto | Abrir, editar legenda, comentar e fechar | Modal e dados retornam ao estado correto | Modal, request e texto | Sim: comentários/foto | P1 |
| `/dashboard` | Anúncios/contato institucional | Dashboard carregado | Clicar | Abre WhatsApp institucional com mensagem de prestador | URL externa | Não | P2 |
| `/dashboard/perfil` | Rota de compatibilidade | Prestador autenticado | Abrir | Redireciona para `/dashboard?aba=perfil`, preservando `origem` | URL final | Não | P1 |
| `/confirmar-exclusao` | Campo “EXCLUIR” + confirmar | Conta E2E autenticada | Confirmar texto exato | Remove dados permitidos, chama API, encerra sessão e redireciona | Network, sessão, URL e mensagem | Sim: dados/usuário | P0 |
| `/confirmar-exclusao` | Cancelar | Modal/tela visível | Cancelar | Não altera dados e retorna ao contexto | URL e ausência de request destrutivo | Não | P1 |

### Área do cliente, acompanhamento e avaliação

| Rota | Elemento / nome acessível | Pré-condição | Ação | Resultado esperado | Evidência | Persistência | Prioridade |
|---|---|---|---|---|---|---|---|
| `/painel/perfil` | Abas “Meus projetos”/“Minha conta” | Cliente autenticado | Alternar | Conteúdo e `aria-current` correspondem à aba | DOM acessível | Estado local | P0 |
| `/painel/perfil` | Cards de avaliação/garantia/reclamação | Serviço E2E compatível | Clicar | Seleciona aba e filtro correspondente | Aba, filtro e cards | Não | P1 |
| `/painel/perfil` | Editar dados + salvar | Cliente autenticado | Alterar e salvar | Mostra sucesso e recarrega os dados | Request, mensagem e valor | Sim: perfil/avatar | P0 |
| `/painel/perfil` | Sair / cancelar saída | Cliente autenticado | Abrir, cancelar ou confirmar | Cancelar mantém sessão; confirmar encerra e redireciona | Sessão, URL e modal | Sim: sessão | P0 |
| `/meus-servicos` | Filtros/status e cards | Cliente com fixture de serviços | Interagir | Lista e estados refletem o filtro | DOM e URL/estado | Não | P1 |
| `/acompanhamento/<token>` | Nós da timeline | Token válido E2E | Clicar | Abre discussão da etapa | Modal e status | Não | P1 |
| `/acompanhamento/<token>` | Comentário + enviar | Token válido e etapa habilitada | Preencher e enviar | Comentário aparece e não aceita texto vazio | Request, mensagem e item | Sim: comentário | P1 |
| `/acompanhamento/<token>` | Contato WhatsApp | Projeto com contato | Clicar | Abre contato correto | href externo | Não | P1 |
| `/avaliar/<token>` | Nota, comentário e indicação | Token válido e projeto não finalizado | Selecionar nota e indicação, enviar | Persiste avaliação, finaliza projeto e vai para `/sucesso` | Requests, URL e status | Sim: avaliação/projeto | P0 |
| `/avaliar/<token>` | Nota 4–5/1–2/3 | Formulário visível | Alterar nota | Indicação pré-seleciona true/false/null conforme regra | Estado dos botões | Não | P1 |
| `/avaliar/<token>` | Fotos finais | Arquivos sintéticos válidos | Selecionar/remover/enviar | Evidências são tratadas no projeto correto | Preview, request e Storage | Sim: Storage | P1 |
| `/sucesso` | Compartilhar resultado | API `navigator.share` ou clipboard mockada | Clicar | Compartilha texto ou usa fallback sem erro | Chamada mockada e feedback | Não | P2 |
| `/sucesso` | Voltar para Home | Página carregada | Clicar | Navega para `/` | URL | Não | P1 |

### Documentação e estados de erro

| Rota | Elemento / nome acessível | Pré-condição | Ação | Resultado esperado | Evidência | Persistência | Prioridade |
|---|---|---|---|---|---|---|---|
| `/documentacao/docs/<slug>` | “Voltar para documentação” | Slug público válido | Clicar | **PENDENTE:** atualmente aponta para `/admin/documentacao`; deve ser definido como link público ou removido antes do E2E | URL atual e decisão registrada | Não | P1 |
| `/not-found` | CTA de início | URL inexistente | Clicar | Vai para `/` | URL | Não | P2 |
| `/error` | Tentar novamente | Erro renderizado em fixture | Clicar | Executa `reset` e tenta recuperar a rota | Chamada/estado | Não | P2 |

## Divergências e pendências identificadas

1. **Documentação pública aponta para admin:** `app/documentacao/docs/[slug]/page.tsx` usa `/admin/documentacao` no link de retorno. Isso contradiz o escopo não-admin e deve ser corrigido ou explicitamente aceito como dependência antes da configuração E2E.
2. **Catálogo incompleto:** `/reivindicar`, `/recuperar-senha`, `/ajuda`, `/quem-somos`, `/termos`, `/privacidade`, `/sucesso`, `/not-found` e `/error` precisam constar no inventário de rotas do catálogo.
3. **Fluxo legado de avaliação:** `FormularioAvaliacao` ainda referencia `contestacoes`; a homologação deve tratar isso como pendência, não como comportamento aprovado, até migrar para `solicitacoes_garantia`.
4. **Compartilhamento em `/sucesso`:** a página usa texto genérico e não recebe contexto do projeto; o E2E deve validar o comportamento atual e manter a limitação visível.
5. **Acessibilidade dos controles icônicos:** os controles de fechar/ampliar em alguns modais precisam de `aria-label` consistente para inspeção automática. Não devem ser ignorados silenciosamente.
6. **Mutação isolada:** cadastro, upload, exclusão, denúncia, comentários e avaliação só podem usar fixtures/contas do ambiente de homologação; nenhum caso deve depender de dado produtivo.

## Regras para a fase 2 — configuração E2E

- Definir `E2E_BASE_URL`, contas por papel (`E2E_PRESTADOR_*`, `E2E_CLIENTE_*`) e identificadores/tokens criados exclusivamente para homologação.
- Escolher entre reset por API/seed e limpeza por fixture; destruição deve ser limitada aos IDs criados pelo teste.
- Cobrir desktop e viewport mobile; manter `/admin` excluído por projeto, grep de rotas e teste de segurança.
- Interceptar OAuth e APIs externas não determinísticas; não transformar indisponibilidade em aprovação.
- Inspecionar controles visíveis (`button`, `a`, `[role=button]`, inputs/selects) por rota, mas excluir controles puramente decorativos somente com justificativa na matriz.
- Para cada ação, exigir pelo menos uma evidência: URL, estado acessível, mensagem, request/response ou persistência consultável.
- Marcar como `skip` apenas fluxos sem pré-condição disponível, com motivo e ticket/pendência associado.
- A configuração Playwright, fixtures, scripts npm e execução automatizada ficam para a fase 2, após esta documentação ser validada e as pendências acima decididas.

## Configuração automatizada entregue

A configuração inicial está em `playwright.config.ts` e cobre Chromium desktop e mobile. Por padrão, o comando inicia `npm run dev`; em CI ou contra um ambiente dedicado, defina `E2E_BASE_URL` para evitar iniciar um servidor local. Os testes em `tests/e2e` apenas navegam e inspecionam controles visíveis nesta etapa; não submetem formulários mutáveis nem usam credenciais reais.

```bash
npm run test:e2e
E2E_BASE_URL=https://homologacao.exemplo.test npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
```

A auditoria falha quando encontra controle visível sem nome acessível ou link apontando para `/admin`. Rotas dinâmicas e fluxos com sessão, token, upload ou persistência devem ser adicionados somente depois que as variáveis `E2E_*` e fixtures isoladas forem definidas.

## Critério de aceite documental

A fase 1 está concluída quando cada rota não-admin possui seus controles principais inventariados, cada mutação tem pré-condição e isolamento definidos, cada divergência está registrada e nenhuma referência a `/admin` é necessária para executar um fluxo público.
