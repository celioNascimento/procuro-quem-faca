import { createClient } from '@supabase/supabase-js'

// No Next.js, as variáveis precisam obrigatoriamente começar com NEXT_PUBLIC_ 
// para serem visíveis no navegador (celular/computador do cliente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ALERTA: Chaves do Supabase não encontradas!")
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
)