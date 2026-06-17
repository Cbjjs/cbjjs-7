import { useState, useMemo } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { athleteService } from '../services/athleteService';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { User, DocumentStatus } from '../types';

export function useAdminAthletes() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;

  // Estados de Navegação e Filtro - PADRÃO AGORA É 'BY_ATHLETE'
  const [viewMode, setViewMode] = useState<'BY_ACADEMY' | 'BY_ATHLETE'>('BY_ATHLETE');
  const [selectedAcademy, setSelectedAcademy] = useState<any | null>(null);
  const [subTab, setSubTab] = useState<'approvals' | 'all'>('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); 
  
  // Estados de UI de Detalhe
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<{ userId: string, type: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Busca de Academias com Estatísticas (Nível 1)
  const { 
    data: academiesData, 
    isLoading: loadingAcademies, 
    refetch: refetchAcademies, 
    isFetching: isFetchingAcademies 
  } = useSupabaseQuery<any[]>(
    ['admin-athlete-academies'],
    async () => {
      try {
        const result = await athleteService.getAcademiesWithAthleteStats();
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    { enabled: viewMode === 'BY_ACADEMY' && !selectedAcademy }
  );

  // Filtro e Ordenação Local para o Nível 1 (Academias)
  const academies = useMemo(() => {
    let result = [...(academiesData?.data || [])];
    
    // Filtro por termo de busca
    if (searchTerm && viewMode === 'BY_ACADEMY' && !selectedAcademy) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(term) || 
        (a.team_name && a.team_name.toLowerCase().includes(term))
      );
    }

    // Ordenação
    result.sort((a, b) => {
        return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
    });
    
    return result;
  }, [academiesData, sortOrder, searchTerm, selectedAcademy, viewMode]);

  // 2. Busca de Atletas (Nível 2 OU Visão Global BY_ATHLETE)
  const isGlobalAthleteView = viewMode === 'BY_ATHLETE';
  const shouldFetchAthletes = isGlobalAthleteView || !!selectedAcademy;

  const { 
    data: athletesData, 
    isLoading: loadingAthletes, 
    isError, 
    refetch: refetchAthletes, 
    isFetching: isFetchingAthletes 
  } = useSupabaseQuery<{data: User[], total: number}>(
    ['admin-athletes', viewMode, selectedAcademy?.id, subTab, searchTerm, page],
    async () => {
      try {
        const result = await athleteService.getAdminAthletes({
          subTab, 
          searchTerm, 
          page, 
          pageSize: PAGE_SIZE,
          academyId: selectedAcademy?.id // Se null e BY_ATHLETE, busca todos
        });
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    { enabled: shouldFetchAthletes }
  );

  const athletes = athletesData?.data?.data || [];
  const totalCount = athletesData?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Handlers de Ação
  const handleApproveDoc = async (userId: string, isDependent: boolean, type: string) => {
    setProcessingId(`${userId}-${type}`);
    try {
      await athleteService.updateDocumentStatus(userId, isDependent, type, DocumentStatus.APPROVED);
      addToast('success', "Documento aprovado!");
      queryClient.invalidateQueries({ queryKey: ['admin-athletes'] });
      
      if (viewingUser && viewingUser.id === userId) {
        const updatedDocs = { ...viewingUser.documents };
        (updatedDocs as any)[type].status = DocumentStatus.APPROVED;
        setViewingUser({ ...viewingUser, documents: updatedDocs });
      }
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDoc = (userId: string, type: string) => {
    setRejectingDoc({ userId, type });
    setRejectionReason('');
  };

  const confirmRejectDoc = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) return;
    const { userId, type } = rejectingDoc;
    const isDependent = !!viewingUser?.isDependent;
    
    setProcessingId('rejecting');
    try {
      await athleteService.updateDocumentStatus(userId, isDependent, type, DocumentStatus.REJECTED, rejectionReason);
      addToast('success', "Documento recusado.");
      setRejectingDoc(null);
      setViewingUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-athletes'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsPaid = async (userId: string, isDependent: boolean) => {
    setProcessingId(`${userId}-payment`);
    try {
      await athleteService.markAsPaid(userId, isDependent);
      addToast('success', "Pagamento confirmado manualmente!");
      queryClient.invalidateQueries({ queryKey: ['admin-athletes'] });
      setViewingUser(null);
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateFederationId = async (userId: string, isDependent: boolean, newId: string) => {
    setProcessingId(`${userId}-update-id`);
    try {
      const idNum = parseInt(newId);
      if (isNaN(idNum)) throw new Error("ID deve ser um número");
      
      await athleteService.updateFederationId(userId, isDependent, idNum);
      addToast('success', "Matrícula atualizada!");
      queryClient.invalidateQueries({ queryKey: ['admin-athletes'] });
      if (viewingUser) setViewingUser({ ...viewingUser, federationId: idNum });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveFederation = async (userId: string, isDependent: boolean) => {
    setProcessingId(`${userId}-federation`);
    try {
      await athleteService.approveFederation(userId, isDependent);
      addToast('success', "Atleta aprovado na federação!");
      queryClient.invalidateQueries({ queryKey: ['admin-athletes'] });
      setViewingUser(null);
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return {
    // Estado de Navegação
    viewMode,
    setViewMode: (mode: 'BY_ACADEMY' | 'BY_ATHLETE') => {
        setViewMode(mode);
        setSelectedAcademy(null);
        setPage(1);
        setSearchTerm('');
    },
    academies,
    selectedAcademy,
    setSelectedAcademy,
    sortOrder,
    setSortOrder,
    
    // Estado de Dados
    athletes,
    totalCount,
    totalPages,
    isLoading: loadingAcademies || loadingAthletes,
    isFetching: isFetchingAcademies || isFetchingAthletes,
    isError,
    subTab,
    searchTerm,
    page,
    viewingUser,
    processingId,
    rejectingDoc,
    rejectionReason,

    // Setters
    setSubTab: (tab: 'approvals' | 'all') => { setSubTab(tab); setPage(1); },
    setSearchTerm: (term: string) => { setSearchTerm(term); setPage(1); },
    setPage,
    setViewingUser,
    setRejectionReason,
    setRejectingDoc,

    // Handlers
    refetch: shouldFetchAthletes ? refetchAthletes : refetchAcademies,
    handleApproveDoc,
    handleRejectDoc,
    confirmRejectDoc,
    handleMarkAsPaid,
    handleUpdateFederationId,
    handleApproveFederation
  };
}