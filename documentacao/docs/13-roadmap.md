# Roadmap — PQF

Funcionalidades planejadas ou em avaliação, e pendências técnicas conhecidas. Não é um compromisso de prazo.

## Em avaliação

### Avaliação bidirecional (prestador avalia cliente)

**Problema:** hoje a confiança é assimétrica — só o prestador é avaliado.

**Proposta de MVP:** nota (1–5) + tags rápidas ("Pagamento em dia", "Comunicação clara", "Ambiente organizado"), sem texto livre. Não público — só resumo agregado para o próximo prestador que for atender aquele cliente.

**Riscos:** retaliação (considerar liberar avaliação do prestador só depois do cliente avaliar, ou ocultar simultaneamente até ambos avaliarem); não assustar clientes novos na primeira experiência.

**Fase 2 (se validado):** comentário livre com moderação.

### Geolocalização real, login obrigatório no ciclo do serviço, e vitrine paga

**Problema:** segmentação por localização hoje não é confiável — `bairro` é texto livre, sem normalização, e não permite cálculo de distância/raio. Além disso, `/acompanhamento/[token]` e `/avaliar/[token]` são acessados só pelo token, sem sessão — identidade do cliente é apenas `cliente_whatsapp` (texto), sem vínculo de conta.

**Decisões fechadas (design, ainda não implementado):**

1. **Login obrigatório desde o início do ciclo do serviço.** Prestador continua indicando o cliente só pelo WhatsApp ao criar o projeto (sem fricção nessa ponta). Cliente precisa logar com Google ao abrir o link do projeto pela primeira vez — a primeira conta que logar a partir do token daquele projeto "reivindica" o vínculo (mesmo princípio já usado na reivindicação de perfil de prestador via `origem_tipo: 'curadoria_publica'`). Novo campo: `portfolio_projetos.cliente_user_id` (nullable, preenchido no primeiro login via aquele token).

2. **Cadastro completo só é exigido no momento de avaliar**, não no login. Login leve (só Google) já basta para acompanhar fotos/timeline/informações do projeto livremente. O bloqueio de "complete seu cadastro" aparece só no botão de avaliar — é aí que nome + endereço/geo passam a ser obrigatórios.

3. **Sem migração de dados** — ainda não há projetos em produção no fluxo atual, então o modelo novo pode ser desenhado limpo.

4. **Endereço/coordenada substitui bairro em texto livre.** Endereço continua obrigatório no cadastro (prestador e cliente), mas agora vira coordenada via geocode (Nominatim, já usado no projeto para busca). Geolocalização do dispositivo é sugestão confirmável, nunca gravada sem confirmação humana — endereço digitado é o fallback para quem nega permissão. Coordenada do cliente armazenada com precisão reduzida (2–3 casas decimais) por privacidade.

5. **Dois sistemas de monetização por localização, mantidos deliberadamente separados** — sem vínculo formal entre `prestadores` e `anunciantes`:

| | Anúncios (lojista/fornecedor) | Vitrine (prestador) |
|---|---|---|
| Quem compra | `anunciantes` (pessoa/empresa externa) | O próprio prestador |
| Modelo de cobrança | Leilão CPC (clique/impressão) | Lance recorrente (paga, fica no topo enquanto durar) |
| Posição | Banners em `AdCard` | Topo do ranking de busca de prestadores |
| Desempate | `lance_maximo_cpc desc` | lance desc → nota média desc → `created_at` asc |
| Tabelas | `anunciantes`, `anuncios`, `anuncios_metricas_diarias` (já existem) | Novas colunas em `prestadores` |

**Schema proposto (não implementado ainda):**
```sql
-- Localização
prestadores.latitude numeric(9,6)
prestadores.longitude numeric(9,6)
prestadores.endereco_texto text
prestadores.raio_atuacao_km integer

profiles.latitude numeric(9,6)      -- cliente, precisão reduzida
profiles.longitude numeric(9,6)
profiles.endereco_texto text

-- Vínculo conta-projeto
portfolio_projetos.cliente_user_id uuid references auth.users(id) on delete set null

-- Vitrine paga (independente de anunciantes)
prestadores.vitrine_lance_atual numeric(10,2) default 0.00
prestadores.vitrine_pago_ate timestamp with time zone
```

