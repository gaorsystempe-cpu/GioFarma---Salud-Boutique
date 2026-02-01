
const xmlrpc = require('xmlrpc');

class OdooClient {
  constructor() {
    // Intentar leer tanto la versión estándar como la versión VITE_
    this.url = process.env.VITE_ODOO_URL || process.env.ODOO_URL;
    this.db = process.env.VITE_ODOO_DB || process.env.ODOO_DB;
    this.username = process.env.VITE_ODOO_USERNAME || process.env.ODOO_USERNAME;
    this.password = process.env.VITE_ODOO_API_KEY || process.env.ODOO_API_KEY;
    this.uid = null;
  }

  async connect() {
    if (this.uid) return this.uid;
    
    if (!this.url || !this.db || !this.password) {
      console.error('Faltan variables:', { url: !!this.url, db: !!this.db, pass: !!this.password });
      throw new Error('Faltan variables de entorno para Odoo (VITE_ODOO_URL, VITE_ODOO_DB o VITE_ODOO_API_KEY)');
    }

    const clientUrl = `${this.url}/xmlrpc/2/common`;
    const common = this.url.startsWith('https') 
      ? xmlrpc.createSecureClient(clientUrl) 
      : xmlrpc.createClient(clientUrl);

    return new Promise((resolve, reject) => {
      common.methodCall('authenticate', [this.db, this.username, this.password, {}], (error, value) => {
        if (error) return reject(new Error(`Error de Conexión Odoo: ${error.message}`));
        if (!value) return reject(new Error('Autenticación fallida en Odoo. Verifica tus credenciales (VITE_ODOO_USERNAME / VITE_ODOO_API_KEY).'));
        this.uid = value;
        resolve(value);
      });
    });
  }

  async execute(model, method, args, kwargs = {}) {
    const uid = await this.connect();
    const clientUrl = `${this.url}/xmlrpc/2/object`;
    const models = this.url.startsWith('https') 
      ? xmlrpc.createSecureClient(clientUrl) 
      : xmlrpc.createClient(clientUrl);

    return new Promise((resolve, reject) => {
      models.methodCall('execute_kw', [this.db, uid, this.password, model, method, args, kwargs], (error, value) => {
        if (error) return reject(new Error(`Odoo Execute Error (${model}.${method}): ${error.message}`));
        resolve(value);
      });
    });
  }

  async createSaleOrder(orderData) {
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

      const orderLines = orderData.order_lines.map(line => [0, 0, {
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

module.exports = OdooClient;
