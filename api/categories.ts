
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Base de datos no configurada.' });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error: any) {
    console.error('API Categories Error:', error);
    return res.status(500).json({
      success: false,
      error: 'No se pudieron cargar las categorías.'
    });
  }
}
