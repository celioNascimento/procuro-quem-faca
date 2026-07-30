//app/(admin)/admin/habilidades/page.js

import { supabase } from '@/lib/supabase'
import { insertLog } from '@/lib/db/logs'

export interface Habilidade {
  id: string
  nome: string
  categoria: string
}

export async function fetchHabilidades(): Promise<Habilidade[]> {
  const { data, error } = await supabase.from('habilidades').select('*').order('nome')
  if (error) throw error
  return data || []
}

export async function criarHabilidade(nome: string, categoria: string): Promise<void> {
  const { error } = await supabase.from('habilidades').insert([{ nome, categoria }])
  if (error) throw error

  const { data: { session } } = await supabase.auth.getSession()
  await insertLog({
    acao: 'CRIAR_HABILIDADE',
    entidadeTipo: 'habilidade',
    detalhes: { nome, categoria },
    // usuario_email/usuario_id já são preenchidos automaticamente por
    // insertLog a partir da sessão real, sem precisar hardcodar aqui
  })
}