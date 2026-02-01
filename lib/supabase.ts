
import { createClient } from '@supabase/supabase-js';

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

// Solo inicializamos si tenemos la URL, para evitar el Uncaught Error
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.error('CRITICAL: Supabase keys are missing. App will run in limited mode.');
}
