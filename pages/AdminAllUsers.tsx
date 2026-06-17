"use client";

import React from 'react';
import { Search, RefreshCw, Users } from 'lucide-react';
import { AdminListSkeleton, PaginationControls, AdminErrorState } from '../components/AdminShared';
import { useAdminAllUsers } from '../hooks/useAdminAllUsers';
import { UserListItem } from '../components/admin/UserListItem';
import { UserDetailsModal } from '../components/admin/UserDetailsModal';

export const AdminAllUsers: React.FC = () => {
  const {
    users, totalCount, totalPages, isLoading, isFetching, isError,
    searchTerm, setSearchTerm, page, setPage,
    selectedUser, setSelectedUser, newPassword, setNewPassword,
    isChangingPassword, isDeletingUser, handleUpdatePassword, handleDeleteUser, refetch
  } = useAdminAllUsers();

  return (
    <div className="space-y-6 animate-fadeIn relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Gestão Global</h2>
          <p className="text-sm text-gray-500 font-medium">Todos os usuários cadastrados na plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
             Total no Banco: {totalCount}
          </span>
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
          placeholder="Buscar por nome ou email..." 
          className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cbjjs-blue outline-none transition-all shadow-sm text-sm" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <AdminListSkeleton />
      ) : isError ? (
        <AdminErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-slate-700">
              <Users size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            users.map(user => (
              <UserListItem 
                key={user.id} 
                user={user} 
                onClick={setSelectedUser} 
              />
            ))
          )}
        </div>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <PaginationControls 
          page={page} 
          totalPages={totalPages} 
          onPrev={() => setPage(p => Math.max(1, p - 1))} 
          onNext={() => setPage(p => p + 1)} 
        />
      )}

      <UserDetailsModal 
        user={selectedUser}
        onClose={() => { setSelectedUser(null); setNewPassword(''); }}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        isSubmitting={isChangingPassword}
        isDeleting={isDeletingUser}
        onUpdatePassword={handleUpdatePassword}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
};