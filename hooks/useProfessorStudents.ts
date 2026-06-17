import { useState, useMemo } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { studentService } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';

export function useProfessorStudents() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: queryData, isLoading, isFetching, isError, refetch } = useSupabaseQuery<{mappedStudents: User[], hasAc: boolean}>(
    ['my-students', user?.id],
    async () => {
      if (!user?.id) return { data: { mappedStudents: [], hasAc: false }, error: null };
      
      try {
        const result = await studentService.getProfessorStudents(user.id);
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    { enabled: !!user?.id }
  );

  const allStudents = queryData?.data?.mappedStudents || [];

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const isPending = (s.academy?.status || 'PENDING') === 'PENDING' || (s.pendingRequests?.length || 0) > 0;
      return filter === 'APPROVED' ? !isPending : isPending;
    });
  }, [allStudents, filter]);

  const handleApproveStudent = async (student: User) => {
    setProcessingId(student.id);
    try {
      await studentService.approveAcademyLink(student.id, !!student.isDependent);
      addToast('success', "Matrícula aprovada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['my-students'] });
      return true;
    } catch (error: any) {
      addToast('error', error.message || "Erro ao aprovar matrícula.");
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  return {
    students: filteredStudents,
    totalCount: allStudents.length,
    isLoading,
    isFetching,
    isError,
    filter,
    setFilter,
    processingId,
    handleApproveStudent,
    refetch
  };
}