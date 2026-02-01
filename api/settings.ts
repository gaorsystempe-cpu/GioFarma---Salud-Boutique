
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false });

  const client = supabase;
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database client not initialized' });
  }

  try {
    const { data, error } = await client
      .from('store_settings')
      .select('*')
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false });
  }
}
