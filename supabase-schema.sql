
-- Tabla para configuraciones generales de la tienda
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

-- Ampliar log de sincronización
ALTER TABLE sync_log ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'manual';
