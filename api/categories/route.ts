
import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'No se pudieron cargar los departamentos.'
    }, { status: 500 });
  }
}
