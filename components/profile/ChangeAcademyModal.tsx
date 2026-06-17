"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, CheckCircle, Building, Save } from 'lucide-react';
import { Academy } from '../../types';
import { supabase } from '../../lib/supabase';

interface ChangeAcademyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (academyId: string, academyName: string) => Promise<void>;
  currentAcademyName?: string;
  isSubmitting: boolean;
}

export const ChangeAcademyModal: React.FC<ChangeAcademyModalProps> = ({
  isOpen, onClose, onConfirm, currentAcademyName, isSubmitting
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [academiesList, setAcademiesList] = useState<Academy[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState<{id: string, name: string} | null>(null);

  const fetchAcademies = useCallback(async () => {
    setLoadingAcademies(true);
    try {
      let query = supabase.from('academies')
        .select('*')
        .eq('status', 'APPROVED')
        .eq('deleted', 'no') // Filtro de lixeira adicionado
        .order('name', { ascending: true })
        .limit(20);
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAcademiesList(data as any || []);
    } catch (error) {
      console.error("Erro ao buscar academias:", error);
    } finally {
      setLoadingAcademies(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
        const timer = setTimeout(() => fetchAcademies(), 400);
        return () => clearTimeout(timer);
    }
  }, [searchTerm, isOpen, fetchAcademies]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl relative border dark:border-slate-700 overflow-hidden">
        <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
            <X size={24} />
        </button>

        <div className="p-8 md:p-10">
            <div className="mb-8">
                <h3 className="text-2xl font-black dark:text-white tracking-tight leading-tight">Alterar Academia</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Selecione a unidade correta para seu vínculo.</p>
            </div>

            <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                    <span className="text-[10px] font-black text-cbjjs-blue uppercase tracking-widest block mb-1">Unidade Atual</span>
                    <p className="font-bold text-gray-700 dark:text-blue-200">{currentAcademyName || 'Não informada'}</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                        type="text"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-cbjjs-blue transition-all text-sm dark:text-white"
                        placeholder="Pesquisar nova unidade..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-[1.5rem] divide-y dark:divide-gray-700 bg-white dark:bg-slate-900 shadow-inner">
                    {loadingAcademies ? (
                        <div className="p-8 text-center">
                            <Loader2 className="animate-spin inline text-cbjjs-blue mb-2" size={24}/>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Buscando Unidades...</p>
                        </div>
                    ) : academiesList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <Building size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm font-medium italic">Nenhuma academia aprovada encontrada.</p>
                        </div>
                    ) : academiesList.map(ac => (
                        <button 
                            key={ac.id}
                            onClick={() => setSelectedAcademy({ id: ac.id, name: ac.name })}
                            className={`w-full p-5 text-left transition-all flex items-center justify-between
                                ${selectedAcademy?.id === ac.id ? 'bg-cbjjs-blue text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-gray-300'}
                            `}
                        >
                            <span className="font-bold text-sm">{ac.name}</span>
                            {selectedAcademy?.id === ac.id && <CheckCircle size={18}/>}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => selectedAcademy && onConfirm(selectedAcademy.id, selectedAcademy.name)}
                    disabled={!selectedAcademy || isSubmitting}
                    className="w-full py-5 bg-cbjjs-blue text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Confirmar Nova Unidade
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};