# Painel do Cliente — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Rota:** `app/painel/perfil/page.tsx` (dados) e `app/meus-servicos/page.tsx` (lista de serviços)

## `PerfilDoCliente` (`app/painel/perfil/page.tsx`)

**Hook:** `usePerfilCliente`, compondo `usePerfilDados` (dados pessoais, avatar — não trata exclusão de conta), `useServicosCliente` (busca por whatsapp, filtros, `getRotaDestino`), `usePerfilUI` (aba ativa, modal de saída com alterações não salvas via `beforeunload`).

**Roteamento contextual** (`getRotaDestino`):
```
status='pendente' → /meus-servicos?token=...
status='em_execucao' em fluxo com fotos e sem etapa final concluída → /acompanhamento/[token]
status='em_execucao' no fluxo sem fotos após `marcado_concluido_at` → /avaliar/[token]
status='em_execucao' com etapa final de fotos concluída → /avaliar/[token]
default → /avaliar/[token]
```

**Exclusão de conta:** botão na Zona de Perigo linka para `/confirmar-exclusao` (fluxo único, ver `04-autenticacao.md`).

## `PainelDoCliente` (`app/meus-servicos/page.tsx`)

**Hook:** `usePainelCliente` + `lib/services/painelCliente.service.ts` (`getProfile`, `getServicoPorToken`, `getServicosPorWhatsapp`, `aceitarServico`, `loginComGoogle`).

Acesso via `?token=` ou fallback por whatsapp salvo. `LoginGate` (`components/meus-servicos/LoginGate.tsx`) se sem sessão — usa `loginComGoogle` deste service (não passa por `useGoogleAuth`).

Filtros: Todos/Pendentes/Em andamento/Concluídos.

**Autorizar Serviço (`handleAceitar`):** só a conta dona do serviço (`cliente_user_id`) pode autorizar — regra da função `aceitar_projeto` no banco. Quem abre o link com `?token=` vira dona ao entrar: `usePainelCliente` chama `reivindicarProjetoPorToken(token)` **antes** de buscar o serviço (sem isso o banco respondia `nao_e_dono` e o botão parecia não fazer nada). O botão trava e mostra "Autorizando…" enquanto envia; se o banco recusar ou a rede falhar, aparece um aviso em português simples no topo da coluna (`mensagemDeErroDaAcao`: outra conta, serviço já autorizado, sessão expirada, serviço não encontrado, falha de conexão). Em caso de sucesso: `router.push` para `/acompanhamento/[token]`. "Recusar serviço" segue a mesma regra e os mesmos avisos.

**Query centralizada:** `STATUS_VISIVEIS = ['em_registro', 'pendente', 'em_execucao', 'finalizado']` — só os 4 valores reais.

**`ServicoCard.tsx`** — card de projeto, botão de contato usa `buildLinkWhatsapp` (`lib/utils/whatsapp.ts`).

**`LoginGate.tsx`, `ZoomImageModal.tsx`** — apresentacionais.
