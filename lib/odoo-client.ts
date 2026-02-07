
// @ts-ignore
import * as xmlrpc from 'xmlrpc';

export default class OdooClient {
  private url: string;
  private db: string;
  private username: string;
  private password: string;
  private uid: number | null = null;

  constructor() {
    const rawUrl = process.env.VITE_ODOO_URL || process.env.ODOO_URL || '';
    this.url = rawUrl.replace(/\/$/, '');
    this.db = process.env.VITE_ODOO_DB || process.env.ODOO_DB || '';
    this.username = process.env.VITE_ODOO_USERNAME || process.env.ODOO_USERNAME || '';
    this.password = process.env.VITE_ODOO_API_KEY || process.env.ODOO_API_KEY || '';
  }

  private getClient(path: string) {
    // xmlrpc prefiere la URL completa o un objeto. Usaremos URL completa validada.
    const fullUrl = `${this.url}${path}`;
    
    // @ts-ignore - Manejo de interoperabilidad ESM/CJS para xmlrpc en Vercel
    const clientModule = (xmlrpc.default && xmlrpc.default.createClient) ? xmlrpc.default : xmlrpc;
    
    return this.url.startsWith('https') 
      ? clientModule.createSecureClient(fullUrl) 
      : clientModule.createClient(fullUrl);
  }

  async connect(): Promise<number> {
    if (this.uid !== null) return this.uid;
    
    if (!this.url || !this.db || !this.password || !this.username) {
      const missing = [];
      if (!this.url) missing.push('ODOO_URL');
      if (!this.db) missing.push('ODOO_DB');
      if (!this.username) missing.push('ODOO_USERNAME');
      if (!this.password) missing.push('ODOO_API_KEY');
      throw new Error(`Faltan variables: ${missing.join(', ')}`);
    }

    const common = this.getClient('/xmlrpc/2/common');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout de conexión a Odoo (8s)')), 8000);
      
      common.methodCall('authenticate', [this.db, this.username, this.password, {}], (error: any, value: any) => {
        clearTimeout(timeout);
        if (error) return reject(new Error(`Error Odoo (Auth): ${error.message}`));
        if (value === false || value === undefined) return reject(new Error('Credenciales de Odoo inválidas.'));
        this.uid = value;
        resolve(value);
      });
    });
  }

  async execute(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    const uid = await this.connect();
    const models = this.getClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout en ${model}.${method} (10s)`)), 10000);

      models.methodCall('execute_kw', [this.db, uid, this.password, model, method, args, kwargs], (error: any, value: any) => {
        clearTimeout(timeout);
        if (error) return reject(new Error(`Error Odoo (${model}.${method}): ${error.message}`));
        resolve(value);
      });
    });
  }

  async createSaleOrder(orderData: any) {
    try {
      let partnerId;
      const partners = await this.execute('res.partner', 'search', [[['email', '=', orderData.partner_email]]]);
      
      if (partners && partners.length > 0) {
        partnerId = partners[0];
      } else {
        partnerId = await this.execute('res.partner', 'create', [{
          name: orderData.partner_name,
          email: orderData.partner_email,
          phone: orderData.partner_phone,
          street: orderData.partner_address,
          customer_rank: 1
        }]);
      }

      const orderLines = orderData.order_lines.map((line: any) => [0, 0, {
        product_id: line.product_id,
        product_uom_qty: line.quantity,
        price_unit: line.price_unit,
        name: line.name
      }]);

      const orderId = await this.execute('sale.order', 'create', [{
        partner_id: partnerId,
        order_line: orderLines,
        origin: 'Tienda Web GioFarma',
        note: orderData.notes || ''
      }]);

      return { order_id: orderId, partner_id: partnerId, success: true };
    } catch (error: any) {
      throw new Error(`Fallo integración Odoo: ${error.message}`);
    }
  }
}
