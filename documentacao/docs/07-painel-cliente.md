# Painel do Cliente — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Rota:** `app/painel/perfil/page.tsx` (dados) e `app/meus-servicos/page.tsx` (lista de serviços)

## `PerfilDoCliente` (`app/painel/perfil/page.tsx`)

**Hook:** `usePerfilCliente`, compondo `usePerfilDados` (dados pessoais, avatar — não trata exclusão de conta), `useServicosCliente` (busca pela conta logada — `cliente_user_id` —, filtros, contadores, `getRotaDestino`), `usePerfilUI` (aba ativa, modal de saída com alterações não salvas via `beforeunload`).

**Roteamento contextual** (`getRotaDestino`):
```
status='pendente' → /meus-servicos?token=...
status='em_execucao' em fluxo com fotos e sem etapa final concluída → /acompanhamento/[token]
status='em_execucao' no fluxo sem fotos após `marcado_concluido_at` → /avaliar/[token]
status='em_execucao' com etapa final de fotos concluída → /avaliar/[token]
default → /avaliar/[token]
```

**Filtros da lista:** Todos · Para aceitar · Em andamento · Avaliar · Concluídos, mais Garantia e Reclamação quando há caso aberto. Os números dos botões vêm do hook (`pendentesCount`, `andamentoCount`, `avaliarCount`, `finalizadosCount`) e usam a mesma regra que monta a lista — o número do botão é sempre igual ao que aparece ao tocar nele. "Em andamento" **não** inclui o que já está pronto para avaliar (esse vai em "Avaliar").

**Carregamento:** a tela mostra o esqueleto só enquanto o perfil e os trabalhos carregam (`!perfilCarregado || loadingServicos`). O `loading` do hook liga ao **salvar** e não pode entrar nessa condição — antes a página inteira virava esqueleto no meio do salvamento.

**Aviso "Deslize para ver mais avisos":** só aparece no celular e só quando há 2 ou mais cartões de aviso.

**Formulário "Minha conta":** todo campo tem `<label htmlFor>` + `id` (`perfil-nome`, `perfil-whatsapp`…). Texto de ajuda e placeholder com contraste mínimo `slate-500`; cartões de aviso laranja usam `orange-700` (o `orange-600` não dá contraste para texto branco pequeno).

**Navegação com alterações não salvas:** `usePerfilUI.irPara(destino)` pergunta antes de sair (`DialogoConfirmacao`) — não há mais `MouseEvent` falso.

**Exclusão de conta:** botão na Zona de Perigo linka para `/confirmar-exclusao` (fluxo único, ver `04-autenticacao.md`).

## `PainelDoCliente` (`app/meus-servicos/page.tsx`)

**Hook:** `usePainelCliente` + `lib/services/painelCliente.service.ts` (`getProfile`, `getServicoPorToken`, `getServicosPorWhatsapp`, `aceitarServico`, `loginComGoogle`).

Acesso via `?token=` ou fallback por whatsapp salvo. `LoginGate` (`components/meus-servicos/LoginGate.tsx`) se sem sessão — usa `loginComGoogle` deste service (não passa por `useGoogleAuth`).

Sem filtros: mostra o trabalho selecionado (`?token=`) e, abaixo, os outros trabalhos do mesmo prestador; sem token, a lista geral.

**Aceitar trabalho (`handleAceitar`):** só a conta dona do trabalho (`cliente_user_id`) pode aceitar — regra da função `aceitar_projeto` no banco. Quem abre o link com `?token=` vira dona ao entrar: `usePainelCliente` chama `reivindicarProjetoPorToken(token)` **antes** de buscar o serviço (sem isso o banco respondia `nao_e_dono` e o botão parecia não fazer nada). O botão trava e mostra "Aceitando…" enquanto envia; se o banco recusar ou a rede falhar, aparece um aviso em português simples no topo da coluna (`mensagemDeErroDaAcao`: outra conta, trabalho que não aguarda mais resposta, sessão expirada, trabalho não encontrado, falha de conexão). Em caso de sucesso: `router.push` para `/acompanhamento/[token]`. "Recusar trabalho" segue a mesma regra e os mesmos avisos, mas pede confirmação num `DialogoConfirmacao` (botão seguro "Voltar" recebe o foco; não usa mais `window.confirm`).

