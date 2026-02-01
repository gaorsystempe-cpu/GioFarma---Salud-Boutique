
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';
// @ts-ignore
import OdooClient from '../../lib/odoo-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, customer_address, items, notes } = body;

    const odoo = new OdooClient();

    // 1. Preparar datos formateados para la función de Odoo
    const odooOrderData = {
      partner_name: customer_name,
      partner_email: customer_email,
      partner_phone: customer_phone,
      partner_address: customer_address,
      notes: notes,
      order_lines: items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_unit: item.price,
        name: item.name
      }))
    };

    // 2. Llamar a la función puente en Odoo
    const odooResult = await odoo.createSaleOrder(odooOrderData);

    // 3. Registro en Base de Datos local (Supabase)
    const total_amount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    
    // Upsert del cliente local
    const { data: customer } = await supabase
      .from('customers')
      .upsert({
        odoo_id: odooResult.partner_id,
        name: customer_name,
        email: customer_email,
        phone: customer_phone,
        address: customer_address
      }, { onConflict: 'email' })
      .select()
      .single();

    // Registro de la orden local con el ID devuelto por Odoo
    const { data: order } = await supabase
      .from('orders')
      .insert({
        customer_id: customer?.id,
        odoo_id: odooResult.order_id.toString(), // Guardamos el ID de Odoo (ej. "452")
        customer_name,
        customer_email,
        total_amount,
        status: 'confirmed',
        synced_to_odoo: true,
        synced_at: new Date().toISOString()
      })
      .select()
      .single();

    // Registro de líneas de detalle locales
    const orderLines = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      price_unit: item.price,
      subtotal: item.price * item.quantity
    }));

    await supabase.from('order_lines').insert(orderLines);

    return NextResponse.json({
      success: true,
      data: {
        order_uuid: order.id,
        odoo_order_id: odooResult.order_id
      }
    });

  } catch (error: any) {
    console.error('Order Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'No se pudo generar el pedido en el sistema. Por favor contacte a soporte.' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 });

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_lines(*)')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}
