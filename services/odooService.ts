
import { Product, Category, OrderDetails, Order, PaginationInfo } from '../types';

export class OdooService {
  private static async safeFetch(url: string, options?: RequestInit) {
    // Usamos rutas relativas para mayor compatibilidad con proxies de Vercel/Vite
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Servidor respondió con error ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Respuesta no-JSON recibida:', text.substring(0, 100));
      throw new Error('El servidor devolvió un formato no válido. Verifica que las funciones API estén desplegadas.');
    }

    return await response.json();
  }

  static async getProducts(params: { page?: number, limit?: number, category?: number | null, search?: string }): Promise<{ data: Product[], pagination: PaginationInfo }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category.toString());
    if (params.search) searchParams.append('search', params.search);

    const result = await this.safeFetch(`/api/products?${searchParams.toString()}`);
    
    if (!result.success) throw new Error(result.error);
    return {
      data: result.data || [],
      pagination: result.pagination
    };
  }

  static async getCategories(): Promise<Category[]> {
    try {
      const result = await this.safeFetch('/api/categories');
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    } catch (e) {
      console.error('Error al cargar categorías:', e);
      return [];
    }
  }

  static async createOrder(orderData: OrderDetails): Promise<{ success: boolean; data: any }> {
    const result = await this.safeFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!result.success && !result.warning) throw new Error(result.error);
    return result;
  }

  static async getOrdersByEmail(email: string): Promise<Order[]> {
    const result = await this.safeFetch(`/api/orders?email=${encodeURIComponent(email)}`);
    if (!result.success) throw new Error(result.error);
    return result.data || [];
  }
}
