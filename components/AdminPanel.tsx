
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    store_name: 'GioFarma',
    whatsapp_number: '',
    payment_instructions_bank: ''
  });

  useEffect(() => {
    if (supabase && isAuthorized) {
      fetchLogs();
      fetchSettings();
    }
  }, [isAuthorized]);

  const fetchLogs = async () => {
    try {
      const { data } = await supabase!.from('sync_log').select('*').order('started_at', { ascending: false }).limit(5);
      setSyncLogs(data || []);
    } catch (e) {
      console.error("Error fetching logs", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase!.from('store_settings').select('*').maybeSingle();
      if (data) setSettings(data);
    } catch (e) {
      console.error("Error fetching settings", e);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthorized(true);
    } else {
      alert('❌ Clave incorrecta');
      setPassword('');
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        headers: { 
          'Authorization': `Bearer manual-trigger`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`✅ Éxito: ${result.processed} productos sincronizados.`);
        fetchLogs();
      } else {
        const errorMsg = result.error || 'Error desconocido en el servidor';
        alert(`❌ Error de Sincronización: ${errorMsg}`);
      }
    } catch (e: any) {
      alert(`❌ Error de red: ${e.message || 'No se pudo contactar con la API'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveSettings = async () => {
    if (!supabase) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('store_settings').upsert({ 
        id: 'current_config', 
        ...settings,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      alert('✅ Configuración guardada correctamente.');
    } catch (e: any) {
      alert(`❌ Error al guardar: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. ESTADO DE BLOQUEO POR CONTRASEÑA
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 animate-slide-up">
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter mb-2">Acceso <span className="text-[#e9118c]">Privado</span></h2>
          <p className="text-slate-400 font-medium mb-10 text-sm">Ingresa la clave de administrador para gestionar la farmacia.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              autoFocus
              className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 text-center font-black tracking-[0.5em] text-xl focus:ring-4 focus:ring-pink-50 transition-all outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-lg"
            >
              Desbloquear Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. ESTADO DE ERROR DE CONFIGURACIÓN (SUPABASE)
  if (!supabase) {
    return (
      <div className="max-w-2xl mx-auto mt-10 animate-slide-up">
        <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center">
          <div className="w-24 h-24 bg-pink-50 text-[#e9118c] rounded-full flex items-center justify-center mx-auto mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 16h.01"/><path d="M12 8v4"/><path d="M15.312 2a2 2 0 0 1 1.664 1.135l5.223 12.385a4 4 0 0 1-3.664 5.48H5.465a4 4 0 0 1-3.664-5.48l5.223-12.385A2 2 0 0 1 8.688 2h6.624z"/></svg>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter mb-4">Configuración Requerida</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Las variables de Supabase en Vercel deben tener el prefijo <code className="bg-slate-100 px-2 py-1 rounded text-[#e9118c] font-bold">VITE_</code>.
          </p>
          <button onClick={() => window.location.reload()} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Reintentar conexión</button>
        </div>
      </div>
    );
  }

  // 3. PANEL DE ADMINISTRACIÓN COMPLETO
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-slide-up pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter">Panel <span className="text-[#e9118c]">Admin</span></h2>
          <p className="text-slate-400 font-medium mt-2">Control total de stock Odoo & Configuración Boutique</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={isSyncing}
          className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-4 active:scale-95 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 btn-premium group"
        >
          {isSyncing ? 'Sincronizando...' : 'Sincronizar con Odoo'}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Log de Conexión</h3>
          <div className="space-y-3">
            {syncLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-300 font-bold italic">No hay logs de sincronización</div>
            ) : syncLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100/30">
                <div>
                  <span className="font-black text-slate-800 text-sm block tracking-tight">{new Date(log.started_at).toLocaleTimeString()}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.started_at).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-4 py-2 rounded-xl italic ${log.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {log.status === 'success' ? `+${log.records_processed} PRODS` : 'ERROR'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Identidad Digital</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Farmacia</label>
              <input className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none" value={settings.store_name} onChange={e => setSettings({...settings, store_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WhatsApp Ventas</label>
              <input placeholder="Ej: 51987654321" className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none" value={settings.whatsapp_number} onChange={e => setSettings({...settings, whatsapp_number: e.target.value})} />
            </div>
            <button onClick={saveSettings} disabled={isSaving} className="w-full bg-[#e9118c] text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-pink-100 disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
