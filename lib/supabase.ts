
import { createClient } from '@supabase/supabase-js';

// En el frontend (browser), process no existe. 
// Vite o Vercel suelen inyectar variables, pero necesitamos seguridad.
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env ? process.env[key] : null) || 
           // @ts-ignore
           (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : null) || 
           '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl) {
  console.warn('Configuración de Supabase incompleta. Verifica las variables de entorno.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
