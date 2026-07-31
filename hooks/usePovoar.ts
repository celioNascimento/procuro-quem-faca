'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchDadosIniciais,
  fetchCategoriasPorGrupo,
  verificarWhatsappDuplicado,
  inserirPrestadorCurado,
  type PovoarFormData,
} from '@/lib/services/povoar.service'

const FORM_INICIAL: PovoarFormData = {
  nome: '',
  categoria_id: '',
  grupo_id: '',
  cidade_id: '',
  regiao_id: '',
  estado_sigla: 'PR',
  bairro: '',
  whatsapp: '',
  bio: 'Profissional qualificado disponível para atendimentos na região.',
  cidades_atendidas: [],
}

function aplicarMascaraFone(valor: string): string {
  return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)
}

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .concat(`-${Math.floor(Math.random() * 1000)}`)
}

export function usePovoar() {
  const [cidades, setCidades] = useState<any[]>([])
  const [grupos, setGrupos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [regioes, setRegioes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [existe, setExiste] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })
  const [form, setForm] = useState<PovoarFormData>(FORM_INICIAL)

  useEffect(() => {
    fetchDadosIniciais().then(({ cidades, grupos, regioes }) => {
      setCidades(cidades)
      setGrupos(grupos)
      setRegioes(regioes)
    })
  }, [])

  useEffect(() => {
    fetchCategoriasPorGrupo(form.grupo_id).then(setCategorias)
  }, [form.grupo_id])

  useEffect(() => {
    const cidadeSel = cidades.find(c => String(c.id) === String(form.cidade_id))
    if (cidadeSel) {
      setForm(prev => ({
        ...prev,
        regiao_id: cidadeSel.regiao_id || prev.regiao_id,
        estado_sigla: cidadeSel.estado_sigla || prev.estado_sigla,
      }))
    }
  }, [form.cidade_id, cidades])

  const handleFoneChange = useCallback((valor: string) => {
    setForm(prev => ({ ...prev, whatsapp: aplicarMascaraFone(valor) }))
  }, [])

  useEffect(() => {
    const foneLimpo = form.whatsapp.replace(/\D/g, '')
    if (foneLimpo.length < 10) { setExiste(false); return }

    const timer = setTimeout(async () => {
      setCheckLoading(true)
      const encontrado = await verificarWhatsappDuplicado(foneLimpo)
      if (encontrado) {
        setExiste(true)
        setMsg({ tipo: 'erro', texto: `⚠️ Conflito: ${encontrado.nome} já cadastrado.` })
      } else {
        setExiste(false)
        setMsg(prev => (prev.tipo === 'erro' ? { tipo: '', texto: '' } : prev))
      }
      setCheckLoading(false)
    }, 600)

    return () => clearTimeout(timer)
  }, [form.whatsapp])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (existe || loading) return
    setLoading(true)

    const cidadeSedeNome = cidades.find(c => String(c.id) === String(form.cidade_id))?.nome
    const cidadesAtendidasLimpo = [...new Set(form.cidades_atendidas || [])]
      .filter(nome => nome !== cidadeSedeNome && nome !== '')

    try {
      await inserirPrestadorCurado(form, cidadesAtendidasLimpo, gerarSlug(form.nome))
      setMsg({ tipo: 'sucesso', texto: '✅ Profissional inserido com sucesso!' })
      setForm(FORM_INICIAL)
      setExiste(false)
      setTimeout(() => setMsg({ tipo: '', texto: '' }), 4000)
    } catch (err: any) {
      setMsg({ tipo: 'erro', texto: '❌ Erro: ' + err.message })
    } finally {
      setLoading(false)
    }
  }, [existe, loading, form, cidades])

  return {
    cidades, grupos, categorias, regioes,
    loading, checkLoading, existe, msg, form, setForm,
    handleFoneChange, handleSubmit,
  }
}
