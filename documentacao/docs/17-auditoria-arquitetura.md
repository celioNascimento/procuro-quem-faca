# 17. Auditoria de Arquitetura — Camadas service > hook > components > page

> Registro vivo dos desvios encontrados em relação ao padrão definido em `02-arquitetura.md`
> (Component → Hook → Service → Supabase, responsabilidade única por arquivo) e do plano de correção.
> Atualize o status de cada item conforme for resolvido. Última auditoria: 2026-11-03 · Correções aplicadas e verificadas no repositório em 2026-11-03.

## Como ler este documento

- **Prioridade**: 🔴 crítico (bug/quebra) · 🟠 alto (viola a arquitetura de forma visível) · 🟡 médio (organização/duplicidade) · ⚪ baixo (nice-to-have, já tem item no roadmap)
- **Status**: `pendente` · `em andamento` · `resolvido`
- A auditoria original foi feita por leitura estática do código colado numa conversa. Em 2026-11-03 cada item foi reconferido no repositório real (`main` @ `42220ec`) com `grep` antes de qualquer remoção; as notas **Verificação** abaixo registram o que foi encontrado.
- Validação: o ambiente onde as correções foram feitas não tinha acesso ao registro npm, então `tsc`/`lint`/testes não rodaram localmente; a validação veio do CI do GitHub (ver plano de ação, item 8). `pnpm build` não roda no CI (precisa das chaves do Supabase); fica para o deploy de preview da Vercel.

---

## 1. 🔴 Bug crítico — JSX quebrado em `AnunciosTab.tsx`

**Arquivo:** `components/dashboard/AnunciosTab.tsx`
**Status:** resolvido

**Verificação:** no `main` o `<a href={linkWhatsapp} ...>Ver Planos</a>` já estava com a tag de abertura correta (corrigido antes desta rodada). Nenhuma alteração necessária.

O botão "Ver Planos" está com a tag `<a>` sem abertura — só sobraram os atributos soltos, o que provavelmente quebra o build ou renderiza errado:

```tsx
// ANTES (quebrado)
<p className="...">Apareça no topo das buscas da sua cidade.</p>

  href={linkWhatsapp}
  target="_blank"
  rel="noopener noreferrer"
  className="..."

  Ver Planos
  
 </div>
```

**Onde e como aplicar:** em `components/dashboard/AnunciosTab.tsx`, substitua o trecho acima por:

```tsx
<a
  href={linkWhatsapp}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-8 block text-center w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
>
  Ver Planos
</a>
```


---

## 2. 🟠 Conflito de rota — `admin/anuncios`

**Arquivos:** `app/(admin)/admin/anuncios/page` (versão antiga, sem separação hook/service) **vs.** `app/(admin)/admin/anuncios/page.tsx` (versão correta, usa `useAdminAnuncios` + `AnuncioLojistaForm`/`AnuncioLojistaLista`/`MapaVagasPracas`/`MetricasAnuncios`)

**Status:** resolvido

**Verificação:** `app/(admin)/admin/anuncios/page` (sem extensão, JS legado de ~20 KB com `useState`/`supabase` inline) não era referenciado por nenhum import. Removido; permanece apenas `page.tsx`.

---

## 3. 🟠 Componentes/arquivos órfãos (admin)

**Status:** resolvido — `grep -r` confirmou zero referências antes de cada remoção

| Arquivo | Substituído por |
|---|---|
| `components/admin/AdminStatsTab.js` | já não existia no repositório (removido antes); substituído por `app/(admin)/admin/page.tsx` + `hooks/useAdminDashboard.ts` + `lib/services/adminDashboard.service.ts` |
| `components/admin/PainelAnuncios.tsx` | removido — `app/(admin)/admin/anuncios/page.tsx` + `AnuncioLojistaForm`/`AnuncioClienteForm` (o nome só aparecia como identificador interno da própria `page.tsx`) |
| `components/admin/ModeracaoCard.js` | removido — substituído por `components/admin/moderacao/DenunciaCard.tsx` (ver item 4) |
| `components/admin/ModalDenuncias.js` | removido — sem uso confirmado |
| `lib/categorias.tsx` (`CATEGORIAS_OFICIAIS`) | removido — a única referência era o `ModeracaoCard.js` órfão (as categorias vivas estão em `lib/db/categorias`, `config/categorias` e `types/categorias`) |

