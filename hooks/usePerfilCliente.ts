'use client'
import { usePerfilDados, aplicarMascara } from './usePerfilDados'
import { useServicosCliente } from './useServicosCliente'
import { usePerfilUI } from './usePerfilUI'

export function usePerfilCliente() {
  const dados    = usePerfilDados()
  const servicos = useServicosCliente(dados.perfil.whatsapp.replace(/\D/g, ''))
  const ui       = usePerfilUI(dados.isDirty)

  return {
    // ── Refs ──────────────────────────────────────
    fileInputRef:  dados.fileInputRef,
    filtroRef:     servicos.filtroRef,

    // ── UI ────────────────────────────────────────
    aba:           ui.aba,
    setAba:        ui.setAba,
    confirmLeaveModal: ui.confirmLeaveModal,
    handleNavigation:  ui.handleNavigation,
    confirmarSaida:    ui.confirmarSaida,
    cancelarSaida:     ui.cancelarSaida,
    irParaAvaliar: () => servicos.irParaAvaliar(ui.setAba),

    // ── Perfil ────────────────────────────────────
    perfil:        dados.perfil,
    isDirty:       dados.isDirty,
    loading:       dados.loading,
    uploading:     dados.uploading,
    showSuccess:   dados.showSuccess,
    listaEstados:  dados.listaEstados,
    listaCidades:  dados.listaCidades,
    errorModal:    dados.errorModal,
    setErrorModal: dados.setErrorModal,
    deleteModal:        dados.deleteModal,
    setDeleteModal:     dados.setDeleteModal,
    deleteConfirmText:  dados.deleteConfirmText,
    setDeleteConfirmText: dados.setDeleteConfirmText,
    deleting:      dados.deleting,
    aplicarMascara,
    handleChangePerfil: dados.handleChangePerfil,
    handleUploadFoto:   dados.handleUploadFoto,
    atualizar:          dados.atualizar,
    handleDeleteAccount: dados.handleDeleteAccount,

    // ── Serviços ──────────────────────────────────
    servicos:          servicos.servicos,
    filtroStatus:      servicos.filtroStatus,
    setFiltroStatus:   servicos.setFiltroStatus,
    loadingServicos:   servicos.loadingServicos,
    servicosFiltrados: servicos.servicosFiltrados,
    avaliarCount:      servicos.avaliarCount,
    ativosCount:       servicos.ativosCount,
    getStatusInfo:     servicos.getStatusInfo,
    getRotaDestino:    servicos.getRotaDestino,
  }
}