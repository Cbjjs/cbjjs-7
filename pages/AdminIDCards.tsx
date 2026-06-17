import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Printer, CreditCard, LayoutGrid, Clock, CheckCircle2 } from 'lucide-react';
import { idCardService, AcademyStats } from '../services/idCardService';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { AdminListSkeleton, AdminErrorState } from '../components/AdminShared';
import { IDCardAcademyListItem } from '../components/admin/IDCardAcademyListItem';
import { AdminIDCardsDetail } from './AdminIDCardsDetail';
import { SortButton } from '../components/admin/id-cards/SortButton';

type FilterType = 'all' | 'pending' | 'printed';

export const AdminIDCards: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<FilterType>('pending'); // Alterado de 'all' para 'pending'
  const [selectedAcademy, setSelectedAcademy] = useState<AcademyStats | null>(null);

  const { data: academiesData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<AcademyStats[]>(
    ['admin-id-cards-academies'],
    async () => {
      try {
        const result = await idCardService.getAcademiesWithStats();
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  );

  const academies = academiesData?.data || [];

  const filteredAndSortedAcademies = useMemo(() => {
    let result = [...academies];

    if (statusFilter === 'pending') {
      result = result.filter(a => a.pendingPrintCount > 0);
    } else if (statusFilter === 'printed') {
      result = result.filter(a => a.pendingPrintCount === 0 && a.totalApprovedAthletes > 0);
    }

    if (searchTerm) {
      result = result.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return result;
  }, [academies, searchTerm, sortOrder, statusFilter]);

  if (selectedAcademy) {
    return (
        <AdminIDCardsDetail 
            academy={selectedAcademy} 
            onBack={() => {
                setSelectedAcademy(null);
                refetch();
            }} 
        />
    );
  }

  const tabClass = (active: boolean) => `
    flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
    ${active ? 'bg-cbjjs-blue text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-100 dark:border-slate-700'}
  `;

  return (
    <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
                <h2 className="text-2xl font-black dark:text-white tracking-tight">Gestão de Carteirinhas</h2>
                <p className="text-sm text-gray-500 font-medium">Controle de impressão por unidade cadastrada.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <SortButton 
                    order={sortOrder} 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
                />
                
                <button onClick={() => refetch()} className="p-3 text-cbjjs-blue bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl transition-all shadow-sm hover:bg-gray-50">
                    <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        <div className="flex flex-wrap gap-3">
            <button onClick={() => setStatusFilter('all')} className={tabClass(statusFilter === 'all')}>
                <LayoutGrid size={14}/> Ver tudo
            </button>
            <button onClick={() => setStatusFilter('pending')} className={tabClass(statusFilter === 'pending')}>
                <Clock size={14}/> Pendentes
            </button>
            <button onClick={() => setStatusFilter('printed')} className={tabClass(statusFilter === 'printed')}>
                <CheckCircle2 size={14}/> Impressos
            </button>
        </div>

        <div className="relative w-full">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Buscar por nome da academia ou equipe..." 
                className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
        </div>

        {isLoading ? (
            <AdminListSkeleton />
        ) : isError ? (
            <AdminErrorState onRetry={() => refetch()} />
        ) : (
            <div className="grid grid-cols-1 gap-5">
                {filteredAndSortedAcademies.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-700">
                        <CreditCard size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhuma academia encontrada para este filtro.</p>
                    </div>
                ) : (
                    filteredAndSortedAcademies.map(academy => (
                        <IDCardAcademyListItem 
                            key={academy.id} 
                            academy={academy} 
                            onClick={setSelectedAcademy} 
                        />
                    ))
                )}
            </div>
        )}
    </div>
  );
};