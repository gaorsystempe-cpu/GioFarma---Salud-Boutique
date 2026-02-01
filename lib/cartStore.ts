
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: number; 
  product_id: number;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
  max_stock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'id'>) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(i => i.product_id === item.product_id);
          
          if (existingItem) {
            return {
              items: state.items.map(i =>
                i.product_id === item.product_id
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.max_stock) }
                  : i
              )
            };
          } else {
            return {
              items: [...state.items, { ...item, id: item.product_id, quantity: 1 }]
            };
          }
        });
      },

      removeItem: (product_id) => {
        set((state) => ({
          items: state.items.filter(i => i.product_id !== product_id)
        }));
      },

      updateQuantity: (product_id, quantity) => {
        set((state) => ({
          items: state.items.map(i =>
            i.product_id === product_id
              ? { ...i, quantity: Math.max(0, Math.min(quantity, i.max_stock)) }
              : i
          ).filter(i => i.quantity > 0)
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'cart-storage',
    }
  )
);
