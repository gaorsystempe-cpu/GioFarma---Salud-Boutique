import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import OdooClient from '../lib/odoo-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { customer_name, customer_email, customer_phone, customer_address, items, notes } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'El carrito está vacío' });
      }

      const odoo = new OdooClient();

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

      const odooResult = await odoo.createSaleOrder(odooOrderData);
      const total_amount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
      
      const { data: customer } = await supabase!
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

      const { data: order } = await supabase!
        .from('orders')
        .insert({
          customer_id: customer?.id,
          odoo_id: odooResult.order_id.toString(),
          customer_name,
          customer_email,
          total_amount,
          status: 'confirmed',
          synced_to_odoo: true,
          synced_at: new Date().toISOString()
        })
        .select()
        .single();

      const orderLines = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        price_unit: item.price,
        subtotal: item.price * item.quantity
      }));

      await supabase!.from('order_lines').insert(orderLines);

      return res.status(200).json({
        success: true,
        data: {
          order_uuid: order.id,
          odoo_order_id: odooResult.order_id
        }
      });

    } catch (error: any) {
      console.error('Error al crear orden:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'No se pudo generar el pedido en Odoo.' 
      });
    }
  } else if (req.method === 'GET') {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ success: false, error: 'Email requerido' });

    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase no configurado' });

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_lines(*)')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(200).json({ success: true, data });
  } else {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }
}