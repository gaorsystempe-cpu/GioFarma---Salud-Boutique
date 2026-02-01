
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState({
    store_name: 'GioFarma',
    whatsapp_number: '',
    payment_instructions_bank: ''
  });

  useEffect(() => {
    if (supabase) {
      fetchLogs();
      fetchSettings();
    }
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase!.from('sync_log').select('*').order('started_at', { ascending: false }).limit(5);
    setSyncLogs(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase!.from('store_settings').select('*').single();
    if (data) setSettings(data);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        headers: { 'Authorization': `Bearer manual-trigger` }
      });
      const result = await response.json();
      alert(result.success ? `Sincronización completada: ${result.processed} productos` : 'Error en sincronización');
      fetchLogs();
    } catch (e) {
      alert('Error al conectar con el servidor de sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveSettings = async () => {
    if (!supabase) return alert('Supabase no configurado');
    const { error } = await supabase.from('store_settings').upsert({ id: 'current_config', ...settings });
    alert(error ? 'Error al guardar configuración' : 'Configuración actualizada correctamente');
  };

  if (!supabase) {
    return (
      <div className="p-12 bg-red-50 rounded-[3rem] text-red-600 border border-red-100">
        <h3 className="text-2xl font-black mb-4">Error de Configuración</h3>
        <p className="font-bold">Faltan las variables de entorno de Supabase. Revisa tu panel de Vercel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter">Panel <span className="text-[#e9118c]">Admin</span></h2>
          <p className="text-slate-400 font-medium mt-2">Gestión de datos de empresa y sincronización Odoo ERP</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={isSyncing}
          className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-4 active:scale-95 transition-all shadow-2xl shadow-slate-200 disabled:opacity-50"
        >
          {isSyncing ? 'Procesando...' : 'Sincronizar ahora'}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={isSyncing ? 'animate-spin' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Historial Sync */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Estado de Sincronización</h3>
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <div className="space-y-4">
            {syncLogs.length > 0 ? syncLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100/50">
                <div>
                  <span className="font-black text-slate-800 text-sm block">{new Date(log.started_at).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(log.started_at).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {log.status === 'success' ? `${log.records_processed} PRODS` : 'FALLIDO'}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 py-10 italic">No hay registros de sincronización</p>
            )}
          </div>
        </div>

        {/* Configuración */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Datos de la Farmacia</h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nombre Comercial</label>
              <input 
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none border-2 border-transparent focus:border-slate-100 transition-all"
                value={settings.store_name}
                onChange={e => setSettings({...settings, store_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">WhatsApp Pedidos</label>
              <input 
                placeholder="519XXXXXXXX"
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none border-2 border-transparent focus:border-slate-100 transition-all"
                value={settings.whatsapp_number}
                onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cuentas Bancarias / Pago</label>
              <textarea 
                rows={3}
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold outline-none border-2 border-transparent focus:border-slate-100 transition-all resize-none"
                value={settings.payment_instructions_bank}
                onChange={e => setSettings({...settings, payment_instructions_bank: e.target.value})}
              />
            </div>
            <button 
              onClick={saveSettings}
              className="w-full bg-[#e9118c] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-pink-100 mt-4"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