---

## 4. 🟠 Página fazendo papel de componente — `admin/moderacao/page.tsx`

**Arquivo:** `app/(admin)/admin/moderacao/page.tsx`
**Status:** resolvido

**Verificação:** `components/admin/moderacao/DenunciaCard.tsx` já existia e a página (78 linhas) já só orquestra `useModeracao()` + `<DenunciaCard>`. Faltava apenas remover o legado `ModeracaoCard.js` (feito no item 3). As props reais do componente são `onAtualizarMotivo`, `onArquivar`, `onResolverSemBloqueio`, `onResolverComBloqueio` e `onDesbloquear`.

A página injeta ~80 linhas de JSX do card de denúncia diretamente dentro do `.map()`, violando a camada `page` (que deveria só orquestrar).

**Onde e como aplicar:**
1. Criar `components/admin/moderacao/DenunciaCard.tsx` recebendo como props:
   ```ts
   { denuncia, processando, motivoBloqueio, onResolver, onArquivar, onBloquear }
   ```
2. Em `app/(admin)/admin/moderacao/page.tsx`, deixar só:
   ```tsx
   const { denuncias, ...filtros } = useModeracao();
   // ...
   {denuncias.map(d => <DenunciaCard key={d.id} denuncia={d} ... />)}
   ```

Isso também resolve o item 3 (`ModeracaoCard.js`) — o novo `DenunciaCard.tsx`, no lugar certo, passa a ser sua substituição oficial.

---

## 5. 🟠 Componentes chamando Supabase/fetch diretamente (violação de camada)

**Status:** resolvido

Padrão de referência já usado corretamente no projeto (seguir este modelo):
`hooks/useModeracao.ts` → `lib/services/denuncia.service.ts`
`hooks/useAdminLogs.ts` → `lib/services/adminLogs.service.ts`
`hooks/useHabilidades.ts` → `lib/services/habilidades.service.ts`
`app/(admin)/admin/geografia/hooks/useGeografia.ts` → `lib/db/geografia.ts`

| Componente | Problema | Correção proposta |
|---|---|---|
| `components/admin/anuncios/MetricasAnuncios.tsx` | Chama `createClient()`, `.from('anuncios')` e `fetch('/api/anuncios/metricas')` direto num `useEffect` | ✅ Já resolvido: `hooks/useMetricasAnuncios.ts` + `lib/services/adminAnunciosMetricas.service.ts` |
| `components/dashboard/AdCardDashboard.tsx` | Resolve sessão, busca prestador, busca anúncio e registra métrica, tudo inline | ✅ `hooks/useAdCardDashboard.ts` (sessão → prestador → anúncio da praça → métricas); o componente só renderiza |
| `components/painel/AdCardPainelCliente.tsx` | Mesmo padrão (busca cidade, busca anúncios, registra métrica inline) | ✅ `hooks/useAdCardPainelCliente.ts` + `lib/services/adCardPainelCliente.service.ts` (consultas ao Supabase isoladas no service) |
| `components/ads/AdCard.tsx` | Mais aceitável (recebe `anuncio` via prop), mas ainda tem `useEffect` chamando `registrarMetricaAnuncio` direto | ✅ `hooks/useAdCardMetricas.ts` (vigência + impressão + clique); o componente só renderiza |

---

## 6. 🟡 Hooks grandes demais (múltiplas responsabilidades)

**Status:** resolvido na parte proposta (hooks continuam grandes, mas com as responsabilidades listadas já separadas)

### `hooks/useUploadWizard.ts` (610 → 569 linhas)
Mistura: CRUD de fotos/projeto, validação de telefone/nome, geração de link do WhatsApp (`gerarLinkAceite`/`gerarLinkConclusao`), navegação do carrossel, polling/sync de status.

