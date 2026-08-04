//lib/services/adminAuth.service.ts

import { supabase } from '@/lib/supabase'

export async function loginAdmin(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? 'Credenciais inválidas.' : null
}