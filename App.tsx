
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OdooService } from './services/odooService';
import { useCartStore } from './lib/cartStore';
import { Product, Category, PaginationInfo, Order } from './types';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'catalog' | 'orders'>('catalog');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { items, clearCart, getTotalAmount, getTotalItems, addItem, removeItem, updateQuantity } = useCartStore();

  // Debounce para la búsqueda (Production Best Practice)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await OdooService.getProducts({
        page: currentPage,
        limit: 12,
        category: activeCategory,
        search: debouncedSearch
      });
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError("No pudimos conectar con el inventario. Reintentando...");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeCategory, debouncedSearch]);

  useEffect(() => {
    OdooService.getCategories()
      .then(setCategories)
      .catch(err => console.error("Error cargando categorías:", err));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCheckout = async (details: any) => {
    setIsSubmittingOrder(true);
    try {
      const orderDetails = {
        ...details,
        items: items.map(i => ({
          product_id: i.product_id, // Usamos product_id para Odoo
          name: i.name,
          sku: i.sku,
          price: i.price,
          quantity: i.quantity
        }))
      };
      const result = await OdooService.createOrder(orderDetails);
      if (result.success) {
        setOrderSuccess(result.data);
        clearCart();
        setShowCheckout(false);
        setIsCartOpen(false);
      }
    } catch (err: any) {
      alert("Hubo un problema al procesar tu pedido. Por favor, intenta de nuevo o contáctanos por WhatsApp.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const fetchOrders = async () => {
    if (!customerEmail) return;
    setLoading(true);
    try {
      const data = await OdooService.getOrdersByEmail(customerEmail);
      setOrders(data);
      if (data.length === 0) setError("No se encontraron pedidos para este correo.");
    } catch (err: any) {
      setError("Error al consultar el historial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-[#e9118c] selection:text-white">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-50 header-glow border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">
          <div 
            className="flex items-center gap-3 cursor-pointer shrink-0 group" 
            onClick={() => {setViewMode('catalog'); setActiveCategory(null); setSearchQuery(''); setDebouncedSearch('');}}
          >
            <div className="bg-[#e9118c] w-11 h-11 flex items-center justify-center rounded-2xl shadow-lg shadow-pink-100 group-hover:rotate-6 transition-all duration-300">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">GIO<span className="text-[#e9118c]">FARMA</span></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Salud Boutique</span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl relative hidden md:block">
            <div className="flex items-center bg-slate-100/80 rounded-2xl px-5 py-3.5 border border-transparent transition-all search-focus">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-slate-400 mr-3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input 
                type="text" 
                placeholder="Busca por medicamento, síntoma o marca..." 
                className="bg-transparent w-full outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode(viewMode === 'catalog' ? 'orders' : 'catalog')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#e9118c] transition-colors px-4 py-2"
            >
              {viewMode === 'catalog' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  <span>Mis Pedidos</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                  <span>Tienda</span>
                </>
              )}
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#e9118c] text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-4 border-white shadow-lg animate-pulse">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {viewMode === 'catalog' ? (
          <div className="flex flex-col lg:flex-row gap-12">
            {/* BARRA LATERAL */}
            <aside className="w-full lg:w-64 flex-shrink-0">
               <div className="sticky top-28 space-y-8">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-2">Departamentos</h3>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2">
                      <button 
                        onClick={() => {setActiveCategory(null); setCurrentPage(1);}} 
                        className={`whitespace-nowrap flex items-center gap-3 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === null ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                        Todo
                      </button>
                      {categories.map(cat => (
                        <button 
                          key={cat.id} 
                          onClick={() => {setActiveCategory(cat.odoo_id); setCurrentPage(1);}} 
                          className={`whitespace-nowrap px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${activeCategory === cat.odoo_id ? 'bg-[#e9118c] text-white shadow-xl shadow-pink-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="hidden lg:block bg-gradient-to-br from-[#e9118c] to-[#c10e74] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <h4 className="text-xl font-black italic tracking-tighter mb-4 leading-tight">¿Necesitas ayuda experta?</h4>
                      <p className="text-[10px] font-bold opacity-90 leading-relaxed uppercase tracking-wider mb-6">Nuestros farmacéuticos están en línea para ti.</p>
                      <a href="#" className="inline-block bg-white text-[#e9118c] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">WhatsApp Directo</a>
                    </div>
                    <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                  </div>
               </div>
            </aside>

            {/* LISTADO DE PRODUCTOS */}
            <div className="flex-1 min-h-[60vh]">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4.5] bg-white rounded-[2.5rem] border border-slate-100 animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                   <div className="w-20 h-20 bg-pink-50 text-[#e9118c] rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2 italic">¡Ups! Algo salió mal</h3>
                   <p className="text-slate-400 font-medium mb-8 max-w-xs">{error}</p>
                   <button onClick={fetchProducts} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Reintentar Ahora</button>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                   <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-6"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                   <p className="text-sm font-black uppercase tracking-[0.4em]">Sin resultados para tu búsqueda</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} onAddToCart={(p) => {
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
                    ))}
                  </div>
                  
                  {pagination && pagination.total_pages > 1 && (
                    <div className="mt-16 flex justify-center items-center gap-4">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => {setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({top: 0, behavior: 'smooth'});}}
                        className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-slate-200 disabled:opacity-20 hover:border-[#e9118c] transition-all shadow-sm"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Página <span className="text-slate-900">{currentPage}</span> de {pagination.total_pages}</span>
                      </div>
                      <button 
                        disabled={currentPage === pagination.total_pages}
                        onClick={() => {setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1)); window.scrollTo({top: 0, behavior: 'smooth'});}}
                        className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-slate-200 disabled:opacity-20 hover:border-[#e9118c] transition-all shadow-sm"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* VISTA DE MIS PEDIDOS */
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="text-center mb-16">
                <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter mb-4">Rastrea tu <span className="text-[#e9118c]">Bienestar</span></h2>
                <p className="text-slate-400 font-medium">Ingresa el correo electrónico que usaste en tu compra.</p>
             </div>
             
             <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 mb-12">
                <div className="flex flex-col sm:flex-row gap-4">
                   <input 
                      type="email" 
                      placeholder="ejemplo@correo.com" 
                      className="flex-1 bg-slate-50 border-none rounded-2xl p-6 text-lg font-bold focus:ring-4 focus:ring-[#e9118c]/10 outline-none placeholder:text-slate-300 transition-all" 
                      value={customerEmail} 
                      onChange={e => setCustomerEmail(e.target.value)} 
                   />
                   <button 
                      onClick={fetchOrders} 
                      disabled={!customerEmail || loading}
                      className="bg-slate-900 text-white px-10 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Buscando...' : 'Consultar Pedidos'}
                    </button>
                </div>
             </div>

             <div className="space-y-6">
               {orders.map(order => (
                 <div key={order.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#e9118c]">
                             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-black text-[#e9118c] uppercase tracking-widest">Orden</span>
                              <span className="text-xl font-black text-slate-900 tracking-tight italic">#{order.odoo_id || 'PENDIENTE'}</span>
                            </div>
                            <span className="text-xs text-slate-400 font-bold">{new Date(order.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                       </div>
                       <div className="w-full sm:w-auto flex sm:flex-col justify-between items-end gap-2">
                          <span className="text-2xl font-black text-slate-900 tracking-tighter italic">S/ {order.total_amount.toFixed(2)}</span>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                             {order.status === 'confirmed' ? 'Enviado' : 'En Preparación'}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
               {!loading && customerEmail && orders.length === 0 && (
                 <div className="text-center py-24 opacity-20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <p className="font-black text-xs uppercase tracking-[0.4em]">Sin registros históricos</p>
                 </div>
               )}
             </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-16 mt-auto">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div>
               <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                  <div className="bg-[#e9118c] w-7 h-7 flex items-center justify-center rounded-lg shadow-lg shadow-pink-100">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <span className="font-black tracking-tighter text-slate-900 text-lg">GIOFARMA</span>
               </div>
               <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">Cuidado experto para ti y tu familia. Calidad certificada en cada entrega directa de Odoo ERP.</p>
               <div className="flex justify-center md:justify-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-[#e9118c] transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-[#e9118c] transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
               </div>
            </div>
            <div>
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8">Información</h4>
               <ul className="space-y-4 text-[11px] font-bold text-slate-500">
                  <li><a href="#" className="hover:text-[#e9118c] transition-colors">Preguntas Frecuentes</a></li>
                  <li><a href="#" className="hover:text-[#e9118c] transition-colors">Políticas de Envío</a></li>
                  <li><a href="#" className="hover:text-[#e9118c] transition-colors">Términos de Servicio</a></li>
               </ul>
            </div>
            <div>
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8">Soporte</h4>
               <ul className="space-y-4 text-[11px] font-bold text-slate-500">
                  <li><a href="#" className="hover:text-[#e9118c] transition-colors">Libro de Reclamaciones</a></li>
                  <li><a href="#" className="hover:text-[#e9118c] transition-colors">Contacto Farmacéutico</a></li>
                  <li><a href="#" className="hover:text-[#e9118c] transition-colors">Trabaja con Nosotros</a></li>
               </ul>
            </div>
            <div>
               <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8">Pago Seguro</h4>
               <div className="flex flex-wrap gap-3 justify-center md:justify-start opacity-40">
                  <div className="w-10 h-6 bg-slate-200 rounded-md"></div>
                  <div className="w-10 h-6 bg-slate-200 rounded-md"></div>
                  <div className="w-10 h-6 bg-slate-200 rounded-md"></div>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">© 2024 GIO FARMA • SALUD DIGITAL PREMIUM CONECTADA A ODOO ERP</p>
         </div>
      </footer>

      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)} 
        items={items as any}
        total={getTotalAmount()}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        onCheckout={() => setShowCheckout(true)}
      />

      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSubmit={handleCheckout}
        isSubmitting={isSubmittingOrder}
      />

      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 animate-in fade-in duration-500">
           <div className="bg-white p-12 lg:p-16 rounded-[4rem] text-center max-w-lg shadow-2xl scale-in-center border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-green-400"></div>
              <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 text-green-500 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-4xl font-black mb-4 italic tracking-tight text-slate-900">¡Pedido Confirmado!</h3>
              <p className="text-slate-500 mb-2 font-bold uppercase tracking-widest text-[10px]">Tu ticket en Odoo es:</p>
              <div className="bg-slate-50 py-3 px-6 rounded-2xl mb-10 inline-block">
                <span className="text-2xl font-black text-[#e9118c] tracking-tighter italic">#{orderSuccess.odoo_order_id || 'PROCESANDO'}</span>
              </div>
              <p className="text-slate-400 mb-12 font-medium leading-relaxed">Te hemos enviado un correo con todos los detalles de tu compra y tiempos de entrega.</p>
              <button 
                onClick={() => setOrderSuccess(null)} 
                className="w-full bg-slate-900 text-white py-7 rounded-[2rem] font-black shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.4em] text-xs"
              >
                 Volver al Catálogo
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
