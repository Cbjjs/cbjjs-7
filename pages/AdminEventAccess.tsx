import React, { useState } from 'react';
import { Search, RefreshCw, Scan } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { AdminListSkeleton, AdminErrorState, PaginationControls } from '../components/AdminShared';
import { athleteService } from '../services/athleteService';
import { User, PaymentStatus } from '../types';
import { EventAccessModal } from '../components/admin/EventAccessModal';

export const AdminEventAccess: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: queryData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<User[]>(
    ['admin-event-access-search', searchTerm, page],
    async (signal) => {
      if (!searchTerm || searchTerm.trim().length < 2) {
          return { data: [], error: null, count: 0 };
      }

      const trimmed = searchTerm.trim();
      const isNumeric = /^\d+$/.test(trimmed);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [resP, resD] = await Promise.all([
          (isNumeric 
            ? supabase.from('profiles').select('*').eq('federation_id', parseInt(trimmed, 10))
            : supabase.from('profiles').select('*').ilike('full_name', `%${trimmed}%`)
          ).abortSignal(signal!),
          (isNumeric 
            ? supabase.from('dependents').select('*').eq('federation_id', parseInt(trimmed, 10))
            : supabase.from('dependents').select('*').ilike('full_name', `%${trimmed}%`)
          ).abortSignal(signal!)
      ]);

      if (resP.error) return { data: null, error: resP.error };

      const mappedP = (resP.data || []).map(p => athleteService.mapRawToUser(p, false));
      const mappedD = (resD.data || []).map(d => athleteService.mapRawToUser(d, true));

      const combined = [...mappedP, ...mappedD].sort((a, b) => a.fullName.localeCompare(b.fullName));
      
      return { 
          data: combined.slice(from, to + 1), 
          error: null, 
          count: combined.length 
      };
    },
    { enabled: searchTerm.trim().length >= 2 }
  );

  const results = queryData?.data || [];
  const totalCount = queryData?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Acesso Evento</h2>
          <p className="text-sm text-gray-500 font-medium">Busca rápida de atletas para validação de entrada.</p>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                Encontrados: {totalCount}
             </span>
          )}
          <button 
            onClick={() => refetch()} 
            className="p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-cbjjs-blue hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Digite o nome ou número de inscrição (ID)..." 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm text-sm" 
          value={searchTerm} 
          onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
          }} 
        />
      </div>

      {isLoading ? (
        <AdminListSkeleton />
      ) : isError ? (
        <AdminErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {results.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-700">
              <Scan size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                {searchTerm.length < 2 ? 'Aguardando termo de busca...' : 'Nenhum atleta encontrado.'}
              </p>
            </div>
          ) : (
            results.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-cbjjs-blue transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black overflow-hidden shadow-inner border dark:border-slate-600">
                    {user.profileImage ? (
                      <img src={user.profileImage} className="w-full h-full object-cover" alt={user.fullName} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-xl">{user.fullName.substring(0,2).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold dark:text-white group-hover:text-cbjjs-blue transition-colors">{user.fullName}</h4>
                      {user.federationId && (
                        <span className="text-[9px] font-mono font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 px-1.5 py-0.5 rounded">
                          ID: {String(user.federationId).padStart(6, '0')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                      {user.isDependent ? 'Atleta Menor' : (user.athleteData?.belt ? `Faixa ${user.athleteData.belt}` : 'Atleta')} 
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-none">{user.email || 'Acesso via Responsável'}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${user.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.paymentStatus === PaymentStatus.PAID ? 'Anuidade em Dia' : 'Anuidade Pendente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <PaginationControls 
          page={page} 
          totalPages={totalPages} 
          onPrev={() => setPage(p => Math.max(1, p - 1))} 
          onNext={() => setPage(p => p + 1)} 
        />
      )}

      <EventAccessModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </div>
  );
};