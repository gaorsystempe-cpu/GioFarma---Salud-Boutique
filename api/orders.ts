
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import OdooClient from '../lib/odoo-client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabase) return res.status(500).json({ success: false, error: 'Database error' });

  if (req.method === 'POST') {
    try {
      const { customer_name, customer_email, customer_phone, customer_address, items, notes } = req.body;

      if (!items?.length) return res.status(400).json({ success: false, error: 'Carrito vacío' });

      const odoo = new OdooClient();
      const odooResult = await odoo.createSaleOrder({
        partner_name: customer_name,
        partner_email: customer_email,
        partner_phone: customer_phone,
        partner_address: customer_address,
        notes,
        order_lines: items.map((i: any) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price_unit: i.price,
          name: i.name
        }))
      });

      const total = items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
      
      const { data: customer } = await supabase
        .from('customers')
        .upsert({
          odoo_id: odooResult.partner_id,
          name: customer_name,
          email: customer_email,
          phone: customer_phone,
          address: customer_address
        }, { onConflict: 'email' }).select().single();

      const { data: order } = await supabase
        .from('orders')
        .insert({
          customer_id: customer?.id,
          odoo_id: odooResult.order_id.toString(),
          customer_name,
          customer_email,
          total_amount: total,
          status: 'confirmed',
          synced_to_odoo: true
        }).select().single();

      if (order) {
        const lines = items.map((i: any) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.name,
          quantity: i.quantity,
          price_unit: i.price,
          subtotal: i.price * i.quantity
        }));
        await supabase.from('order_lines').insert(lines);
      }

      return res.status(200).json({ success: true, odoo_id: odooResult.order_id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    const email = req.query.email as string;
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_lines(*)')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.status(200).json({ success: true, data });
  }
  
  return res.status(405).end();
}