**Pendências técnicas a resolver antes de implementar:**
- [ ] Definir onde vive a coordenada do cliente: `profiles` (decisão provisória acima) ou tabela separada
- [ ] Habilitar extensão Postgres para cálculo de distância (`cube`/`earthdistance`, ou avaliar PostGIS) no Supabase
- [ ] Nova policy de RLS em `portfolio_projetos`: `SELECT` liberado para `cliente_user_id = auth.uid()` OU prestador dono
- [ ] Definir campos exatos exigidos no gate de "completar cadastro" da avaliação (nome + endereço — confirmar se mais algum campo)
- [ ] Fluxo de billing da vitrine — como o lance é cobrado/renovado (só a mecânica de ranking está desenhada, não a cobrança)
- [ ] Revisitar `origem_tipo: 'vitrine'` (hoje um valor solto sem lance real por trás) à luz deste modelo — provável que a vitrine paga substitua/formalize esse valor

**Impacto em módulos já documentados, quando implementado:**
- `useAcompanhamento`/`useAvaliar` (`09-avaliacao-acompanhamento.md`) passariam a exigir sessão, hoje não exigem
- `SecaoLocalizacao.tsx`/`FormCidade` etc. (bairro em texto livre) seriam substituídos por captura de coordenada
- `lib/services/localizacao.service.ts` ganharia geocode real, hoje só lista estado/região/cidade
- `origem_tipo: 'vitrine'` (`03-banco-de-dados.md`) ganharia mecânica de lance real

### Card de destaque de perfil do prestador nos resultados de busca

Hoje `AnunciosTab.tsx` (dashboard) só direciona o prestador ao WhatsApp institucional para manifestar interesse — não há um fluxo de contratação nem um card real de destaque nos resultados de `/prestadores`. Este item converge com o design de "Vitrine paga" descrito no item acima (Geolocalização/Login obrigatório/Vitrine) — a mecânica de lance e desempate já está desenhada ali; falta o fluxo de contratação/billing e a UI do card em si.

### SEO dinâmico por região

`app/metadata.ts` é 100% estático e global, sem citar cidades (decisão deliberada — evitar hardcode dado que o produto pode expandir para múltiplas regiões). Para aproveitar SEO local de fato (ex: "eletricista em Londrina"), seria necessário metadata dinâmico por rota/cidade via `generateMetadata()` do Next.js — escopo maior que uma correção pontual.

### Página "Como funciona"

Explicar o diferencial do PQF (registro fotográfico + avaliação vinculada a projeto) para os dois públicos (cliente e prestador). Hoje o botão "Como funciona" tem peso visual igual a "Sugerir categoria" na home — considerar mais destaque, especialmente perto do banner "Sou profissional".

## Pendências técnicas — Área Administrativa

- [ ] Revisar `/admin/ativacao` e `/admin/anuncios` — ainda não auditados
- [ ] Confirmar se `acao='FILTRO_CATEGORIA'` é gravada em algum ponto do frontend — o ranking de "categorias mais buscadas" no dashboard admin depende desse log e provavelmente está sempre vazio na prática
- [ ] Validar em homologação o novo fluxo de `/admin/moderacao` (revisão de denúncias) — os valores de status (`resolvida`/`arquivada`) e a ação de bloqueio foram implementados por suposição a partir do schema documentado de `denuncias`/`prestadores`, sem confirmação de colunas adicionais que possam existir (ex: quem revisou, data de resolução)
- [ ] Confirmar se a inserção de prestadores via `/admin/povoar` funciona de ponta a ponta após a correção do campo `categoria` inexistente (nunca havia funcionado antes)

## Pendências técnicas

