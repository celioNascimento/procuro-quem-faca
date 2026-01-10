import { createClient } from '@supabase/supabase-js'

// TESTE RADICAL: Coloque as strings direto aqui para testar
const supabaseUrl = 'https://skhqvcluiacwujeeqefg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNraHF2Y2x1aWFjd3VqZWVxZWZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDg5NzYsImV4cCI6MjA4MzQ4NDk3Nn0.mC2BtPsddkTxVRr340yzqZjNtrHNDH9IJ1kMNzdsvk8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)