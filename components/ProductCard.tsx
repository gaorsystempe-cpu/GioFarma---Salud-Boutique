
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = (product.qty_available || 0) <= 0;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden flex flex-col h-full product-card group animate-slide-up">
      {/* IMAGEN AREA */}
      <div className="relative aspect-square bg-white flex items-center justify-center p-12 overflow-hidden group-hover:bg-slate-50 transition-colors">
        <img 
          src={product.image_url || 'https://via.placeholder.com/400?text=GioFarma'} 
          alt={product.name}
          className={`w-full h-full object-contain transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-20' : ''}`}
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-6">
             <span className="bg-slate-900 text-white text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-[0.2em] shadow-xl transform rotate-[-3deg]">
                Agotado
             </span>
          </div>
        )}
        
        <div className="absolute top-8 left-8">
           <span className="bg-white/90 backdrop-blur-sm text-slate-400 text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] border border-slate-100 shadow-sm">
              {product.category_name || 'Bienestar'}
           </span>
        </div>
      </div>
      
      {/* CONTENIDO */}
      <div className="p-10 flex flex-col flex-1 border-t border-slate-50 bg-white">
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-[1.2] tracking-tight group-hover:text-[#e9118c] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">SKU: {product.sku || 'N/A'}</span>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-400' : 'text-green-500'}`}>
                {isOutOfStock ? 'Sin stock' : `${product.qty_available} en stock`}
            </span>
          </div>
        </div>
        
        <div className="mt-10 pt-8 flex items-end justify-between border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#e9118c] font-black uppercase tracking-[0.2em] mb-1 italic">Precio Exclusivo</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-slate-900 tracking-tighter italic">S/</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{product.list_price.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl hover:shadow-[#e9118c]/20 active:scale-90 ${
              isOutOfStock 
              ? 'bg-slate-50 text-slate-200 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-[#e9118c]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