Divisão proposta:
- Manter `hooks/useUploadWizard.ts` como núcleo (upload de foto + estado do projeto)
- ✅ `hooks/useWizardWhatsappLinks.ts` — `gerarLinkAceite`/`gerarLinkConclusao`
- ✅ `hooks/useWizardCarrossel.ts` — `fotosCarrossel`, `fotoAtual`, `nextSlide`/`prevSlide`. O estado `currentSlide` continua no núcleo porque efeitos de comentário/status dependem dele
- Contrato de retorno de `useUploadWizard` (`state`/`derived`/`actions`) mantido idêntico, sem mudanças nos componentes do wizard
- ⚪ Ainda no núcleo (candidatos a futura extração): validação de telefone/nome e sync/polling de status

### `hooks/useCadastroPrestador.ts`
`handleSubmit` (~60 linhas) faz criação de conta, atualização de senha, limpeza de duplicidade, delete/upsert de prestador, login e redirect. ✅ O bloco criar-conta-ou-logar (`criarContaEmail` → fallback `loginEmail`) virou `autenticarOuCriarConta()` em `lib/services/cadastroPrestador.service.ts` (mesmo comportamento: lança `ALREADY_REGISTERED` se o e-mail existe e a senha não confere). `handleSubmit` agora chama uma linha.

---

## 7. 🟡 Duplicidade de arquivos de tipos e extensões erradas

**Status:** resolvido

- **`types/localizacao.ts` (raiz) vs `app/types/localizacao.ts`** — ambos exportam `Estado`, `Regiao`, `Cidade`, mas com formatos divergentes (um tem `ativa?: boolean`, o outro `regioes?: Regiao | null`). Risco real de bug por import ambíguo (`@/types/localizacao` vs `@/app/types/localizacao`).
  **Resolvido:** nenhum arquivo importava `app/types/localizacao` (todos usam `@/types/localizacao`), então o duplicado foi apenas deletado e `types/localizacao.ts` (raiz) permaneceu como fonte única. Obs.: o duplicado tinha `CidadeResumo` e campos anuláveis que não eram usados em lugar nenhum.
- **`lib/buscaUtils.tsx`** → renomeado para `lib/buscaUtils.ts` (sem JSX). Os imports (`usePrestadores.ts`, `adminAnuncios.service.ts`) usam `@/lib/buscaUtils` sem extensão, então nada precisou mudar. `lib/categorias.tsx` foi removido em vez de renomeado (código morto, item 3).
- **`app/types/css.d.ts`** → movido para `types/css.d.ts`; a pasta `app/types` deixou de existir. O `tsconfig.json` inclui `**/*.ts`, então o arquivo continua sendo carregado.

---

## Plano de ação

1. ✅ Registrar esta auditoria na documentação (este arquivo)
2. ✅ Bug crítico do item 1 (`AnunciosTab.tsx`) — já corrigido no `main`
3. ✅ Conflito de rota do item 2 (`admin/anuncios/page` vs `page.tsx`)
4. ✅ Órfãos do item 3 e `DenunciaCard.tsx` do item 4
5. ✅ Extrações do item 5 (`useAdCardDashboard`, `useAdCardPainelCliente`, `useAdCardMetricas`)
6. ✅ Hooks grandes do item 6 e tipos/extensões do item 7
7. ✅ `handleExcluirContaTotal` duplicado em `EditarPerfilTab.tsx`: não existe mais no código; a exclusão de conta aponta para `/confirmar-exclusao` (`components/account/DangerZone.tsx`)
8. ✅ Testes, lint e tipos validados pelo CI do GitHub na branch `refactor/auditoria-arquitetura` (commit `4cc22bf`, 03/11/2026): 12 arquivos e 95 testes passando, `eslint` e `tsc --noEmit` sem erros
9. 🔲 Conferir o deploy de preview da Vercel (build) antes do merge
10. 🔲 Trabalho de design maior (geolocalização, login obrigatório, vitrine paga) — requer sessão de design dedicada antes de codar, conforme `13-roadmap.md`

## Nota sobre acesso ao repositório

As correções foram aplicadas em branch separada de `celioNascimento/procuro-quem-faca` (a partir do `main` @ `42220ec`), para revisão via pull request.
