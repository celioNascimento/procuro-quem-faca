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

- [ ] Conversão gradual de arquivos `.js`/`.jsx` restantes para `.ts`/`.tsx` (ex: `app/recuperar-senha` / `NovaSenha`, `HeaderMobile.js`, `Footer.js`, `FooterWrapper.js`, `not-found.js`, `sitemap.js`) — feito arquivo por arquivo para não quebrar nada
- [ ] Reorganizar `components/perfil/` vs `components/profile/` — provável duplicação PT/EN
- [ ] Resolver duplicação `perfis` vs `profiles` no banco

- [ ] Documentação estruturada do repositório (`README.md` + `/docs`) — em andamento
- [ ] Refino do fluxo de rotas para prestadores com status pendente
- [ ] Testes automatizados (Vitest) cobrindo fluxos críticos (upload, legenda, autenticação)

## Concluído recentemente

- [x] Proteção real da área `(admin)` via middleware + `perfis_admin` (antes, qualquer usuário autenticado acessava `/admin` sem checagem)
- [x] Centralização do client Supabase em `lib/supabase/{client,server}.ts`, com `lib/supabase.ts` mantido como re-export de compatibilidade
- [x] Roteamento condicional: prestador com cadastro pendente é direcionado para completar cadastro em vez do dashboard
- [x] Fix de scroll/altura no modal de zoom de fotos (`ModalFotoBase`)
- [x] Correção de stale closure no `WizardZoomModal` / `handleSalvarLegenda`

---

*Este documento deve ser revisado e atualizado conforme decisões de produto avançam.*