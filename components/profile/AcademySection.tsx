import React, { useState, useEffect, useCallback } from 'react';
import { Building, CheckCircle, Clock, Search, Loader2 } from 'lucide-react';
import { User, RegistrationStatus, Academy } from '../../types';
import { supabase } from '../../lib/supabase';

interface AcademySectionProps {
  user: User;
  isEditing: boolean;
  selectedAcademyId?: string;
  onAcademyChange: (id: string, name: string) => void;
}

export const AcademySection: React.FC<AcademySectionProps> = ({ 
  user, isEditing, selectedAcademyId, onAcademyChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [academiesList, setAcademiesList] = useState<Academy[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(false);
  const [selectedName, setSelectedName] = useState(user.academy?.name || 'Não selecionada');

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest";
  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-md h-auto";

  const fetchAcademies = useCallback(async () => {
    if (!isEditing) return;
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
  }, [isEditing, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (isEditing) fetchAcademies();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, isEditing, fetchAcademies]);

  const handleSelect = (academy: Academy) => {
    onAcademyChange(academy.id, academy.name);
    setSelectedName(academy.name);
    setSearchTerm('');
  };

  return (
    <div className={cardClass}>
      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <Building className="text-cbjjs-blue" size={18} /> Minha Academia
      </h3>
      
      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <span className={labelClass}>Unidade Selecionada</span>
              <p className="text-sm font-bold text-cbjjs-blue mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                {selectedName}
              </p>
            </div>

            <div>
              <label className={labelClass}>Trocar para outra Unidade</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-cbjjs-blue text-sm dark:text-white"
                  placeholder="Pesquisar academia aprovada..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl divide-y dark:divide-gray-700 bg-gray-50/50 dark:bg-slate-900/30">
              {loadingAcademies ? (
                <div className="p-4 text-center">
                  <Loader2 className="animate-spin inline mr-2 text-cbjjs-blue" size={16}/>
                  <span className="text-xs text-gray-500 font-bold uppercase">Buscando...</span>
                </div>
              ) : academiesList.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 font-medium italic">
                  {searchTerm ? 'Nenhuma academia encontrada.' : 'Digite para pesquisar.'}
                </div>
              ) : academiesList.map(ac => (
                <button 
                  key={ac.id}
                  onClick={() => handleSelect(ac)}
                  className={`w-full p-3 text-left transition-all flex items-center justify-between text-sm
                    ${(selectedAcademyId || user.academyId) === ac.id ? 'bg-cbjjs-blue text-white' : 'hover:bg-blue-50 dark:hover:bg-slate-800 dark:text-gray-300'}
                  `}
                >
                  <span className="font-bold">{ac.name}</span>
                  {(selectedAcademyId || user.academyId) === ac.id && <CheckCircle size={16}/>}
                </button>
              ))}
            </div>
            
            <p className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 leading-relaxed">
              Importante: Ao trocar de academia, seu cadastro voltará para aprovação.
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className={labelClass}>Unidade Vinculada</span>
              <p className="font-bold text-sm dark:text-white">{user.academy?.name || 'Nenhuma unidade selecionada'}</p>
            </div>
            {user.academy && (
              <div className="flex items-center justify-between pt-2">
                <span className={labelClass}>Status Vínculo</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 ${user.academy.status === RegistrationStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {user.academy.status === RegistrationStatus.APPROVED ? <><CheckCircle size={10}/> Aprovado</> : <><Clock size={10}/> Aguardando Professor</>}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};