
import xmlrpc from 'xmlrpc';

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

  async connect(): Promise<number> {
    if (this.uid !== null) return this.uid;
    
    if (!this.url || !this.db || !this.password || !this.username) {
      throw new Error('Configuración de Odoo incompleta. Verifica URL, DB, Usuario y API Key.');
    }

    const clientUrl = `${this.url}/xmlrpc/2/common`;
    const common = this.url.startsWith('https') 
      ? xmlrpc.createSecureClient(clientUrl) 
      : xmlrpc.createClient(clientUrl);

    return new Promise((resolve, reject) => {
      common.methodCall('authenticate', [this.db, this.username, this.password, {}], (error: any, value: any) => {
        if (error) return reject(new Error(`Odoo Auth Error: ${error.message}`));
        if (!value) return reject(new Error('Autenticación fallida en Odoo.'));
        this.uid = value;
        resolve(value);
      });
    });
  }

  async execute(model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    const uid = await this.connect();
    const clientUrl = `${this.url}/xmlrpc/2/object`;
    const models = this.url.startsWith('https') 
      ? xmlrpc.createSecureClient(clientUrl) 
      : xmlrpc.createClient(clientUrl);

    return new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [this.db, uid, this.password, model, method, args, kwargs], (error: any, value: any) => {
        if (error) return reject(new Error(`Odoo Execute Error (${model}.${method}): ${error.message}`));
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
        origin: 'Catálogo Web GioFarma',
        note: orderData.notes || ''
      }]);

      const orderInfo = await this.execute('sale.order', 'read', [[orderId]], { fields: ['name'] });

      return {
        order_id: orderId,
        order_name: orderInfo[0].name,
        partner_id: partnerId,
        success: true
      };
    } catch (error) {
      console.error('Odoo Integration Error:', error);
      throw error;
    }
  }
}
