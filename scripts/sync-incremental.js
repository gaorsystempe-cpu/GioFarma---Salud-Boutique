
require('dotenv').config();
const OdooClient = require('../lib/odoo-client');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncIncremental() {
  const startTime = new Date();
  console.log('🔄 Iniciando sincronización incremental...');

  const { data: logData } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'incremental',
      status: 'running',
      started_at: startTime.toISOString()
    })
    .select()
    .single();

  const logId = logData?.id;

  try {
    const odoo = new OdooClient();

    const { data: lastSync } = await supabase
      .from('sync_log')
      .select('completed_at')
      .eq('status', 'success')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const sinceDate = lastSync?.completed_at || new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    console.log(`📅 Buscando productos modificados desde: ${sinceDate}`);

    const updatedProducts = await odoo.getUpdatedProducts(sinceDate);
    
    console.log(`📦 Encontrados ${updatedProducts.length} productos actualizados`);

    if (updatedProducts.length === 0) {
      console.log('✅ No hay productos para actualizar');
      const endTime = new Date();
      await supabase.from('sync_log').update({
        status: 'success',
        records_processed: 0,
        completed_at: endTime.toISOString(),
        duration_seconds: Math.round((endTime - startTime) / 1000)
      }).eq('id', logId);
      return;
    }

    const productsData = updatedProducts.map(p => ({
      id: p.id,
      odoo_id: p.id,
      name: p.name,
      sku: p.default_code || null,
      list_price: p.list_price || 0,
      cost_price: p.standard_price || 0,
      qty_available: p.qty_available || 0,
      virtual_available: p.virtual_available || 0,
      description: p.description_sale || null,
      image_url: p.image_1920 ? `data:image/png;base64,${p.image_1920}` : null,
      category_id: p.categ_id ? p.categ_id[0] : null,
      category_name: p.categ_id ? p.categ_id[1] : null,
      uom_name: p.uom_id ? p.uom_id[1] : null,
      active: p.active !== false,
      write_date: p.write_date || new Date().toISOString()
    }));

    const { error } = await supabase
      .from('products')
      .upsert(productsData, { onConflict: 'odoo_id' });

    if (error) throw error;

    console.log(`✅ ${updatedProducts.length} productos actualizados`);

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    await supabase.from('sync_log').update({
      status: 'success',
      records_processed: updatedProducts.length,
      completed_at: endTime.toISOString(),
      duration_seconds: duration
    }).eq('id', logId);

    console.log(`\n✅ Sincronización incremental completada en ${duration} segundos`);

  } catch (error) {
    console.error('❌ Error en sincronización incremental:', error);
    const endTime = new Date();
    await supabase.from('sync_log').update({
      status: 'error',
      error_message: error.message,
      completed_at: endTime.toISOString(),
      duration_seconds: Math.round((endTime - startTime) / 1000)
    }).eq('id', logId);
    process.exit(1);
  }
}

syncIncremental();
