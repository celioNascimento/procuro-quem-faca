# Roadmap — PQF

Funcionalidades planejadas ou em avaliação, e pendências técnicas conhecidas. Não é um compromisso de prazo.

## Em avaliação

### Avaliação bidirecional (prestador avalia cliente)

**Problema:** hoje a confiança é assimétrica — só o prestador é avaliado.

**Proposta de MVP:** nota (1–5) + tags rápidas ("Pagamento em dia", "Comunicação clara", "Ambiente organizado"), sem texto livre. Não público — só resumo agregado para o próximo prestador que for atender aquele cliente.

**Riscos:** retaliação (considerar liberar avaliação do prestador só depois do cliente avaliar, ou ocultar simultaneamente até ambos avaliarem); não assustar clientes novos na primeira experiência.

**Fase 2 (se validado):** comentário livre com moderação.

### Card de destaque de perfil do prestador nos resultados de busca

Hoje `AnunciosTab.tsx` (dashboard) só direciona o prestador ao WhatsApp institucional para manifestar interesse — não há um fluxo de contratação nem um card real de destaque nos resultados de `/prestadores`. Possível conexão com `prestadores.origem_tipo = 'vitrine'` (já usado para prioridade máxima na busca), cujo significado de negócio completo (destaque pago? curadoria editorial?) ainda não está formalmente confirmado.

### SEO dinâmico por região

`app/metadata.ts` é 100% estático e global, sem citar cidades (decisão deliberada — evitar hardcode dado que o produto pode expandir para múltiplas regiões). Para aproveitar SEO local de fato (ex: "eletricista em Londrina"), seria necessário metadata dinâmico por rota/cidade via `generateMetadata()` do Next.js — escopo maior que uma correção pontual.

### Página "Como funciona"

Explicar o diferencial do PQF (registro fotográfico + avaliação vinculada a projeto) para os dois públicos (cliente e prestador). Hoje o botão "Como funciona" tem peso visual igual a "Sugerir categoria" na home — considerar mais destaque, especialmente perto do banner "Sou profissional".

## Pendências técnicas

- [ ] Migrar `EditarPerfilTab.tsx` (Dashboard do Prestador) para usar `/confirmar-exclusao` — última implementação divergente do fluxo de exclusão de conta (ver `08-glossario.md`, seção Exclusão de conta)
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
- [ ] Conversão gradual de arquivos `.js`/`.jsx` remanescentes para `.ts`/`.tsx` (verificar quais ainda restam no projeto)
- [ ] Personalizar `app/sucesso/page.tsx` com dados do projeto/prestador avaliado (hoje texto genérico)
- [ ] Extrair componente `<Avatar>` compartilhado se o visual de avatar for unificado entre cliente/prestador/futuros anunciantes (ver `08-glossario.md`, seção Avatar, para os 6 pontos hoje independentes)
- [ ] Se for centralizar a derivação de rótulo/cor a partir de `portfolio_projetos.status`, ver `08-glossario.md` para os 6 pontos hoje implementados independentemente
- [ ] Testes automatizados (Vitest) cobrindo fluxos críticos (upload, legenda, autenticação) além dos já existentes
- [ ] Documentar módulo de gestão de geografia (`app/(admin)/admin/geografia`, `lib/db/geografia.ts`) — não mapeado em detalhe ainda
- [ ] Confirmar `AnunciosTab.tsx` está de fato renderizado em algum ponto do dashboard (não localizado em revisão anterior)

## Decisões de escopo já tomadas

- **Chat em tempo real** — não será implementado. WhatsApp já cumpre o papel; comentários por foto (`portfolio_comentarios`) são o mecanismo de feedback assíncrono do produto.
- **Confirmação de e-mail** — hoje desligada no Supabase. Se ativada, `signUp` em `useLoginForm.handleLogin` passaria a criar conta sem sessão imediata; o código já cobre esse caso residual (`garantirRoleInicial` roda no próximo login real via `redirecionarUsuario`), mas testar antes de ativar em produção.
- **`components/perfil/` vs `components/profile/`** — não é duplicação, ver `02-arquitetura.md`.
- **Fallback do módulo de anúncios como CTA direto de WhatsApp** — decisão consciente enquanto não há tráfego suficiente para operacionalizar o leilão real (infraestrutura já pronta no banco).

---

*Este documento deve ser revisado e atualizado conforme decisões de produto avançam.*