- [ ] Migrar `EditarPerfilTab.tsx` (Dashboard do Prestador) para usar `/confirmar-exclusao` — última implementação divergente do fluxo de exclusão de conta (ver `14-glossario.md`, seção Exclusão de conta)
- [ ] Mapear/decidir sobre `LocationModal`/`LocationContext` — construído mas não conectado (modal obrigatório de seleção de cidade). Decisão atual: manter desconectado até haver clareza de que múltiplas regiões justificam essa fricção
- [ ] Finalizar refatoração do wizard do prestador — integrar `WizardForm.tsx`/`WizardTimeline.tsx`/`PrestadorCardHorizontal.tsx` em `UploadWizardContainer.tsx` (hoje ainda com hero/form/timeline inline)
- [ ] Confirmar se `avaliacoes` tem constraint de unicidade por `projeto_id` (parece ser 1 por projeto pela UI, sem constraint explícita confirmada no schema)
- [ ] Documentar formalmente o significado de negócio de `origem_tipo: 'vitrine'`
- [ ] Padronizar nome do parâmetro de URL de retorno — `?from=` (perfil público) vs. `?origem=` (dashboard), mesma função, nomes diferentes
- [ ] Avaliar se `usePrestadores` deveria usar a view `prestadores_ranqueados` em vez de recalcular médias no frontend
- [ ] Confirmar se tabela `perfis` (legado) tem dado real antes de remover do schema
- [ ] Unificar `useAuth().role` com `profiles.role` — divergência hoje é de escopo pequeno (só durante o cadastro), mas ainda são duas fontes em paralelo
- [ ] Avaliar se `useAdContext` deveria recalcular o fallback quando `categoria` muda (hoje usa `useState` com inicializador, não reage a mudanças)
- [ ] Revisar `PerfilCTA.tsx` e demais pontos que montam link de WhatsApp — confirmar que todos usam `lib/utils/whatsapp.ts` (`buildLinkWhatsapp`) em vez de montar a URL manualmente
- [ ] Avaliar consolidar as 3 implementações de logout (`useLogout`, `logoutCliente`, chamada direta em `useConfirmarExclusaoConta`) — mantidas separadas por decisão consciente, não por necessidade técnica
- [ ] Conversão gradual de arquivos `.js`/`.jsx` remanescentes para `.ts`/`.tsx` — grande parte da área `(admin)` já convertida; verificar o que ainda resta em `ativacao`/`anuncios`
- [ ] Avaliar se os handlers sem tipagem em `FormEstado.tsx`/`FormRegiao.tsx`/`FormCidade.tsx` (`/admin/geografia`) merecem tipagem explícita (funcional hoje, só inconsistente com o resto do projeto)
- [ ] Personalizar `app/sucesso/page.tsx` com dados do projeto/prestador avaliado (hoje texto genérico)
- [ ] Extrair componente `<Avatar>` compartilhado se o visual de avatar for unificado entre cliente/prestador/futuros anunciantes (ver `14-glossario.md`, seção Avatar, para os 6 pontos hoje independentes)
- [ ] Se for centralizar a derivação de rótulo/cor a partir de `portfolio_projetos.status`, ver `14-glossario.md` para os 6 pontos hoje implementados independentemente
- [ ] Testes automatizados (Vitest) cobrindo fluxos críticos (upload, legenda, autenticação) além dos já existentes
- [ ] Documentar módulo de gestão de geografia (`app/(admin)/admin/geografia`, `lib/db/geografia.ts`) — não mapeado em detalhe ainda
- [ ] Confirmar `AnunciosTab.tsx` está de fato renderizado em algum ponto do dashboard (não localizado em revisão anterior)

## Decisões de escopo já tomadas

- **Chat em tempo real** — não será implementado. WhatsApp já cumpre o papel; comentários por foto (`portfolio_comentarios`) são o mecanismo de feedback assíncrono do produto.
- **Confirmação de e-mail** — hoje desligada no Supabase. Se ativada, `signUp` em `useLoginForm.handleLogin` passaria a criar conta sem sessão imediata; o código já cobre esse caso residual (`garantirRoleInicial` roda no próximo login real via `redirecionarUsuario`), mas testar antes de ativar em produção.
- **`components/perfil/` vs `components/profile/`** — não é duplicação, ver `02-arquitetura.md`.
- **Fallback do módulo de anúncios como CTA direto de WhatsApp** — decisão consciente enquanto não há tráfego suficiente para operacionalizar o leilão real (infraestrutura já pronta no banco).
- **`/admin/moderacao` reconstruída do zero** — o arquivo anterior sob essa rota era, por engano, uma cópia do formulário de cadastro de prestador, sem nenhuma relação com moderação de denúncias. Substituído por uma implementação real de revisão/resolução/arquivamento de denúncias.
- **Duplicações de logging/lógica removidas:** `lib/logger.tsx`, `lib/avaliacaoUtils.ts`, `lib/queryPrestadores.tsx`, `components/auth/escolha/page.js`, `lib/db/cookieConsent.ts`/`cookieConsentLog.ts` — todos órfãos confirmados (sem consumidor real fora de si mesmos ou de testes), removidos. `logs_atividades` via `lib/db/logs.ts` é a única fonte de log de atividades do projeto.

---

*Este documento deve ser revisado e atualizado conforme decisões de produto avançam.*