**Query centralizada:** `STATUS_VISIVEIS = ['em_registro', 'pendente', 'aguardando_aceite', 'em_execucao', 'finalizado', 'em_disputa']` (`painelCliente.service.ts`). A lista de `/painel/perfil` (`cliente.service.ts`) busca só `pendente`, `em_execucao` e `finalizado`.

**`ServicoCard.tsx`** — card de projeto, botão de contato usa `buildLinkWhatsapp` (`lib/utils/whatsapp.ts`).

**`LoginGate.tsx`** — apresentacional. **`ZoomImageModal.tsx`** — foto ampliada como diálogo acessível (Esc e toque fora fecham, foco volta para quem abriu).

## Status do trabalho — fonte única

`lib/painel/statusDoServico.ts` (`statusVisualDoServico`, `estaProntoParaAvaliar`). Usada por `useServicosCliente` e `PainelDoCliente`; antes havia duas cópias e o mesmo trabalho aparecia com nomes diferentes.

| Situação | Nome na tela |
|---|---|
| caso de garantia aberto | Garantia |
| caso de reclamação aberto | Reclamação |
| `em_registro` | Em preparo |
| `pendente` / `aguardando_aceite` | Aguardando aceite |
| `em_execucao` e pronto para avaliar | Avaliar agora |
| `em_execucao` | Em andamento |
| `finalizado` | Concluído |
| `em_disputa` | Em análise |
| qualquer outro | Status indisponível (nunca mostra o código bruto) |

"Pronto para avaliar": fluxo com fotos → existe a foto de ordem 3; fluxo sem fotos → `marcado_concluido_at` preenchido. Nas duas telas, tocar num trabalho pronto leva a `/avaliar/[token]`.

## Avatar do prestador

`components/shared/AvatarPrestador.tsx`: foto → se não houver (ou não carregar), **ícone da área** (`categorias_grupos.icone` via `iconeDaCategoria`/`visualDaArea` em `lib/areaVisual.ts`, o mesmo da lista de busca) → sem ícone conhecido, iniciais coloridas. Usado em `ServicoCard`, `ServicoCardCompacto`, `PainelDoCliente` e `acompanhamento/CardPrestador`. As consultas dessas telas incluem `categoria:categorias(nome, categorias_grupos(icone))`.

Foto do Google do **prestador** não é usada de propósito: 940 dos 950 prestadores vêm da curadoria pública e não têm conta Google, o cliente não pode ler os dados de login de outra pessoa, e exibir a foto do Google de alguém sem consentimento é problema de privacidade. Se um dia for oferecida, deve ser opt-in no painel do prestador ("Usar minha foto do Google").

## Diálogos

`components/ui/Dialogo.tsx` (`DialogoAviso`, `DialogoConfirmacao`) + `hooks/useDialogoAcessivel.ts`: `role="dialog"`, `aria-modal`, título e descrição ligados, Esc fecha, Tab fica preso dentro, foco vai ao primeiro botão ao abrir e volta ao fechar, página atrás não rola. Substituem as caixas feitas à mão do painel do cliente e o `window.confirm`. `ErrorModal` e `ModalConfirmacao` (mais antigos) continuam no cadastro e no painel do prestador.

## Rolagem ao abrir

`hooks/useRolagemNoTopo.ts` — usado por `/meus-servicos`, `/avaliar/[token]` e `/acompanhamento/[token]`. Trava a restauração automática do navegador enquanto a tela está aberta e **devolve o valor anterior ao sair** (antes ficava em `manual` no resto do site).

## Vocabulário na área do cliente

"Área do cliente" (nome da área — não "Painel" nem "Portal do Cliente") e **"trabalho"** (não "projeto" nem "serviço") para o que o prestador fez/faz. "Aceitar trabalho" / "Recusar trabalho" (não "autorizar serviço"). O botão do anúncio padrão é "Buscar profissionais" e leva à home.

