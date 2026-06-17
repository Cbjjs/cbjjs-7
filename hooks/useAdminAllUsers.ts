import { useState } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { supabase } from '../lib/supabase';

export function useAdminAllUsers() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const PAGE_SIZE = 12;

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const { data: queryData, isLoading, isError, refetch, isFetching } = useSupabaseQuery<{data: User[], total: number}>(
    ['admin-all-users-list', searchTerm, page],
    async () => {
      try {
        const result = await userService.getAllUsers({ searchTerm, page, pageSize: PAGE_SIZE });
        return { data: result, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  );

  const users = queryData?.data?.data || [];
  const totalCount = queryData?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleUpdatePassword = async () => {
    if (!selectedUser || newPassword.length < 6) {
      addToast('error', "A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.functions.invoke('admin-change-password', {
        body: { targetUserId: selectedUser.id, newPassword }
      });

      if (error) throw error;

      addToast('success', "Senha alterada com sucesso!");
      setNewPassword('');
    } catch (err: any) {
      addToast('error', err.message || "Falha ao alterar senha.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeletingUser(true);
    try {
      await userService.deleteUser(userId);
      addToast('success', "Usuário excluído permanentemente.");
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['admin-all-users-list'] });
    } catch (err: any) {
      addToast('error', err.message || "Erro ao excluir usuário.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  return {
    users,
    totalCount,
    totalPages,
    isLoading,
    isFetching,
    isError,
    searchTerm,
    setSearchTerm: (val: string) => { setSearchTerm(val); setPage(1); },
    page,
    setPage,
    selectedUser,
    setSelectedUser,
    newPassword,
    setNewPassword,
    isChangingPassword,
    isDeletingUser,
    handleUpdatePassword,
    handleDeleteUser,
    refetch
  };
}