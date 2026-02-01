
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const categoryId = searchParams.get('category');
  const search = searchParams.get('search');

  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('active', true);

    if (categoryId) {
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

    return NextResponse.json({
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
    return NextResponse.json({
      success: false,
      error: 'Error al conectar con el servidor.'
    }, { status: 500 });
  }
}
