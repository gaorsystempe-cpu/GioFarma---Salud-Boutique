
export interface Product {
  id: number;
  odoo_id: number;
  name: string;
  sku: string | null;
  list_price: number;
  cost_price?: number;
  qty_available: number;
  virtual_available: number;
  description: string | null;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  uom_name: string | null;
  active: boolean;
  write_date?: string;
}

export interface Category {
  id: number;
  odoo_id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  max_stock: number;
}

export interface Customer {
  id: string;
  odoo_id?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface Order {
  id: string;
  odoo_id?: number;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'cancelled';
  total_amount: number;
  notes?: string;
  synced_to_odoo: boolean;
  created_at: string;
}

export interface OrderDetails {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: { 
    product_id: number; 
    name: string;
    sku: string | null;
    price: number;
    quantity: number;
  }[];
  notes?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
