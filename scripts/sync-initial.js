
require('dotenv').config();
const OdooClient = require('../lib/odoo-client');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncInitial() {
  const startTime = new Date();
  console.log('🚀 Iniciando sincronización inicial...');

  const { data: logData } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'initial',
      status: 'running',
      started_at: startTime.toISOString()
    })
    .select()
    .single();

  const logId = logData?.id;

  try {
    const odoo = new OdooClient();
    
    console.log('📦 Sincronizando categorías...');
    const categories = await odoo.getCategories();
    console.log(`   Encontradas ${categories.length} categorías`);

    for (const cat of categories) {
      await supabase.from('categories').upsert({
        id: cat.id,
        odoo_id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id ? cat.parent_id[0] : null,
        parent_name: cat.parent_id ? cat.parent_id[1] : null
      }, { onConflict: 'odoo_id' });
    }

    console.log('📦 Sincronizando productos...');
    const batchSize = 100;
    let offset = 0;
    let totalProducts = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await odoo.getProducts(batchSize, offset);
      
      if (products.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`   Procesando lote: ${offset} - ${offset + products.length}`);

      const productsData = products.map(p => ({
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

      totalProducts += products.length;
      offset += batchSize;
      if (products.length < batchSize) hasMore = false;
    }

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    await supabase.from('sync_log').update({
      status: 'success',
      records_processed: totalProducts,
      completed_at: endTime.toISOString(),
      duration_seconds: duration
    }).eq('id', logId);

    console.log(`\n✅ Sincronización completada en ${duration} segundos`);

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
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

syncInitial();
