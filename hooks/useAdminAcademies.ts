import { useState } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { academyService, AcademyWithProfile } from '../services/academyService';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentStatus } from '../types';

export function useAdminAcademies() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;

  const [subTab, setSubTab] = useState<'approvals' | 'all' | 'trash'>('approvals');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [filterCertificate, setFilterCertificate] = useState<'all' | 'with_certificate'>('all');
  const [viewingAcademy, setViewingAcademy] = useState<AcademyWithProfile | null>(null);
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [rejectingDoc, setRejectingDoc] = useState<{ academyId: string, type: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: queryData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<{data: AcademyWithProfile[], total: number}>(
    ['admin-academies', subTab, searchTerm, page, filterCertificate],
    async (signal) => {
      try {
        const result = await academyService.getAdminAcademies({
          subTab,
          searchTerm,
          page,
          pageSize: PAGE_SIZE,
          onlyWithCertificate: filterCertificate === 'with_certificate'
        });
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  );

  const academies = queryData?.data?.data || [];
  const totalCount = queryData?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleApproveDoc = async (academyId: string, type: string) => {
    setProcessingId(`${academyId}-${type}`);
    try {
      await academyService.updateAcademyDocumentStatus(academyId, type, DocumentStatus.APPROVED);
      addToast('success', "Documento da academia aprovado!");
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
      
      if (viewingAcademy && viewingAcademy.id === academyId) {
        const updated = { ...viewingAcademy };
        (updated as any)[type].status = DocumentStatus.APPROVED;
        setViewingAcademy(updated);
      }
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDoc = (academyId: string, type: string) => {
    setRejectingDoc({ academyId, type });
    setRejectionReason('');
  };

  const confirmRejectDoc = async () => {
    if (!rejectingDoc || !rejectionReason.trim()) return;
    const { academyId, type } = rejectingDoc;
    
    setProcessingId('rejecting');
    try {
      await academyService.updateAcademyDocumentStatus(academyId, type, DocumentStatus.REJECTED, rejectionReason);
      addToast('success', "Documento recusado.");
      setRejectingDoc(null);
      setViewingAcademy(null);
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAcademy = async (academyId: string) => {
    if (processingId) return;
    setProcessingId(academyId);
    try {
      await academyService.approveAcademy(academyId);
      addToast('success', "Academia aprovada com sucesso!");
      setViewingAcademy(null);
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveUpdate = async (requestId: string, academyId: string, newData: any) => {
    if (processingId) return;
    setProcessingId(requestId);
    try {
      await academyService.approveAcademyUpdate(requestId, academyId, newData);
      addToast('success', "Alterações de dados aplicadas!");
      setViewingAcademy(null);
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDelete = async (academyId: string) => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await academyService.deleteAcademy(academyId);
      addToast('success', "Academia enviada para a lixeira.");
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message || "Erro ao excluir.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreAcademy = async (academyId: string) => {
    setProcessingId(academyId);
    try {
      await academyService.restoreAcademy(academyId);
      addToast('success', "Academia restaurada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['admin-academies'] });
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return {
    academies,
    totalCount,
    totalPages,
    isLoading,
    isFetching,
    isError,
    subTab,
    searchTerm,
    page,
    viewingAcademy,
    processingId,
    isDeleting,
    rejectingDoc,
    rejectionReason,
    filterCertificate,
    setFilterCertificate: (val: 'all' | 'with_certificate') => { setFilterCertificate(val); setPage(1); },
    setSubTab: (tab: 'approvals' | 'all' | 'trash') => { setSubTab(tab); setPage(1); setFilterCertificate('all'); },
    setSearchTerm: (term: string) => { setSearchTerm(term); setPage(1); },
    setPage,
    setViewingAcademy,
    setRejectingDoc,
    setRejectionReason,
    refetch,
    handleApproveAcademy,
    handleApproveUpdate,
    handleConfirmDelete,
    handleRestoreAcademy,
    handleApproveDoc,
    handleRejectDoc,
    confirmRejectDoc
  };
}