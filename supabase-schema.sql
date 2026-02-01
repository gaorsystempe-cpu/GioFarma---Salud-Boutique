
-- 1. Categorías
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id INTEGER,
  parent_name TEXT,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Productos
CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  odoo_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  list_price DECIMAL(10, 2) DEFAULT 0,
  qty_available INTEGER DEFAULT 0,
  virtual_available INTEGER DEFAULT 0,
  description TEXT,
  image_url TEXT,
  category_id INTEGER REFERENCES categories(odoo_id),
  category_name TEXT,
  uom_name TEXT,
  active BOOLEAN DEFAULT true,
  write_date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odoo_id TEXT, -- ID de Odoo (ej. S00045)
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  synced_to_odoo BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Líneas de Pedido
CREATE TABLE IF NOT EXISTS order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT,
  quantity INTEGER,
  price_unit DECIMAL(10, 2),
  subtotal DECIMAL(10, 2)
);

-- 6. Log de Sincronización
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT,
  status TEXT,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);

-- RLS Básico
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública" ON products FOR SELECT USING (active = true);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorías públicas" ON categories FOR SELECT USING (active = true);
