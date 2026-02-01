
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = (product.qty_available || 0) <= 0;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden flex flex-col h-full product-card-hover group relative">
      {/* IMAGEN */}
      <div className="relative aspect-square bg-white flex items-center justify-center p-8 overflow-hidden">
        <img 
          src={product.image_url || 'https://via.placeholder.com/400?text=GioFarma'} 
          alt={product.name}
          className={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-30' : ''}`}
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center px-4">
             <span className="bg-slate-900 text-white text-[9px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-2xl rotate-[-5deg]">
                Sin Stock
             </span>
          </div>
        )}
        
        <div className="absolute top-6 left-6">
           <span className="bg-slate-50 text-slate-400 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.2em] border border-slate-100">
              {product.category_name || 'Esencial'}
           </span>
        </div>
      </div>
      
      {/* CONTENIDO */}
      <div className="p-8 flex flex-col flex-1 border-t border-slate-50">
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#e9118c] transition-colors mb-3">
            {product.name}
          </h3>
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-6">SKU: {product.sku || '---'}</p>
        </div>
        
        <div className="mt-auto pt-6 flex items-end justify-between gap-2 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#e9118c] font-black uppercase tracking-[0.2em] leading-none mb-2 italic">Exclusivo Web</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-900 tracking-tighter italic leading-none">S/</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{product.list_price.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              isOutOfStock 
              ? 'bg-slate-50 text-slate-200 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-[#e9118c] hover:shadow-pink-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
