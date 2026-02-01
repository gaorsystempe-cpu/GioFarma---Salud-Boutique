
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
// @ts-ignore
import OdooClient from '../../lib/odoo-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Validación de seguridad para que solo Vercel Cron o tú puedan ejecutar esto
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const startTime = new Date();
  const odoo = new OdooClient();
  
  // Registrar inicio de sincronización en el log
  const { data: logEntry } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'incremental',
      status: 'processing',
      started_at: startTime.toISOString()
    })
    .select()
    .single();

  try {
    console.log('📦 Sincronizando categorías desde Odoo...');
    const categories = await odoo.execute('product.category', 'search_read', [[]], {
      fields: ['id', 'name', 'parent_id']
    });

    for (const cat of categories) {
      await supabase.from('categories').upsert({
        odoo_id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id ? cat.parent_id[0] : null,
        parent_name: cat.parent_id ? cat.parent_id[1] : null
      }, { onConflict: 'odoo_id' });
    }

    console.log('📦 Sincronizando productos activos...');
    // Obtenemos productos que estén marcados para venta
    const products = await odoo.execute('product.product', 'search_read', [
      [['sale_ok', '=', true], ['active', '=', true]]
    ], {
      fields: [
        'id', 'name', 'default_code', 'list_price', 
        'qty_available', 'virtual_available', 'description_sale', 
        'categ_id', 'uom_id', 'write_date'
      ],
      limit: 200 // Ajustable según necesidad
    });

    let processedCount = 0;
    for (const prod of products) {
      // Nota: No traemos la imagen pesada en el listado masivo para evitar timeouts.
      // Las imágenes se construyen mediante URL dinámica en el frontend o se sincronizan aparte.
      await supabase.from('products').upsert({
        id: prod.id, 
        odoo_id: prod.id,
        name: prod.name,
        sku: prod.default_code || null,
        list_price: prod.list_price || 0,
        qty_available: prod.qty_available || 0,
        virtual_available: prod.virtual_available || 0,
        description: prod.description_sale || null,
        category_id: prod.categ_id ? prod.categ_id[0] : null,
        category_name: prod.categ_id ? prod.categ_id[1] : null,
        uom_name: prod.uom_id ? prod.uom_id[1] : null,
        active: true,
        // Construimos la URL de la imagen de Odoo
        image_url: `${process.env.ODOO_URL}/web/image/product.product/${prod.id}/image_512?unique=${prod.write_date}`,
        write_date: prod.write_date
      }, { onConflict: 'odoo_id' });
      processedCount++;
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    if (logEntry) {
      await supabase.from('sync_log').update({
        status: 'success',
        records_processed: processedCount,
        completed_at: endTime.toISOString(),
        duration_seconds: duration
      }).eq('id', logEntry.id);
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      duration: `${duration}s`
    });

  } catch (error: any) {
    console.error('Error en Sync:', error);
    if (logEntry) {
      await supabase.from('sync_log').update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      }).eq('id', logEntry.id);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
