
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
  const [storeSettings, setStoreSettings] = useState<any>({ store_name: 'GIOFARMA' });
  const [customerEmail, setCustomerEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOdooError, setIsOdooError] = useState(false);

  const { items, clearCart, getTotalAmount, getTotalItems, addItem, removeItem, updateQuantity } = useCartStore();

  const fetchStoreSettings = async () => {
    try {
      if (!supabase) return;
      const { data } = await supabase.from('store_settings').select('*').maybeSingle();
      if (data) setStoreSettings(data);
    } catch (e) {
      console.error("Error loading settings", e);
    }
  };

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
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeCategory, searchQuery]);

  useEffect(() => {
    fetchStoreSettings();
    OdooService.getCategories().then(setCategories).catch(() => setCategories([]));
    fetchProducts();
  }, [fetchProducts]);

  const handleFinishOrder = async (details: any) => {
    try {
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
        // Enviar a WhatsApp si hay número configurado
        if (storeSettings.whatsapp_number) {
          const message = `¡Hola! Nuevo pedido de *${details.name}*\n\n` +
            items.map(i => `• ${i.name} (x${i.quantity})`).join('\n') +
            `\n\n*Total: S/ ${getTotalAmount().toFixed(2)}*\n` +
            `Dirección: ${details.address}`;
          
          const encoded = encodeURIComponent(message);
          window.open(`https://wa.me/${storeSettings.whatsapp_number}?text=${encoded}`, '_blank');
        }

        clearCart();
        setShowCheckout(false);
        alert('✅ ¡Pedido recibido! Nos pondremos en contacto contigo pronto.');
      }
    } catch (e: any) {
      alert(`Error al procesar: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR PREMIUM */}
      <nav className="glass sticky top-0 z-[60] border-b border-slate-100/50 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="cursor-pointer group" onClick={() => setViewMode('catalog')}>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase">
                {storeSettings.store_name.split(' ')[0]}<span className="text-[#e9118c]">{storeSettings.store_name.split(' ').slice(1).join(' ') || ''}</span>
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
              onClick={() => { setViewMode('admin'); fetchStoreSettings(); }}
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

      {/* HERO SECTION */}
      {viewMode === 'catalog' && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-10 animate-slide-up">
           <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-white shadow-2xl">
              <div className="relative z-10 max-w-xl">
                 <span className="inline-block bg-[#e9118c] text-[10px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-full mb-6">Salud & Bienestar</span>
                 <h2 className="text-4xl lg:text-6xl font-black italic leading-[0.9] tracking-tighter mb-6">Salud Pro<br/>de Nivel <span className="text-[#e9118c]">Boutique</span>.</h2>
                 <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">Gestionado por {storeSettings.store_name}. Stock real sincronizado directamente de Odoo ERP.</p>
              </div>
           </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {viewMode === 'catalog' && (
          <div className="flex flex-col lg:flex-row gap-12">
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-32">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8">Categorías</h3>
                <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto no-scrollbar pb-2">
                  <button onClick={() => setActiveCategory(null)} className={`px-5 py-3.5 rounded-2xl text-[11px] font-black text-left transition-all uppercase tracking-wider ${activeCategory === null ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Ver Todo</button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(cat.odoo_id)} className={`px-5 py-3.5 rounded-2xl text-[11px] font-black text-left transition-all uppercase tracking-wider ${activeCategory === cat.odoo_id ? 'bg-[#e9118c] text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  [...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-[3rem] p-10 h-96 animate-pulse" />)
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
                  <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100 italic">
                    <p className="text-slate-400 font-bold">No se encontraron productos.</p>
                    <p className="text-[10px] uppercase tracking-widest mt-2">Sincroniza con Odoo desde el Panel Admin si es tu primera vez.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'admin' && <AdminPanel />}
        {viewMode === 'orders' && (
           <div className="max-w-2xl mx-auto py-10 animate-slide-up">
              <h2 className="text-5xl font-black italic tracking-tighter mb-10">Mis <span className="text-[#e9118c]">Pedidos</span></h2>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm mb-12">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4 ml-2">Consulta por Email</label>
                <div className="flex gap-4">
                  <input className="flex-1 bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="tu@email.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                  <button onClick={async () => setOrders(await OdooService.getOrdersByEmail(customerEmail))} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-all">Buscar</button>
                </div>
              </div>
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
        onCheckout={() => { setIsCartOpen(false); setShowCheckout(true); }}
      />

      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSubmit={handleFinishOrder}
        isSubmitting={false}
      />
    </div>
  );
};

export default App;
