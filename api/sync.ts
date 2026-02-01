
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
// @ts-ignore
import OdooClient from '../lib/odoo-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  // Secreto preferido de Vercel, si no, usamos el disparador manual interno
  const cronSecret = process.env.CRON_SECRET;

  // Si hay un secreto configurado en Vercel, lo validamos.
  // Si viene del Admin UI (manual-trigger), permitimos el paso para facilitar la configuración inicial.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer manual-trigger`) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  const startTime = new Date();
  
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase no conectado' });
  }

  const { data: logEntry } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'full_sync',
      status: 'processing',
      started_at: startTime.toISOString()
    })
    .select()
    .single();

  try {
    const odoo = new OdooClient();
    
    // 1. Sincronizar Categorías
    const categories = await odoo.execute('product.category', 'search_read', [[]], {
      fields: ['id', 'name', 'parent_id']
    });

    for (const cat of categories) {
      await supabase.from('categories').upsert({
        id: cat.id,
        odoo_id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id ? cat.parent_id[0] : null,
        parent_name: cat.parent_id ? cat.parent_id[1] : null,
        active: true
      }, { onConflict: 'odoo_id' });
    }

    // 2. Sincronizar Productos
    const products = await odoo.execute('product.product', 'search_read', [
      [['sale_ok', '=', true], ['active', '=', true]]
    ], {
      fields: [
        'id', 'name', 'default_code', 'list_price', 
        'qty_available', 'virtual_available', 'description_sale', 
        'categ_id', 'uom_id', 'write_date'
      ],
      limit: 500
    });

    let processedCount = 0;
    for (const prod of products) {
      try {
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
          image_url: `${process.env.ODOO_URL}/web/image/product.product/${prod.id}/image_512`,
          write_date: prod.write_date
        }, { onConflict: 'odoo_id' });
        processedCount++;
      } catch (prodErr) {
        console.error(`Error procesando producto ${prod.id}:`, prodErr);
      }
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

    return res.status(200).json({
      success: true,
      processed: processedCount,
      duration: `${duration}s`
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    if (logEntry) {
      await supabase.from('sync_log').update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      }).eq('id', logEntry.id);
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}
