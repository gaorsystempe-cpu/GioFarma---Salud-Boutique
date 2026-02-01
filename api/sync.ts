
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import OdooClient from '../lib/odoo-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar cabeceras CORS de inmediato
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.VITE_CRON_SECRET || process.env.CRON_SECRET;

  // Validación de seguridad (Permitir 'manual-trigger' para el panel admin)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && authHeader !== `Bearer manual-trigger`) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase no conectado. Revisa variables de entorno.' });
  }

  const startTime = new Date();
  let logId: string | null = null;

  try {
    // 1. Crear log inicial en Supabase
    const { data: logData, error: logError } = await supabase
      .from('sync_log')
      .insert({
        sync_type: 'full_sync',
        status: 'processing',
        started_at: startTime.toISOString()
      })
      .select()
      .single();
    
    if (logError) console.error('Error creando log:', logError.message);
    logId = logData?.id;

    const odoo = new OdooClient();
    const rawOdooUrl = process.env.VITE_ODOO_URL || process.env.ODOO_URL || '';
    const odooUrl = rawOdooUrl.replace(/\/$/, '');

    // 2. Sincronizar Categorías (Batch)
    const categories = await odoo.execute('product.category', 'search_read', [[]], {
      fields: ['id', 'name', 'parent_id']
    });

    if (categories && categories.length > 0) {
      const categoriesData = categories.map((cat: any) => ({
        odoo_id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id ? cat.parent_id[0] : null,
        parent_name: cat.parent_id ? cat.parent_id[1] : null,
        active: true
      }));

      await supabase.from('categories').upsert(categoriesData, { onConflict: 'odoo_id' });
    }

    // 3. Sincronizar Productos (Batch) - Limitado para evitar Timeouts
    const products = await odoo.execute('product.product', 'search_read', [
      [['sale_ok', '=', true], ['active', '=', true]]
    ], {
      fields: [
        'id', 'name', 'default_code', 'list_price', 
        'qty_available', 'virtual_available', 'description_sale', 
        'categ_id', 'uom_id', 'write_date'
      ],
      limit: 150, // Bajamos el límite para asegurar que termine antes de 10s
      order: 'write_date desc'
    });

    if (!products || products.length === 0) {
      throw new Error('No se encontraron productos activos en Odoo');
    }

    const productsData = products.map((prod: any) => ({
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
      image_url: `${odooUrl}/web/image/product.product/${prod.id}/image_512`,
      write_date: prod.write_date
    }));

    // UPSERT MASIVO: Una sola llamada a la base de datos
    const { error: upsertError } = await supabase.from('products').upsert(productsData, { onConflict: 'odoo_id' });
    
    if (upsertError) throw upsertError;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // 4. Actualizar log final
    if (logId) {
      await supabase.from('sync_log').update({
        status: 'success',
        records_processed: products.length,
        completed_at: endTime.toISOString(),
        duration_seconds: duration
      }).eq('id', logId);
    }

    return res.status(200).json({ 
      success: true, 
      processed: products.length, 
      duration: `${duration}s` 
    });

  } catch (error: any) {
    console.error('Sync Error Details:', error.message);
    
    if (logId) {
      try {
        await supabase.from('sync_log').update({
          status: 'error',
          error_message: error.message,
          completed_at: new Date().toISOString()
        }).eq('id', logId);
      } catch (logUpdateError) {
        console.error('Error al actualizar log de error:', logUpdateError);
      }
    }

    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Error interno durante la sincronización' 
    });
  }
}
