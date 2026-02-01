
import { Product, Category, OrderDetails, Order, PaginationInfo } from '../types';

export class OdooService {
  private static async safeFetch(url: string, options?: RequestInit) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || `Error ${response.status}`);
        }
        const text = await response.text();
        const snippet = text.substring(0, 100).replace(/<[^>]*>?/gm, '').trim();
        throw new Error(snippet || `Error del servidor ${response.status}`);
      }

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 100));
        throw new Error('El servidor devolvió una respuesta no válida (HTML). Esto suele ocurrir por un error 404 o un fallo en el despliegue de la API.');
      }

      return await response.json();
    } catch (e: any) {
      console.error('Fetch error:', e.message);
      throw e;
    }
  }

  static async getProducts(params: { page?: number, limit?: number, category?: number | null, search?: string }): Promise<{ data: Product[], pagination: PaginationInfo }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.category) searchParams.append('category', params.category.toString());
    if (params.search) searchParams.append('search', params.search);

    const result = await this.safeFetch(`/api/products?${searchParams.toString()}`);
    if (!result.success) throw new Error(result.error);
    return { data: result.data || [], pagination: result.pagination };
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
    if (!result.success) throw new Error(result.error);
    return result;
  }

  static async getOrdersByEmail(email: string): Promise<Order[]> {
    const result = await this.safeFetch(`/api/orders?email=${encodeURIComponent(email)}`);
    if (!result.success) throw new Error(result.error);
    return result.data || [];
  }
}
