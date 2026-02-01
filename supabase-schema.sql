
-- 1. TABLA DE CONFIGURACIÓN (Faltante en la captura)
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_config',
  store_name TEXT DEFAULT 'GioFarma',
  whatsapp_number TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  payment_instructions_bank TEXT,
  is_catalog_only BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO store_settings (id, store_name) 
VALUES ('current_config', 'GioFarma')
ON CONFLICT (id) DO NOTHING;

-- 2. PERMISOS DE LECTURA (Importante para que el frontend vea los datos)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura pública de configuración" ON store_settings;
CREATE POLICY "Permitir lectura pública de configuración" ON store_settings FOR SELECT USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON products;
CREATE POLICY "Permitir lectura pública de productos" ON products FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura pública de categorías" ON categories;
CREATE POLICY "Permitir lectura pública de categorías" ON categories FOR SELECT USING (true);

ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura pública de logs" ON sync_log;
CREATE POLICY "Permitir lectura pública de logs" ON sync_log FOR SELECT USING (true);
