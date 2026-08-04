//lib/supabase.ts

// Mantido por compatibilidade — todo código que faz
// `import { supabase } from '@/lib/supabase'` continua funcionando
// sem alteração. A implementação real vive em `lib/supabase/client.ts`.
export { supabase, createClient } from './supabase/client'