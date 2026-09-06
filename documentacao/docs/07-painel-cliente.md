# Painel do Cliente — PQF

Complementa `02-arquitetura.md`. Ver `00-glossario.md` para localizar um conceito específico em todos os módulos que o tocam.

**Rota:** `app/painel/perfil/page.tsx` (dados) e `app/meus-servicos/page.tsx` (lista de serviços)

## `PerfilDoCliente` (`app/painel/perfil/page.tsx`)

**Hook:** `usePerfilCliente`, compondo `usePerfilDados` (dados pessoais, avatar — não trata exclusão de conta), `useServicosCliente` (busca por whatsapp, filtros, `getRotaDestino`), `usePerfilUI` (aba ativa, modal de saída com alterações não salvas via `beforeunload`).

**Roteamento contextual** (`getRotaDestino`):
```
status='pendente' → /meus-servicos?token=...
status='em_execucao' sem foto 3 → /acompanhamento/[token]
status='em_execucao' com foto 3 → /avaliar/[token]
default → /avaliar/[token]
```

**Exclusão de conta:** botão na Zona de Perigo linka para `/confirmar-exclusao` (fluxo único, ver `04-autenticacao.md`).

## `PainelDoCliente` (`app/meus-servicos/page.tsx`)

**Hook:** `usePainelCliente` + `lib/services/painelCliente.service.ts` (`getProfile`, `getServicoPorToken`, `getServicosPorWhatsapp`, `aceitarServico`, `loginComGoogle`).

Acesso via `?token=` ou fallback por whatsapp salvo. `LoginGate` (`components/meus-servicos/LoginGate.tsx`) se sem sessão — usa `loginComGoogle` deste service (não passa por `useGoogleAuth`).

Filtros: Todos/Pendentes/Em andamento/Concluídos. `handleAceitar` atualiza `status: 'em_execucao'` + feedback otimista local + `router.push` (sem hard reload).

**Query centralizada:** `STATUS_VISIVEIS = ['em_registro', 'pendente', 'em_execucao', 'finalizado']` — só os 4 valores reais.

**`ServicoCard.tsx`** — card de projeto, botão de contato usa `buildLinkWhatsapp` (`lib/utils/whatsapp.ts`).

**`LoginGate.tsx`, `ZoomImageModal.tsx`** — apresentacionais.
