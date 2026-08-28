# 📋 Portfolio Obrigatório - Feature

## 📝 Descrição

Esta PR implementa a funcionalidade de **portfólio opcional** para prestadores de serviços no Procuro Quem Faça.

### Problema
Atualmente, fotos no portfólio são obrigatórias no início e fim de todos os serviços. Porém, alguns tipos de serviço (como massagem, quiropraxia) valorizam mais as **avaliações** do que o portfólio visual.

### Solução
Permitir que cada prestador **ative/desative** a obrigatoriedade de fotos de forma global, com:
- ✅ **Aceite do cliente** sempre obrigatório no início e fim
- ⚡ **Fotos** opcionais se desativado pelo prestador
- 🎯 **Aba de portfólio** oculta no perfil público se desativado
- 🔄 **Validação dinâmica** no fluxo de registro de serviço

---

## 🔧 Alterações Técnicas

### 1. **Banco de Dados**
- ✅ Migration: Adiciona coluna `portfolio_obrigatorio` (BOOLEAN, DEFAULT true) na tabela `prestadores`
- ✅ Index criado para performance

**Migration:**
```sql
ALTER TABLE public.prestadores ADD COLUMN portfolio_obrigatorio BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX idx_prestadores_portfolio_obrigatorio ON public.prestadores(portfolio_obrigatorio);
```

### 2. **Backend - Services**
- `lib/services/prestadorPerfil.service.ts` (NOVO)
  - `updatePortfolioObrigatorio()` — atualiza configuração
  - `atualizarPerfilPrestador()` — atualiza múltiplos campos
  - `getPrestador()` — busca dados

- `lib/services/uploadWizard.service.ts` (MODIFICADO)
  - `validarRequisitosFinalizacao()` — valida obrigatoriedade de fotos

### 3. **Frontend - Componentes**
- `components/dashboard/PortfolioToggle.tsx` (NOVO)
  - Toggle UI para ativar/desativar portfólio obrigatório
  - Estados de carregamento e erro

- `components/dashboard/EditarPerfilTab.tsx` (MODIFICADO)
  - Integra `PortfolioToggle` em "Dados Profissionais"
  - Permite prestador gerenciar configuração

- `components/profile/PerfilTabs.tsx` (MODIFICADO)
  - Renderiza aba de portfólio condicionalmente
  - Se `portfolio_obrigatorio = false`, oculta aba
  - Começa em "Avaliações" se portfólio desativado

- `app/(perfil)/[slug]/page.tsx` (MODIFICADO)
  - Passa `portfolioObrigatorio` para `PerfilTabs`

### 4. **Frontend - Hooks**
- `hooks/useEditarPerfilPrestador.ts` (NOVO)
  - Gerencia estado de edição de perfil
  - `handleTogglePortfolio()` — toggle da configuração
  - `handleAtualizarPerfil()` — atualização geral

### 5. **TypeScript Types**
- `types/prestador.ts` (MODIFICADO)
  - Adicionado campo `portfolio_obrigatorio: boolean`

---

## 📊 Fluxo de Integração

```
Dashboard Prestador
  ↓
[Dados Profissionais]
  ↓
PortfolioToggle ON/OFF
  ↓
updatePortfolioObrigatorio()
  ↓
Perfil Público
  ↓
PerfilTabs (condicional)
  ├─ Se ON → mostra "Portfólio"
  └─ Se OFF → mostra só "Avaliações"
  ↓
Upload Wizard (novo serviço)
  ↓
validarRequisitosFinalizacao()
  ├─ Se ON → exige fotos
  └─ Se OFF → fotos opcionais
```

---

## ✅ Próximas Etapas (Após Merge)

1. **Executar migration** no Supabase
2. **Integrar validação** em `UploadWizardContainer.tsx`
   - Usar `validarRequisitosFinalizacao()` em handleIniciarServico/handleFinalizarServico
3. **Testar fluxo completo:**
   - Toggle em "Dados Profissionais" ✓
   - Perfil público mostra/oculta portfólio ✓
   - Serviço bloqueia/permite sem foto ✓
4. **Deploy** em produção

---

## 🎨 Design/UX

- **Toggle color scheme:**
  - ON (Ativado): Verde 🟢
  - OFF (Desativado): Laranja 🟠

- **Mensagens claras:**
  - ON: "Fotos são obrigatórias no início e fim do serviço"
  - OFF: "Fotos são opcionais — aceite do cliente ainda é obrigatório"

---

## 🚀 Status

- [x] Backend (services + types)
- [x] Frontend (components + hooks)
- [x] Database (migration)
- [ ] Integração no Upload Wizard (próxima PR ou commit)
- [ ] Testes
- [ ] Deploy

---

## 📌 Commits

- `feat: add portfolio_obrigatorio field and migration`
- `feat: integrate portfolio toggle in edit profile, public profile, and upload wizard validation`

---

## 👤 Autor

Celio Nascimento

---

## 🔗 Referências

- Documentação: `/documentacao/docs/`
- Arquitetura: `/documentacao/docs/02-arquitetura.md`
