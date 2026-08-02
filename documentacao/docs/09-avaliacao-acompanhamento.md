# Avaliação e Acompanhamento — PQF

Complementa `02-arquitetura.md`. Ver `14-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

## Avaliação

**Rota:** `app/avaliar/[token]/page.tsx` + `hooks/useAvaliacao.ts` (export `useAvaliar`) + `lib/services/avaliacao.service.ts`

Reaproveita `CardPrestador`/`RodapeSeguranca` do Acompanhamento. `CarrosselFinalizacao` (3 fotos finais) + `BlocoAvaliacao` (nota/comentário/indica).

**Submit** (`handleFinalizarAvaliacao`): `inserirAvaliacao` (`status: 'finalizado'`, `visivel: true`) → `finalizarProjeto` → `router.push('/sucesso')`. Se `avaliacaoExistente?.status === 'finalizado'`, oculta `BlocoAvaliacao`.

### `FormularioAvaliacao.tsx` (ativo, `components/profile/`)

Delega a `useSubmitAvaliacao` (`lib/services/avaliacao.service.ts` + `uploadWizard.service.ts` para upload). Checkbox "Reportar problema/Solicitar Garantia" ativa modo contestação: oculta estrelas, ativa `FotosEvidenciaPicker` (upload múltiplo, `MAX_ARQUIVOS`, preview com `useMemo`+`revokeObjectURL` para evitar vazamento de memória). Submit grava `nota:1`, `em_disputa:true`, `visivel:false`, cria linha em `contestacoes` + `marcarProjetoEmDisputa`.

Este fluxo de contestação é distinto do fluxo linear pós-serviço (`useAvaliar`) — ponto de renderização real ainda não totalmente mapeado.

### `AvaliacoesTab`/`AvaliacaoCard`/`AvaliacoesResumo`

Não conectados a nenhuma tela. `PerfilAvaliacoes` (em produção) esconde a seção quando vazia; `calcularStats` (`lib/utils/avaliacao.utils.ts`) só marca `exibir: true` com 10+ avaliações — decisão de produto para o volume atual.

## Acompanhamento do Cliente

**Rota:** `app/acompanhamento/[token]/page.tsx` + `hooks/useAcompanhamento.ts`

Acesso via `avaliacao_token`, sem login. Duas colunas: `CardPrestador`+`StatusMini`+`RodapeSeguranca` / `LinhaDeTempo`.

**`LinhaDeTempo.tsx`** usa `TimelineVertical` (`components/shared/`, compartilhado com o wizard do prestador). Cada nó clicável abre `ModalDiscussao` (comentários por foto, `onKeyDown` de Enter valida campo não-vazio, consistente com o botão de envio).

**Componentes de `components/acompanhamento/`** — todos puramente apresentacionais, sem I/O direto:

| Componente | Papel |
|---|---|
| `CardPrestador.tsx` | Card do prestador + contato (usa `buildLinkWhatsapp`) + rótulo de status dinâmico conforme `projeto.status` |
| `CarrosselFinalizacao.tsx` | Carrossel de fotos finais (tela de Avaliação) |
| `LinhaDeTempo.tsx` | Timeline do cliente, badge de status por 3 estados reais |
| `ModalDiscussao.tsx` | Chat por foto (comentários cliente/prestador) |
| `BlocoAvaliacao.tsx` | Formulário de nota/comentário/indica |
| `RodapeSeguranca.tsx` | Estático, sem props |
| `StatusMini.tsx` | Dois cards de resumo (progresso, registros) |

## Reivindicação de Perfil

**Rota:** `app/reivindicar/page.tsx` — puramente apresentacional, sem I/O. Redireciona para `/cadastro?reivindicar=<id>`, toda lógica real vive no Cadastro (`05-cadastro-prestador.md`).

## Página de Sucesso

**Rota:** `app/sucesso/page.tsx` — estática. Botão "Compartilhar Resultado" usa `navigator.share`/fallback de clipboard com texto genérico (a página não recebe dados do projeto/prestador avaliado — pendência de personalização, ver `13-roadmap.md`).

## Denúncia

**Rota:** `app/denunciar/[id]/page.tsx` + `lib/services/denuncia.service.ts` (`criarDenuncia`). Formulário → tabela `denuncias` (`status: 'aberta'`). Aviso de "banimento por denúncia falsa" é só texto informativo. Revisão/moderação de denúncias vive em `12-admin.md`.

## Exclusão de Conta

**Rota:** `app/confirmar-exclusao/page.tsx` — ver `04-autenticacao.md`.

## Chat em tempo real

**Decisão de produto: não implementado.** WhatsApp já cumpre esse papel. Nenhum código ativo referencia `projeto_mensagens`. Comentários pontuais por foto (`portfolio_comentarios`, via `ModalDiscussao`/`WizardZoomModal`) são o mecanismo de feedback assíncrono do produto.