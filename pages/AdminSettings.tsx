import React, { useState } from 'react';
import { Save, RefreshCw, Loader2, Settings, CreditCard, Layout, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';

interface Setting {
    key: string;
    value: string;
    label?: string;
}

export const AdminSettings: React.FC = () => {
  const { addToast } = useToast();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: settingsData, isLoading: loadingSettings, isError: errorState, refetch } = useSupabaseQuery<Setting[]>(
    ['admin-settings'],
    async (signal) => {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .order('key')
          .abortSignal(signal);
        
        if (error) return { data: null, error };
        return { data: data as Setting[], error: null };
    }
  );

  const settings = settingsData?.data || [];

  const handleUpdateSetting = async (key: string, newValue: string) => {
      setSavingKey(key);
      try {
          const { error } = await supabase
            .from('system_settings')
            .upsert({ key, value: newValue });

          if (error) throw error;

          addToast('success', "Configuração atualizada!");
          refetch();
      } catch (err: any) { 
          addToast('error', "Falha ao salvar dado."); 
      } finally {
          setSavingKey(null);
      }
  };

  const getSetting = (key: string, defaultValue: string = '') => {
      return settings.find(s => s.key === key)?.value || defaultValue;
  };

  const PlanCard = ({ id, label, priceKey, activeKey }: { id: string, label: string, priceKey: string, activeKey: string }) => {
      const price = getSetting(priceKey, '30.00');
      const isActive = getSetting(activeKey, 'true') === 'true';

      return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-cbjjs-blue transition-all">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[10px] font-black text-cbjjs-blue uppercase tracking-[0.2em] block mb-1">Configuração do Plano</span>
                    <h3 className="text-xl font-black dark:text-white uppercase">{label}</h3>
                </div>
                <button 
                    onClick={() => handleUpdateSetting(activeKey, isActive ? 'false' : 'true')}
                    disabled={savingKey === activeKey}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                >
                    {savingKey === activeKey ? <Loader2 className="animate-spin" size={14}/> : isActive ? <Eye size={14}/> : <EyeOff size={14}/>}
                    {isActive ? 'Ativo' : 'Oculto'}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input 
                        id={`price-${id}`}
                        defaultValue={price}
                        className="w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-2xl outline-none text-sm font-bold transition-all dark:text-white"
                        placeholder="0.00"
                    />
                </div>
                <button 
                    onClick={() => {
                        const el = document.getElementById(`price-${id}`) as HTMLInputElement;
                        handleUpdateSetting(priceKey, el.value.replace(',', '.'));
                    }}
                    disabled={savingKey === priceKey}
                    className="px-8 py-4 bg-cbjjs-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {savingKey === priceKey ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                    Salvar Preço
                </button>
            </div>
        </div>
      );
  };

  return (
      <div className="space-y-12 animate-fadeIn pb-20">
           <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black dark:text-white tracking-tight">Gestão de Informações</h2>
                    <p className="text-sm text-gray-500 font-medium">Controle de valores, planos e textos institucionais.</p>
                </div>
                <button onClick={() => refetch()} className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl hover:bg-gray-50 transition-all text-cbjjs-blue">
                    <RefreshCw size={20} className={loadingSettings ? 'animate-spin' : ''} />
                </button>
           </div>

           {loadingSettings ? <AdminListSkeleton /> : errorState ? <AdminErrorState onRetry={() => refetch()} /> : (
               <div className="space-y-12">
                   <section>
                       <div className="flex items-center gap-3 mb-6">
                           <CreditCard className="text-cbjjs-blue" size={24} />
                           <h3 className="text-lg font-black uppercase tracking-widest dark:text-white">Planos de Afiliação</h3>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <PlanCard id="digital" label="Versão Digital" priceKey="plan_digital_price" activeKey="plan_digital_active" />
                           <PlanCard id="printed" label="Versão Impressa" priceKey="plan_printed_price" activeKey="plan_printed_active" />
                           <PlanCard id="certificate" label="Certificado Academia" priceKey="academy_certificate_price" activeKey="academy_certificate_active" />
                       </div>

                   </section>

                   <section>
                        <div className="flex items-center gap-3 mb-6">
                           <Layout className="text-cbjjs-blue" size={24} />
                           <h3 className="text-lg font-black uppercase tracking-widest dark:text-white">Conteúdo do Site</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {settings.filter(s => !s.key.includes('plan_') && s.key !== 'registration_fee' && s.key !== 'resend_api_key').map(s => (
                                <div key={s.key} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-cbjjs-blue transition-all">
                                    <label className="text-[10px] font-black text-cbjjs-blue uppercase tracking-widest block mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-cbjjs-blue rounded-full"></div>
                                        {s.key.replace(/_/g, ' ')}
                                    </label>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <textarea 
                                            id={`setting-${s.key}`}
                                            defaultValue={s.value} 
                                            className="flex-1 p-5 bg-gray-50 dark:bg-slate-900 border-2 border-transparent focus:border-cbjjs-blue rounded-3xl outline-none text-sm font-bold transition-all dark:text-white shadow-inner" 
                                            rows={s.key.includes('text') || s.key.includes('banner') ? 4 : 1}
                                        />
                                        <div className="flex items-end">
                                            <button 
                                                onClick={() => {
                                                    const el = document.getElementById(`setting-${s.key}`) as HTMLTextAreaElement;
                                                    handleUpdateSetting(s.key, el.value);
                                                }}
                                                disabled={savingKey === s.key}
                                                className="px-8 py-4 bg-cbjjs-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {savingKey === s.key ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </section>
               </div>
           )}
      </div>
  );
};