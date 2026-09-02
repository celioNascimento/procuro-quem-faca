// hooks/usePerfilCliente.ts

'use client'
import { usePerfilDados, aplicarMascara } from './usePerfilDados'
import { useServicosCliente } from './useServicosCliente'
import { usePerfilUI } from './usePerfilUI'

export function usePerfilCliente() {
  const dados    = usePerfilDados()
  const servicos = useServicosCliente(
    dados.perfil.whatsapp.replace(/\D/g, ''),
    dados.perfilCarregado,
  )
  const ui = usePerfilUI(dados.isDirty)

  return {
    // ── Refs ──────────────────────────────────────
    fileInputRef: dados.fileInputRef,
    filtroRef:    servicos.filtroRef,

    // ── UI ────────────────────────────────────────
    aba:               ui.aba,
    setAba:            ui.setAba,
    confirmLeaveModal: ui.confirmLeaveModal,
    handleNavigation:  ui.handleNavigation,
    confirmarSaida:    ui.confirmarSaida,
    cancelarSaida:     ui.cancelarSaida,
    irParaAvaliar:     () => servicos.irParaAvaliar(ui.setAba),

    // ── Perfil ────────────────────────────────────
    perfil:             dados.perfil,
    isDirty:            dados.isDirty,
    loading:            dados.loading,
    uploading:          dados.uploading,
    showSuccess:        dados.showSuccess,
    listaEstados:       dados.listaEstados,
    listaCidades:       dados.listaCidades,
    errorModal:         dados.errorModal,
    setErrorModal:      dados.setErrorModal,
    perfilCarregado:    dados.perfilCarregado,
    aplicarMascara,
    handleChangePerfil: dados.handleChangePerfil,
    handleUploadFoto:   dados.handleUploadFoto,
    atualizar:          dados.atualizar,

    // ── Serviços ──────────────────────────────────
    servicos:                servicos.servicos,
    servicosGarantia:        servicos.servicosGarantia,
    servicosReclamacao:      servicos.servicosReclamacao,      // novo — filtro Reclamação
    idsComGarantiaAtiva:     servicos.idsComGarantiaAtiva,      // para tag no card
    idsComReclamacaoAtiva:   servicos.idsComReclamacaoAtiva,    // novo — para tag no card
    filtroStatus:            servicos.filtroStatus,
    setFiltroStatus:         servicos.setFiltroStatus,
    loadingServicos:         servicos.loadingServicos,
    servicosFiltrados:       servicos.servicosFiltrados,
    avaliarCount:            servicos.avaliarCount,
    ativosCount:             servicos.ativosCount,
    garantiaCount:           servicos.garantiaCount,
    reclamacaoCount:         servicos.reclamacaoCount,         // novo
    getStatusInfo:           servicos.getStatusInfo,
    getRotaDestino:          servicos.getRotaDestino,
    getRotaGarantia:         servicos.getRotaGarantia,
    getRota:                 servicos.getRota,                 // rota unificada
  }
}
