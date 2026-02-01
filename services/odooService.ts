
import { Product, Category, OrderDetails, Order, PaginationInfo } from '../types';

export class OdooService {
  /**
   * Obtiene productos llamando a /api/products
   */
  static async getProducts(params: { page?: number, limit?: number, category?: number | null, search?: string }): Promise<{ data: Product[], pagination: PaginationInfo }> {
    const url = new URL('/api/products', window.location.origin);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.limit) url.searchParams.append('limit', params.limit.toString());
    if (params.category) url.searchParams.append('category', params.category.toString());
    if (params.search) url.searchParams.append('search', params.search);

    const response = await fetch(url.toString());
    const result = await response.json();
    
    if (!result.success) throw new Error(result.error);
    return {
      data: result.data,
      pagination: result.pagination
    };
  }

  /**
   * Obtiene categorías llamando a /api/categories
   */
  static async getCategories(): Promise<Category[]> {
    const response = await fetch('/api/categories');
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  /**
   * Crea una orden llamando a /api/orders (POST)
   */
  static async createOrder(orderData: OrderDetails): Promise<{ success: boolean; data: any }> {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const result = await response.json();
    if (!result.success && !result.warning) throw new Error(result.error);
    return result;
  }

  /**
   * Obtiene historial llamando a /api/orders (GET)
   */
  static async getOrdersByEmail(email: string): Promise<Order[]> {
    const url = new URL('/api/orders', window.location.origin);
    url.searchParams.append('email', email);
    
    const response = await fetch(url.toString());
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
}
