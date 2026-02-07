
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import OdooClient from '../lib/odoo-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Configuración de Supabase inválida.' });
  }

  const startTime = new Date();
  let logId: string | null = null;

  try {
    const odoo = new OdooClient();
    
    // Log inicial
    const { data: logData } = await supabase
      .from('sync_log')
      .insert({ sync_type: 'manual', status: 'processing', started_at: startTime.toISOString() })
      .select().single();
    logId = logData?.id;

    // 1. Categorías
    const categories = await odoo.execute('product.category', 'search_read', [[]], {
      fields: ['id', 'name', 'parent_id']
    });

    if (categories?.length > 0) {
      const catsData = categories.map((c: any) => ({
        odoo_id: c.id,
        name: c.name,
        parent_id: c.parent_id ? c.parent_id[0] : null,
        active: true
      }));
      await supabase.from('categories').upsert(catsData, { onConflict: 'odoo_id' });
    }

    // 2. Productos (Lote reducido a 60 para evitar 500 en Vercel)
    const products = await odoo.execute('product.product', 'search_read', [
      [['sale_ok', '=', true], ['active', '=', true]]
    ], {
      fields: ['id', 'name', 'default_code', 'list_price', 'qty_available', 'categ_id', 'write_date'],
      limit: 60,
      order: 'write_date desc'
    });

    if (!products || products.length === 0) throw new Error('Odoo no devolvió productos.');

    const productsData = products.map((p: any) => ({
      odoo_id: p.id,
      name: p.name,
      sku: p.default_code || null,
      list_price: p.list_price || 0,
      qty_available: p.qty_available || 0,
      category_id: p.categ_id ? p.categ_id[0] : null,
      category_name: p.categ_id ? p.categ_id[1] : null,
      active: true,
      image_url: `${process.env.ODOO_URL}/web/image/product.product/${p.id}/image_512`,
      write_date: p.write_date
    }));

    await supabase.from('products').upsert(productsData, { onConflict: 'odoo_id' });

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    if (logId) {
      await supabase.from('sync_log').update({
        status: 'success',
        records_processed: products.length,
        completed_at: endTime.toISOString(),
        duration_seconds: duration
      }).eq('id', logId);
    }

    return res.status(200).json({ success: true, processed: products.length, duration: `${duration}s` });

  } catch (error: any) {
    console.error('Sync Error:', error.message);
    if (logId) {
      await supabase.from('sync_log').update({
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      }).eq('id', logId);
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}
