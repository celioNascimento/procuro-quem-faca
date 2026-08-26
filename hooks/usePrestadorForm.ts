//hooks/usePrestadorForm.ts

import { useState, useCallback } from 'react'
import type { PrestadorFormData } from '@/types/prestador'
import { aplicarMascaraWhatsapp, formatarParaSlug } from '@/lib/mascaras'

const FORM_INICIAL: PrestadorFormData = {
  id: null,
  slug: null,
  nome: '',
  whatsapp: '',
  foto_perfil: null,
  grupo_id: '',
  categoria_id: '',
  estado_sigla: 'PR',
  regiao_id: '',
  cidade_id: '',
  bairro: '',
  bio: '',
  habilidades: [],
  cidades_atendidas: [],
  origem_tipo: 'proprio',
  verificado: false,
  status: 'ativo',
  garantia_dias: 0,
}

export function usePrestadorForm(idAtual?: number | null) {
  const [formData, setFormData] = useState<PrestadorFormData>(FORM_INICIAL)
  const [editouSlugManualmente, setEditouSlugManualmente] = useState(false)

  const set = useCallback((partial: Partial<PrestadorFormData>) => {
    setFormData(prev => ({ ...prev, ...partial }))
  }, [])

  const carregarPerfil = useCallback((perfil: Partial<PrestadorFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...perfil,
      cidades_atendidas: perfil.cidades_atendidas || [],
      habilidades: perfil.habilidades || [],
      bio: perfil.bio || '',
      foto_perfil: perfil.foto_perfil || null,
      bairro: perfil.bairro || '',
      slug: perfil.slug || formatarParaSlug(perfil.nome || ''),
      estado_sigla: perfil.estado_sigla || 'PR',
      whatsapp: aplicarMascaraWhatsapp(perfil.whatsapp || ''),
      // garantia_dias já vem do spread de ...perfil acima quando presente
      // no banco; explícito aqui só para cobrir perfis legados sem a
      // coluna preenchida ainda (undefined → 0, "sem garantia").
      garantia_dias: perfil.garantia_dias ?? 0,
    }))
    if (perfil.slug) setEditouSlugManualmente(true)
  }, [])

  const handleNomeChange = useCallback((nome: string) => {
    setFormData(prev => ({
      ...prev,
      nome,
      slug: prev.slug && editouSlugManualmente ? prev.slug : formatarParaSlug(nome),
    }))
  }, [editouSlugManualmente])

  const handleSlugChange = useCallback((valor: string) => {
    setEditouSlugManualmente(true)
    setFormData(prev => ({ ...prev, slug: formatarParaSlug(valor) }))
  }, [])

  const handleWhatsappChange = useCallback((valor: string) => {
    setFormData(prev => ({ ...prev, whatsapp: aplicarMascaraWhatsapp(valor) }))
  }, [])

  const handleGrupoChange = useCallback((grupoId: string) => {
    setFormData(prev => ({ ...prev, grupo_id: grupoId, categoria_id: '', habilidades: [] }))
  }, [])

  const handleEstadoChange = useCallback((sigla: string) => {
    setFormData(prev => ({
      ...prev,
      estado_sigla: sigla,
      regiao_id: '',
      cidade_id: '',
      bairro: '',
      cidades_atendidas: [],
    }))
  }, [])

  const handleRegiaoChange = useCallback((regiaoId: string) => {
    setFormData(prev => ({
      ...prev,
      regiao_id: regiaoId,
      cidade_id: '',
      cidades_atendidas: [],
    }))
  }, [])

  const toggleItem = useCallback((item: string, campo: 'habilidades' | 'cidades_atendidas') => {
    setFormData(prev => {
      const lista = prev[campo] || []
      const nova = lista.includes(item)
        ? lista.filter(i => i !== item)
        : [...lista, item]
      return { ...prev, [campo]: nova }
    })
  }, [])

  return {
    formData,
    set,
    carregarPerfil,
    handleNomeChange,
    handleSlugChange,
    handleWhatsappChange,
    handleGrupoChange,
    handleEstadoChange,
    handleRegiaoChange,
    toggleItem,
  }
}
