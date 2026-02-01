
import React from 'react';
import { CartItem } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onUpdateQuantity: (id: number, q: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  items,
  total,
  onUpdateQuantity,
  onRemove,
  onCheckout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl transition-opacity duration-500" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)">
        <div className="p-10 lg:p-12 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Bolsa <span className="text-[#e9118c]">Gio</span></h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 lg:p-12 space-y-12">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-50">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              </div>
              <div className="space-y-2">
                 <p className="text-xl font-black text-slate-400 italic">Bolsa Vacía</p>
                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Inicia tu camino al bienestar</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-8 animate-in slide-in-from-right duration-500">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 p-3">
                  <img src={item.image_url || ''} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-slate-800 leading-tight text-base tracking-tight italic">{item.name}</h4>
                    <button 
                      onClick={() => onRemove(item.product_id)}
                      className="text-slate-200 hover:text-[#e9118c] transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                      <button onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-all text-xs font-black shadow-sm">-</button>
                      <span className="px-5 text-xs font-black text-slate-900">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-all text-xs font-black shadow-sm">+</button>
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tighter italic">S/ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-12 border-t border-slate-100 space-y-10">
          <div className="flex justify-between items-center">
             <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Total Inversión</span>
             <span className="text-4xl font-black text-slate-900 tracking-tighter italic">S/ {total.toFixed(2)}</span>
          </div>
          <button 
            disabled={items.length === 0}
            onClick={onCheckout}
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-50 disabled:text-slate-200 text-white font-black py-7 rounded-[2.5rem] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-6 active:scale-95 text-xs uppercase tracking-[0.5em] btn-premium"
          >
            <span>Confirmar Pedido</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
