
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  // @ts-ignore
  const env = import.meta.env || {};
  // @ts-ignore
  const proc = (typeof process !== 'undefined' && process.env) ? process.env : {};

  // Prioridad: VITE_KEY > KEY
  return (
    env[`VITE_${key}`] || 
    proc[`VITE_${key}`] || 
    env[key] || 
    proc[key] || 
    proc[`NEXT_PUBLIC_${key}`] ||
    ''
  );
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Verificación estricta: URL válida y Key con longitud mínima
const isValid = 
  typeof supabaseUrl === 'string' && 
  supabaseUrl.startsWith('http') && 
  typeof supabaseAnonKey === 'string' && 
  supabaseAnonKey.length > 20;

export const supabase = isValid ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!isValid) {
  console.warn('⚠️ Configuración de Supabase incompleta. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.');
}
