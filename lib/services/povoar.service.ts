import { supabase } from '@/lib/supabase'

export interface PovoarFormData {
  nome: string
  categoria_id: string
  grupo_id: string
  cidade_id: string
  regiao_id: string
  estado_sigla: string
  bairro: string
  whatsapp: string
  bio: string
  cidades_atendidas: string[]
}

export async function fetchDadosIniciais() {
  const [cidades, grupos, regioes] = await Promise.all([
    supabase.from('cidades').select('*').order('nome'),
    supabase.from('categorias_grupos').select('*').order('nome'),
    supabase.from('regioes').select('*').order('nome'),
  ])
  return {
    cidades: cidades.data || [],
    grupos: grupos.data || [],
    regioes: regioes.data || [],
  }
}

export async function fetchCategoriasPorGrupo(grupoId: string) {
  if (!grupoId) return []
  const { data } = await supabase.from('categorias').select('*').eq('grupo_id', grupoId).order('nome')
  return data || []
}

export async function verificarWhatsappDuplicado(foneLimpo: string): Promise<{ nome: string } | null> {
  if (foneLimpo.length < 10) return null
  const { data } = await supabase.from('prestadores').select('id, nome').eq('whatsapp', foneLimpo).maybeSingle()
  return data
}

export async function inserirPrestadorCurado(form: PovoarFormData, cidadesAtendidasLimpo: string[], slug: string) {
  // NOTA: 'categoria' (texto) foi removido do payload — não existe como
  // coluna na tabela `prestadores`. A relação com a categoria já é feita
  // corretamente via `categoria_id` (uuid, FK), que já está em `form`.
  const { error } = await supabase.from('prestadores').insert([{
    ...form,
    cidades_atendidas: cidadesAtendidasLimpo,
    whatsapp: form.whatsapp.replace(/\D/g, ''),
    slug,
    status: 'ativo',
    origem_tipo: 'curadoria_publica',
    verificado: false,
    aprovado_em: new Date().toISOString(),
    foto_perfil: `https://ui-avatars.com/api/?name=${encodeURIComponent(form.nome)}&background=random&color=fff&size=200`,
  }])

  if (error) throw error
}
