
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase no configurado correctamente.' });
  }

  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '12');
  const categoryId = req.query.category as string;
  const search = req.query.search as string;

  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('active', true);

    if (categoryId && categoryId !== 'null' && categoryId !== 'undefined') {
      query = query.eq('category_id', categoryId);
    }

    if (search && search.trim() !== '') {
      query = query.ilike('name', `%${search}%`);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, count, error } = await query
      .order('name')
      .range(start, end);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('API Products Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener productos de la base de datos.'
    });
  }
}
