import { useState, useMemo } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { User, Belt, Role } from '../types';
import { athleteService } from '../services/athleteService';

export function useAdminContacts() {
  const [selectedBelt, setSelectedBelt] = useState<Belt | 'ALL'>(Belt.BLACK);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: contactsData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<User[]>(
    ['admin-contacts-list'],
    async (signal) => {
      // Busca tanto perfis quanto dependentes que tenham unidade aprovada
      // Usamos !profiles_academy_id_fkey para resolver a ambiguidade do relacionamento
      const [resP, resD] = await Promise.all([
        supabase
          .from('profiles')
          .select('*, academies!profiles_academy_id_fkey(name)')
          .eq('academy_status', 'APPROVED')
          .abortSignal(signal!),
        supabase
          .from('dependents')
          .select('*, academies(name)')
          .eq('academy_status', 'APPROVED')
          .abortSignal(signal!)
      ]);

      if (resP.error) return { data: null, error: resP.error };

      const mappedP = (resP.data || []).map(p => ({
        ...athleteService.mapRawToUser(p, false),
        academyName: (p as any).academies?.name || '---'
      }));

      const mappedD = (resD.data || []).map(d => ({
        ...athleteService.mapRawToUser(d, true),
        academyName: (d as any).academies?.name || '---'
      }));

      return { data: [...mappedP, ...mappedD], error: null };
    }
  );

  const filteredContacts = useMemo(() => {
    let list = contactsData?.data || [];

    // Filtro por Faixa
    if (selectedBelt !== 'ALL') {
      list = list.filter(c => c.athleteData?.belt === selectedBelt);
    }

    // Filtro por Busca (Nome ou Unidade)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(term) || 
        (c as any).academyName.toLowerCase().includes(term)
      );
    }

    return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [contactsData, selectedBelt, searchTerm]);

  return {
    contacts: filteredContacts,
    isLoading,
    isFetching,
    isError,
    selectedBelt,
    setSelectedBelt,
    searchTerm,
    setSearchTerm,
    refetch
  };
}