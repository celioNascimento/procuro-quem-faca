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

## Planejado

- [ ] Documentação estruturada do repositório (`README.md` + `/docs`) — em andamento
- [ ] Refino do fluxo de rotas para prestadores com status pendente
- [ ] Testes automatizados (Vitest) cobrindo fluxos críticos (upload, legenda, autenticação)

## Concluído recentemente

- [x] Roteamento condicional: prestador com cadastro pendente é direcionado para completar cadastro em vez do dashboard
- [x] Fix de scroll/altura no modal de zoom de fotos (`ModalFotoBase`)
- [x] Correção de stale closure no `WizardZoomModal` / `handleSalvarLegenda`

---

*Este documento deve ser revisado e atualizado conforme decisões de produto avançam.*