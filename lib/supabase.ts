
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('CRÍTICO: NEXT_PUBLIC_SUPABASE_URL no está definida.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
