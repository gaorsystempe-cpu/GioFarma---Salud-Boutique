
import React, { useState } from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: any) => Promise<void>;
  isSubmitting: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 border border-slate-100">
        <div className="bg-[#e9118c] p-12 lg:p-16 text-white text-center relative overflow-hidden">
          <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter relative z-10 leading-none">Datos de Envío</h2>
          <p className="text-pink-100 mt-4 font-bold uppercase tracking-[0.4em] text-[10px] relative z-10">Privacidad y Salud Garantizada</p>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 lg:p-16 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-3">Receptor del Pedido</label>
            <input 
              required
              type="text" 
              className="w-full border-none rounded-[2rem] p-7 bg-slate-50 focus:ring-4 focus:ring-[#e9118c]/10 outline-none font-bold text-slate-800 text-lg shadow-inner transition-all placeholder:text-slate-300"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Nombre y Apellidos"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-3">Email Confirmación</label>
              <input 
                required
                type="email" 
                className="w-full border-none rounded-[2rem] p-7 bg-slate-50 focus:ring-4 focus:ring-[#e9118c]/10 outline-none font-bold text-slate-800 text-lg shadow-inner transition-all placeholder:text-slate-300"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-3">WhatsApp / Teléfono</label>
              <input 
                required
                type="tel" 
                className="w-full border-none rounded-[2rem] p-7 bg-slate-50 focus:ring-4 focus:ring-[#e9118c]/10 outline-none font-bold text-slate-800 text-lg shadow-inner transition-all placeholder:text-slate-300"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="9XX XXX XXX"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-3">Dirección de Entrega</label>
            <textarea 
              required
              rows={3}
              className="w-full border-none rounded-[2rem] p-7 bg-slate-50 focus:ring-4 focus:ring-[#e9118c]/10 outline-none font-bold text-slate-800 text-lg shadow-inner transition-all resize-none placeholder:text-slate-300"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Calle, Número, Referencia y Distrito..."
            ></textarea>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-10">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-400 font-black py-7 rounded-[2rem] transition-all uppercase tracking-[0.4em] text-[10px]"
            >
              Regresar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-6 active:scale-95 italic text-2xl btn-premium"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Procesando...
                </>
              ) : (
                'Finalizar Pedido'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
