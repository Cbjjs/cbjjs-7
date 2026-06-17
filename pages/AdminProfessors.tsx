import React, { useState } from 'react';
import { Search, RefreshCw, Shield } from 'lucide-react';
import { User, RegistrationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { AdminListSkeleton, PaginationControls, AdminErrorState } from '../components/AdminShared';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { AdminProfessorDetailsModal } from '../components/AdminProfessorDetailsModal';

export const AdminProfessors: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [viewingProfId, setViewingProfId] = useState<string | null>(null);

  const { data: profsData, isLoading: loading, isError: errorState, refetch } = useSupabaseQuery<User[]>(
    ['admin-professors', searchTerm, page],
    async (signal) => {
      // 1. Busca todas as academias para mapear os donos (professores)
      const { data: academiesData } = await supabase
        .from('academies')
        .select('id, name, owner_id, status')
        .order('created_at', { ascending: true });

      const ownerIds = Array.from(new Set(academiesData?.map(a => a.owner_id) || []));

      if (ownerIds.length === 0) return { data: [], error: null, count: 0 };

      // Criar um mapa de owner_id para lista de academias para exibição rápida
      const academyMap: Record<string, {id: string, name: string, status: RegistrationStatus}[]> = {};
      academiesData?.forEach(acc => {
          if (!academyMap[acc.owner_id]) academyMap[acc.owner_id] = [];
          academyMap[acc.owner_id].push({
              id: acc.id,
              name: acc.name,
              status: acc.status as RegistrationStatus
          });
      });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase.from('profiles').select('*', { count: 'exact' }).in('id', ownerIds);
      
      if (searchTerm) {
          const trimmedSearch = searchTerm.trim();
          // Verifica se o termo de busca contém apenas números
          const isNumeric = /^\d+$/.test(trimmedSearch);
          
          if (isNumeric) {
              // Converte para número para remover zeros à esquerda (ex: 000019 vira 19)
              const numericId = parseInt(trimmedSearch, 10);
              // Busca por Nome, Email ou ID exato da Federação
              query = query.or(`full_name.ilike.%${trimmedSearch}%,email.ilike.%${trimmedSearch}%,federation_id.eq.${numericId}`);
          } else {
              // Busca normal por texto
              query = query.or(`full_name.ilike.%${trimmedSearch}%,email.ilike.%${trimmedSearch}%`);
          }
      }

      const { data, count, error } = await query.range(from, to).order('full_name').abortSignal(signal);

      if (error) return { data: null, error };

      const mapped = data?.map(p => {
        const owned = academyMap[p.id] || [];
        return {
            id: p.id, 
            fullName: p.full_name, 
            email: p.email, 
            dob: p.dob, 
            role: p.role, 
            cpf: p.cpf, 
            isBoardingComplete: p.is_boarding_complete, 
            profileImage: p.profile_image_url, 
            federationId: p.federation_id,
            paymentStatus: p.payment_status, 
            athleteData: { belt: p.belt }, 
            documents: { 
                identity: { status: p.doc_identity_status, url: p.doc_identity_url },
                belt: { status: p.doc_belt_status, url: p.doc_belt_url }
            },
            ownedAcademies: owned,
            academy: owned.length > 0 ? { name: owned[0].name, isOwner: true, status: owned[0].status } : undefined
        };
      }) || [];

      return { data: mapped as any, error: null, count };
    }
  );

  const professors = profsData?.data || [];
  const total = profsData?.count || 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Gestão de Professores</h2>
            <p className="text-sm text-gray-500 font-medium">Usuários que possuem unidades vinculadas.</p>
          </div>
          <button onClick={() => refetch()} className="text-cbjjs-blue p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
      </div>

      <div className="relative w-full">
          <Search className="absolute left-4 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou matrícula (ex: 180019)..." 
            className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm text-sm" 
            value={searchTerm} 
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reseta para a primeira página ao buscar
            }} 
          />
      </div>

      {loading ? <AdminListSkeleton /> : errorState ? <AdminErrorState onRetry={() => refetch()} /> : (
        <div className="grid grid-cols-1 gap-4">
            {professors.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-700">
                    <Shield size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Nenhum professor encontrado para esta busca.</p>
                </div>
            ) : professors.map(p => (
                <div key={p.id} onClick={() => setViewingProfId(p.id)} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-cbjjs-blue transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-black overflow-hidden shadow-inner">
                            {p.profileImage ? <img src={p.profileImage} className="w-full h-full object-cover"/> : p.fullName.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold dark:text-white group-hover:text-cbjjs-blue transition-colors">{p.fullName}</h4>
                                {p.federationId && (
                                    <span className="text-[9px] font-mono font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 px-1.5 py-0.5 rounded">
                                        ID: {String(p.federationId).padStart(6, '0')}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                {p.athleteData?.belt ? `Faixa ${p.athleteData.belt}` : 'Professor'} 
                                {p.academy?.name && ` • ${p.academy.name}`}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-none">{p.email}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {!loading && !errorState && total > PAGE_SIZE && (
        <PaginationControls 
            page={page} 
            totalPages={Math.ceil(total/PAGE_SIZE)} 
            onPrev={() => setPage(p => Math.max(1, p-1))} 
            onNext={() => setPage(p => p+1)} 
        />
      )}

      <AdminProfessorDetailsModal 
        isOpen={!!viewingProfId}
        onClose={() => setViewingProfId(null)}
        professorId={viewingProfId}
      />
    </div>
  );
};