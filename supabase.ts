import { createClient } from '@supabase/supabase-js'

// Estas variables se cargan automáticamente desde .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verificar que las variables estén cargadas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
