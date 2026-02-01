
import React, { useState, useEffect, useCallback } from 'react';
import { OdooService } from './services/odooService';
import { useCartStore } from './lib/cartStore';
import { Product, Category, PaginationInfo, Order } from './types';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'catalog' | 'orders' | 'admin'>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOdooError, setIsOdooError] = useState(false);

  const { items, clearCart, getTotalAmount, getTotalItems, addItem, removeItem, updateQuantity } = useCartStore();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setIsOdooError(false);
    try {
      const result = await OdooService.getProducts({
        page: currentPage,
        limit: 12,
        category: activeCategory,
        search: searchQuery
      });
      setProducts(result.data || []);
      setPagination(result.pagination);
    } catch (err) {
      console.error('Fetch Error:', err);
      setIsOdooError(true);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeCategory, searchQuery]);

  useEffect(() => {
    OdooService.getCategories().then(setCategories).catch(() => {});
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR PREMIUM */}
      <nav className="glass sticky top-0 z-[60] border-b border-slate-100/50 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="cursor-pointer group" onClick={() => setViewMode('catalog')}>
              <h1 className="text-2xl font-black italic tracking-tighter">
                GIO<span className="text-[#e9118c]">FARMA</span>
              </h1>
            </div>
            
            <div className="hidden md:flex items-center bg-white/50 rounded-2xl px-5 py-2.5 w-96 border border-slate-100 shadow-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-[#e9118c]/5 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input 
                className="bg-transparent border-none outline-none ml-4 w-full text-sm font-bold placeholder:text-slate-300"
                placeholder="Busca salud y bienestar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode('orders')}
              className={`p-3.5 rounded-2xl transition-all ${viewMode === 'orders' ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>

            <button 
              onClick={() => setViewMode('admin')}
              className={`p-3.5 rounded-2xl transition-all ${viewMode === 'admin' ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative ml-2 p-3.5 bg-[#e9118c] text-white rounded-2xl shadow-xl shadow-pink-100 hover:scale-105 active:scale-95 transition-all btn-premium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - El toque Premium */}
      {viewMode === 'catalog' && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-10 animate-slide-up">
           <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-white shadow-2xl">
              <div className="relative z-10 max-w-xl">
                 <span className="inline-block bg-[#e9118c] text-[10px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-full mb-6">Salud & Bienestar</span>
                 <h2 className="text-4xl lg:text-6xl font-black italic leading-[0.9] tracking-tighter mb-6">Cuidado Médico<br/>de Nivel <span className="text-[#e9118c]">Boutique</span>.</h2>
                 <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">Encuentra los mejores medicamentos y productos de cuidado personal con stock real sincronizado de Odoo ERP.</p>
                 <div className="flex gap-4">
                    <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e9118c] hover:text-white transition-all">Explorar Ahora</button>
                    <button className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">Ver Promociones</button>
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e9118c]/20 blur-[120px] rounded-full"></div>
                 <div className="absolute top-1/2 right-0 -translate-y-1/2 p-20 opacity-20">
                    <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.5"><path d="M12 2v20M2 12h20M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/></svg>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {viewMode === 'catalog' && (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Categorías */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-32">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8">Categorías</h3>
                <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto no-scrollbar pb-2">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className={`px-5 py-3.5 rounded-2xl text-[11px] font-black text-left transition-all whitespace-nowrap uppercase tracking-wider ${activeCategory === null ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Ver Todo
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.odoo_id)}
                      className={`px-5 py-3.5 rounded-2xl text-[11px] font-black text-left transition-all whitespace-nowrap uppercase tracking-wider ${activeCategory === cat.odoo_id ? 'bg-[#e9118c] text-white shadow-xl shadow-pink-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Grid Productos */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[3rem] p-10 space-y-6 border border-slate-100/50 animate-pulse">
                      <div className="aspect-square bg-slate-50 rounded-[2rem] w-full" />
                      <div className="h-4 bg-slate-50 rounded-full w-3/4" />
                      <div className="h-4 bg-slate-50 rounded-full w-1/2" />
                      <div className="flex justify-between items-center pt-4">
                         <div className="h-10 bg-slate-50 rounded-xl w-1/3" />
                         <div className="h-14 w-14 bg-slate-50 rounded-2xl" />
                      </div>
                    </div>
                  ))
                ) : products.length > 0 ? (
                  products.map(p => (
                    <ProductCard key={p.id} product={p} onAddToCart={(p) => {
                      addItem({
                        product_id: p.odoo_id,
                        name: p.name,
                        sku: p.sku,
                        price: p.list_price,
                        image_url: p.image_url,
                        max_stock: p.qty_available
                      });
                      setIsCartOpen(true);
                    }} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter">Sin resultados</h3>
                    <p className="text-slate-400 mt-2 font-medium">No encontramos lo que buscas. Intenta con otro término.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'admin' && <AdminPanel />}
        {viewMode === 'orders' && (
           <div className="max-w-2xl mx-auto py-10 animate-slide-up">
              <h2 className="text-5xl font-black italic tracking-tighter mb-10">Historial <span className="text-[#e9118c]">Gio</span></h2>
              {/* Historial logic remains... */}
           </div>
        )}
      </main>

      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)} 
        items={items as any}
        total={getTotalAmount()}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        onCheckout={() => {
          setIsCartOpen(false);
          setShowCheckout(true);
        }}
      />

      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSubmit={async (details) => {
          const result = await OdooService.createOrder({
            ...details,
            items: items.map(i => ({
              product_id: i.product_id,
              name: i.name,
              sku: i.sku,
              price: i.price,
              quantity: i.quantity
            }))
          });
          if (result.success) {
            setOrderSuccess(result.data);
            clearCart();
            setShowCheckout(false);
          }
        }}
        isSubmitting={false}
      />
    </div>
  );
};

export default App;