## Ajuda dentro da Área do cliente

Cada tela termina com um bloco `ContextualHelp` (ver "Central de ajuda" em `02-arquitetura.md`): `/painel/perfil` usa o contexto `dashboard-cliente` ("Precisa de ajuda com seus trabalhos?"), `/meus-servicos` usa `meus-servicos` e `/acompanhamento/[token]` usa `acompanhamento`. Os artigos (`lib/help/help-content.ts`) seguem o mesmo vocabulário desta tela — quando um nome de status, filtro ou botão mudar aqui, o artigo correspondente (`status-do-trabalho`, `aceitar-trabalho`, `acompanhar-servico`, `avaliar-servico`) muda junto.

## Tom calmo em todas as telas do cliente

Todas as telas da Área do cliente (`/painel/perfil`, `/meus-servicos`, `/acompanhamento/[token]`, `/avaliar/[token]`, `/meus-dados`) seguem a mesma regra: texto com no mínimo 12px, sem itálico nem caixa-alta pesada, contraste mínimo 4,5:1 (em fundo escuro, texto claro: `slate-200`/`slate-300`) e botões de 44px. `/meus-dados` usa o mesmo fundo e o mesmo espaçamento de topo das demais.

- **Compartilhar** (`useAcompanhamento.handleShare`): quando o aparelho não abre a janela de compartilhar, o link é copiado e a tela mostra um aviso (`avisoLink`, some em 4 s) — sem `alert` do navegador. Fechar a janela de compartilhar não mostra erro.
- **Botão da home** (`HeaderBotoes`): quem só é cliente vê um único botão, "Área do cliente". Prestador continua vendo "Cliente" e "Meu Painel".
- Textos do acompanhamento usam "trabalho" (não "serviço", "obra" ou "projeto").

## Perfil de cliente junto do de prestador e foto única — 20/11/2026

Quando o perfil de prestador entra no ar (`status = 'ativo'`), o **perfil de cliente** (`profiles`) é criado ou completado com o **nome** e a **foto**. O resto (WhatsApp, endereço) a pessoa preenche quando quiser. Quem tem os dois perfis usa a **mesma foto**: trocar em um lugar troca nos dois. A foto de cliente continua **opcional** para quem não é prestador. Decisão do dono.
- **Onde:** só no banco (migração `20261120140000_foto_unica_prestador_cliente`), em dois gatilhos que não dependem do app. O app continua gravando `prestadores.foto_perfil` e `profiles.avatar_url` como antes.
- **Prestador → cliente** (ao inserir ou mudar foto, nome, status ou dono do perfil): se a pessoa não tem linha em `profiles`, ela é criada com `role = 'prestador'`; o **nome** só é copiado quando o cliente ainda não tem nome (nunca sobrescreve); a **foto** sempre acompanha o prestador. Rascunho (`pendente`) não mexe no cliente.
- **Cliente → prestador:** só a foto, e só quando foi **enviada ao PQF** (bucket `fotos-perfil`). Foto do Google nunca sobrescreve a do prestador (o `usePerfilDados` grava a do Google no cliente quando está vazio).
- Sem laço: cada gatilho só grava quando o valor do outro lado é diferente. A migração também criou/completou o perfil de cliente de quem já tinha perfil de prestador no ar (a foto do prestador vale).
- Os dois perfis usam o mesmo bucket, e as exclusões de conta (`useConfirmarExclusaoConta`) removem prestador e cliente juntos; por isso o arquivo compartilhado não fica órfão.
- **Testes:** `tests/e2e/homologacao/foto-unica.spec.ts` (restaura o estado) e validação por SQL no banco de teste (6 cenários: perfil criado, nome preservado, rascunho não mexe, os dois sentidos da foto, Google não sobrescreve).
- **Aviso de produto:** a foto que o cliente envia pelo painel passa a ser também a foto pública do perfil de prestador. Ideia futura: texto no painel do cliente ("é a mesma foto do seu perfil de profissional") quando a pessoa tem os dois.
